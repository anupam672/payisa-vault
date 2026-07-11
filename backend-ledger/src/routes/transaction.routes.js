const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const transactionController = require("../controllers/transaction.controller")

const transactionRoutes = Router();

/**
 * - POST /api/transactions/
 * - Create a new transaction
 */

transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)

/**
 * - GET /api/transactions/
 * - Logged-in user's transaction history (paginated)
 */
transactionRoutes.get("/", authMiddleware.authMiddleware, transactionController.getTransactionHistory)

/**
 * - GET /api/transactions/:id
 * - Full detail for a single transaction the logged-in user is party to
 */
transactionRoutes.get("/:id", authMiddleware.authMiddleware, transactionController.getTransactionById)


/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes;