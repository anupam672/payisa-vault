const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const mongoose = require("mongoose")

/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
     * 1. Validate request
     * 2. Validate idempotency key
     * 3. Check account status
     * 4. Derive sender balance from ledger
     * 5. Create transaction (PENDING)
     * 6. Create DEBIT ledger entry
     * 7. Create CREDIT ledger entry
     * 8. Mark transaction COMPLETED
     * 9. Commit MongoDB session
     * 10. Send email notification
 */

async function createTransaction(req, res) {

    /**
     * 1. Validate request
     */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "FromAccount, toAccount, amount and idempotencyKey are required"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }

    /**
     * 2. Validate idempotency key
     */

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })

        }

        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still processing",
            })
        }

        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction processing failed, please retry"
            })
        }

        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed, please retry"
            })
        }
    }

    /**
     * 3. Check account status
     */

    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }

    /**
     * 4. Derive sender balance from ledger
     */
    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
        })
    }

    let transaction;
    let session;
    try {

        /**
         * 5. Create transaction (PENDING)
         */
        session = await mongoose.startSession()
        session.startTransaction()

        transaction = (await transactionModel.create([ {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        } ], { session }))[ 0 ]

        const debitLedgerEntry = await ledgerModel.create([ {
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        } ], { session })

        const creditLedgerEntry = await ledgerModel.create([ {
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        } ], { session })

        await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session }
        )

       await session.commitTransaction()
        session.endSession()

        transaction.status = "COMPLETED"
    } catch (error) {

        if (session) {
            await session.abortTransaction()
            session.endSession()
        }

        return res.status(400).json({
            message: "Transaction is Pending due to some issue, please retry after sometime",
        })

    }
    /**
     * 10. Send email notification
     */
    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })

}

/**
 * Internal reusable helper: moves funds from a system/admin account into a
 * target account using the same safe pattern as createTransaction (session,
 * idempotency check, rollback on failure). Used by:
 *   - createInitialFundsTransaction (POST /api/transactions/system/initial-funds)
 *   - the automatic signup bonus (see account.controller.js)
 *   - admin credit/debit endpoints (see admin.controller.js)
 *
 * Does not send a response itself — returns { status, body } so callers
 * (route controllers) decide how to respond.
 */
async function moveSystemFunds({ fromAccountId, toAccountId, amount, idempotencyKey, reason }) {

    const existing = await transactionModel.findOne({ idempotencyKey })

    if (existing) {
        if (existing.status === "COMPLETED") {
            return { status: 200, body: { message: "Transaction already processed", transaction: existing } }
        }
        if (existing.status === "PENDING") {
            return { status: 200, body: { message: "Transaction is still processing" } }
        }
        return { status: 500, body: { message: "Transaction previously failed or was reversed, please retry with a new idempotency key" } }
    }

    let transaction
    let session
    try {
        session = await mongoose.startSession()
        session.startTransaction()

        transaction = (await transactionModel.create([ {
            fromAccount: fromAccountId,
            toAccount: toAccountId,
            amount,
            idempotencyKey,
            status: "PENDING",
            ...(reason ? { reason } : {})
        } ], { session }))[ 0 ]

        await ledgerModel.create([ {
            account: fromAccountId,
            amount,
            transaction: transaction._id,
            type: "DEBIT"
        } ], { session })

        await ledgerModel.create([ {
            account: toAccountId,
            amount,
            transaction: transaction._id,
            type: "CREDIT"
        } ], { session })

        await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session }
        )

        await session.commitTransaction()
        session.endSession()

        transaction.status = "COMPLETED"

        return { status: 201, body: { message: "Transaction completed successfully", transaction } }

    } catch (error) {

        if (session) {
            await session.abortTransaction()
            session.endSession()
        }

        return { status: 400, body: { message: "Transaction is Pending due to some issue, please retry after sometime" } }
    }
}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }

    const result = await moveSystemFunds({
        fromAccountId: fromUserAccount._id,
        toAccountId: toAccount,
        amount,
        idempotencyKey
    })

    return res.status(result.status).json(result.body)
}

