const accountModel = require("../models/account.model")
const { moveSystemFunds } = require("./transaction.controller")

/**
 * - POST /api/admin/accounts/:accountId/credit
 * - Admin adds funds to a user's account (e.g. dispute resolution, goodwill credit)
 * - Protected: authSystemUserMiddleware (systemUser: true)
 */
async function adminCreditAccount(req, res) {
    const { accountId } = req.params
    const { amount, idempotencyKey, note } = req.body

    if (!amount || !idempotencyKey) {
        return res.status(400).json({
            message: "amount and idempotencyKey are required"
        })
    }

    if (amount <= 0) {
        return res.status(400).json({
            message: "amount must be greater than 0"
        })
    }

    const targetAccount = await accountModel.findById(accountId)

    if (!targetAccount) {
        return res.status(404).json({
            message: "Account not found"
        })
    }

    const adminAccount = await accountModel.findOne({ user: req.user._id })

    if (!adminAccount) {
        return res.status(400).json({
            message: "System/admin account not found"
        })
    }

    const result = await moveSystemFunds({
        fromAccountId: adminAccount._id,
        toAccountId: targetAccount._id,
        amount,
        idempotencyKey,
        reason: "ADMIN_CREDIT"
    })

    if (note && result.body.transaction) {
        // Non-critical: attach the admin's note to the transaction after creation.
        // Failure here shouldn't fail the whole request since funds already moved.
        try {
            const transactionModel = require("../models/transaction.model")
            await transactionModel.findByIdAndUpdate(result.body.transaction._id, { note })
        } catch (err) {
            console.error("Failed to attach note to admin credit transaction:", err)
        }
    }

    return res.status(result.status).json(result.body)
}

/**
 * - POST /api/admin/accounts/:accountId/debit
 * - Admin retracts funds from a user's account (e.g. reversing a disputed credit)
 * - Protected: authSystemUserMiddleware (systemUser: true)
 * - Implemented as a compensating transfer FROM the user's account TO the
 *   system account — never edits/deletes existing ledger entries, keeping
 *   the immutable-ledger guarantee intact.
 */
async function adminDebitAccount(req, res) {
    const { accountId } = req.params
    const { amount, idempotencyKey, note } = req.body

    if (!amount || !idempotencyKey) {
        return res.status(400).json({
            message: "amount and idempotencyKey are required"
        })
    }

    if (amount <= 0) {
        return res.status(400).json({
            message: "amount must be greater than 0"
        })
    }

    const targetAccount = await accountModel.findById(accountId)

    if (!targetAccount) {
        return res.status(404).json({
            message: "Account not found"
        })
    }

    const adminAccount = await accountModel.findOne({ user: req.user._id })

    if (!adminAccount) {
        return res.status(400).json({
            message: "System/admin account not found"
        })
    }

    const currentBalance = await targetAccount.getBalance()

    if (currentBalance < amount) {
        return res.status(400).json({
            message: `Cannot retract ${amount}, account balance is only ${currentBalance}`
        })
    }

    const result = await moveSystemFunds({
        fromAccountId: targetAccount._id,
        toAccountId: adminAccount._id,
        amount,
        idempotencyKey,
        reason: "ADMIN_DEBIT"
    })

    if (note && result.body.transaction) {
        try {
            const transactionModel = require("../models/transaction.model")
            await transactionModel.findByIdAndUpdate(result.body.transaction._id, { note })
        } catch (err) {
            console.error("Failed to attach note to admin debit transaction:", err)
        }
    }

    return res.status(result.status).json(result.body)
}

module.exports = {
    adminCreditAccount,
    adminDebitAccount
}
