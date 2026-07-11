/**
 * Seeds the "system user" and "system account" that the ledger backend
 * needs in order to:
 *   - credit the ₹1,000 signup bonus to new accounts (account.controller.js)
 *   - allow the admin credit/debit endpoints to work (admin.controller.js)
 *   - allow POST /api/transactions/system/initial-funds to work
 *
 * Without this, those features fail gracefully (they don't crash anything)
 * but silently do nothing — the only sign is a console.warn in the backend
 * logs saying "No system user found — skipping signup bonus."
 *
 * This script is idempotent: running it multiple times will not create
 * duplicate system users/accounts. Safe to re-run any time.
 *
 * Usage:
 *   node scripts/seed.js
 *
 * Requires a working .env (same one the server uses) with at least MONGO_URI.
 */

require("dotenv").config()
const mongoose = require("mongoose")
const userModel = require("../src/models/user.model")
const accountModel = require("../src/models/account.model")

const SYSTEM_EMAIL = process.env.SEED_SYSTEM_EMAIL || "system@ledger.internal"
const SYSTEM_NAME = "System"
const SYSTEM_PASSWORD = process.env.SEED_SYSTEM_PASSWORD || "system-account-not-for-login-123"

async function seed() {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not set. Copy .env.example to .env and fill it in first.")
        process.exit(1)
    }

    await mongoose.connect(process.env.MONGO_URI)
    console.log("Connected to DB")

    let systemUser = await userModel.findOne({ systemUser: true }).select("+systemUser")

    if (systemUser) {
        console.log(`System user already exists (id: ${systemUser._id}, email: ${systemUser.email})`)
    } else {
        const existingByEmail = await userModel.findOne({ email: SYSTEM_EMAIL })
        if (existingByEmail) {
            console.error(
                `A user with email ${SYSTEM_EMAIL} already exists but is not marked systemUser: true.\n` +
                `Either set SEED_SYSTEM_EMAIL to a different address, or manually update that user's ` +
                `systemUser field in the database (systemUser is immutable from the app layer, so this ` +
                `needs a direct DB update, e.g. in MongoDB Atlas or mongosh).`
            )
            process.exit(1)
        }

        systemUser = await userModel.create({
            email: SYSTEM_EMAIL,
            name: SYSTEM_NAME,
            password: SYSTEM_PASSWORD,
            systemUser: true
        })
        console.log(`Created system user (id: ${systemUser._id}, email: ${systemUser.email})`)
    }

    let systemAccount = await accountModel.findOne({ user: systemUser._id })

    if (systemAccount) {
        console.log(`System account already exists (id: ${systemAccount._id})`)
    } else {
        systemAccount = await accountModel.create({
            user: systemUser._id
        })
        console.log(`Created system account (id: ${systemAccount._id})`)
    }

    console.log("\nSeed complete. Signup bonus and admin credit/debit endpoints should now work.")
    console.log(`System account has no starting balance — it will go negative as it hands out signup bonuses, which is expected: it's the counterparty on every system-issued credit, not a real funded account.`)

    await mongoose.disconnect()
    process.exit(0)
}

seed().catch((err) => {
    console.error("Seed failed:", err)
    process.exit(1)
})