/**
 * - GET /api/transactions/
 * - Returns the logged-in user's transaction history: every transaction
 *   where one of the user's accounts is either the sender or receiver.
 * - Each entry is shaped for direct UI use: senderName, receiverName,
 *   amount, type (SENT/RECEIVED relative to the logged-in user), date,
 *   status — matching what the frontend history table needs.
 * - Supports simple pagination via ?page=&limit= (defaults: page 1, limit 20)
 */
async function getTransactionHistory(req, res) {

    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100)
    const skip = (page - 1) * limit

    const myAccounts = await accountModel.find({ user: req.user._id }).select("_id")
    const myAccountIds = myAccounts.map(a => a._id)

    if (myAccountIds.length === 0) {
        return res.status(200).json({
            transactions: [],
            page,
            limit,
            total: 0,
            totalPages: 0
        })
    }

    const filter = {
        $or: [
            { fromAccount: { $in: myAccountIds } },
            { toAccount: { $in: myAccountIds } }
        ]
    }

    const [ transactions, total ] = await Promise.all([
        transactionModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({ path: "fromAccount", select: "user", populate: { path: "user", select: "name email" } })
            .populate({ path: "toAccount", select: "user", populate: { path: "user", select: "name email" } }),
        transactionModel.countDocuments(filter)
    ])

    const myAccountIdSet = new Set(myAccountIds.map(id => id.toString()))

    const shaped = transactions.map(tx => shapeTransactionForUser(tx, myAccountIdSet))

    return res.status(200).json({
        transactions: shaped,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
    })
}

/**
 * - GET /api/transactions/:id
 * - Returns full detail for a single transaction, but only if the logged-in
 *   user owns the sending or receiving account — otherwise 404 (never leak
 *   whether a transaction ID exists to someone who isn't party to it).
 */
async function getTransactionById(req, res) {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid transaction id" })
    }

    const transaction = await transactionModel.findById(id)
        .populate({ path: "fromAccount", select: "user", populate: { path: "user", select: "name email" } })
        .populate({ path: "toAccount", select: "user", populate: { path: "user", select: "name email" } })

    if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" })
    }

    const myAccounts = await accountModel.find({ user: req.user._id }).select("_id")
    const myAccountIdSet = new Set(myAccounts.map(a => a._id.toString()))

    const isParty =
        myAccountIdSet.has(transaction.fromAccount?._id?.toString()) ||
        myAccountIdSet.has(transaction.toAccount?._id?.toString())

    if (!isParty) {
        return res.status(404).json({ message: "Transaction not found" })
    }

    return res.status(200).json({
        transaction: shapeTransactionForUser(transaction, myAccountIdSet)
    })
}

/**
 * Shapes a populated transaction document into the flat structure the
 * frontend needs: sender/receiver display names, direction relative to
 * the requesting user (SENT/RECEIVED), and account IDs for reference.
 */
function shapeTransactionForUser(tx, myAccountIdSet) {
    const fromUser = tx.fromAccount?.user
    const toUser = tx.toAccount?.user

    const senderName = fromUser?.name || "System"
    const receiverName = toUser?.name || "System"

    const isSender = myAccountIdSet.has(tx.fromAccount?._id?.toString())

    return {
        _id: tx._id,
        amount: tx.amount,
        status: tx.status,
        type: isSender ? "SENT" : "RECEIVED",
        senderName,
        senderEmail: fromUser?.email || null,
        receiverName,
        receiverEmail: toUser?.email || null,
        fromAccount: tx.fromAccount?._id,
        toAccount: tx.toAccount?._id,
        reason: tx.reason || null,
        note: tx.note || null,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt
    }
}

module.exports = {
    moveSystemFunds,
    createTransaction,
    createInitialFundsTransaction,
    getTransactionHistory,
    getTransactionById
}