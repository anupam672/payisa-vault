const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

/**
 * - Routes required
 */
const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRoutes = require("./routes/transaction.routes");
const adminRoutes = require("./routes/admin.routes");

/**
 * - Use Routes
 */

app.get("/", (req, res) => {
    res.send("Payisa Vault API is up and running");
});

app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRoutes);
app.use("/api/admin", adminRoutes);

/**
 * - 404 handler for unmatched routes
 */
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

/**
 * - Global error handler
 */
app.use((err, req, res, next) => {
    console.error(err);

    if (err.name === "CastError") {
        return res.status(400).json({
            message: `Invalid value for ${err.path}`
        });
    }

    if (err.name === "ValidationError") {
        return res.status(400).json({
            message: err.message
        });
    }

    return res.status(500).json({
        message: "Something went wrong, please try again later"
    });
});

module.exports = app;