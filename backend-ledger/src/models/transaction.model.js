const mongoose = require("mongoose")


const transactionSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [ true, "Transaction must be associated with a from account" ],
        index: true
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [ true, "Transaction must be associated with a to account" ],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: [ "PENDING", "COMPLETED", "FAILED", "REVERSED" ],
            message: "Status can be either PENDING, COMPLETED, FAILED or REVERSED",
        },
        default: "PENDING"
    },
    amount: {
        type: Number,
        required: [ true, "Amount is required for creating a transaction" ],
        min: [ 0, "Transaction amount cannot be negative" ]
    },
    idempotencyKey: {
        type: String,
        required: [ true, "Idempotency Key is required for creating a transaction" ],
        index: true,
        unique: true
    },
    reason: {
        type: String,
        enum: {
            values: [ "SIGNUP_BONUS", "ADMIN_CREDIT", "ADMIN_DEBIT" ],
            message: "Reason must be one of SIGNUP_BONUS, ADMIN_CREDIT or ADMIN_DEBIT"
        }
        // omitted entirely for normal peer-to-peer transfers between users
    },
    note: {
        type: String,
        trim: true,
        maxlength: [ 500, "Note cannot exceed 500 characters" ]
        // free-text context for admin credit/debit actions (e.g. dispute reference)
    }
}, {
    timestamps: true
})

const transactionModel = mongoose.model("transaction", transactionSchema)


module.exports = transactionModel   