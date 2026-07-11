const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const adminController = require("../controllers/admin.controller")

const router = express.Router()

/**
 * - POST /api/admin/accounts/:accountId/credit
 * - Admin adds funds to a user's account (dispute resolution, goodwill credit)
 * - Protected Route: system user only
 */
router.post("/accounts/:accountId/credit", authMiddleware.authSystemUserMiddleware, adminController.adminCreditAccount)

/**
 * - POST /api/admin/accounts/:accountId/debit
 * - Admin retracts funds from a user's account (e.g. reversing a disputed credit)
 * - Protected Route: system user only
 */
router.post("/accounts/:accountId/debit", authMiddleware.authSystemUserMiddleware, adminController.adminDebitAccount)

module.exports = router
