const accountModel = require("../models/account.model");
const userModel = require("../models/user.model");
const { moveSystemFunds } = require("./transaction.controller");

const SIGNUP_BONUS_AMOUNT = 1000;

async function createAccountController(req, res) {
    const user = req.user;

    const accountCount = await accountModel.countDocuments({
        user: user._id
    });

    const isFirstAccount = accountCount === 0;

    if (accountCount >= 2) {
        return res.status(400).json({
            message: "Maximum 2 accounts allowed per user"
        });
    }

    const account = await accountModel.create({
        user: user._id
    });

    let bonusTransaction = null;

    if (isFirstAccount) {
        try {
            const systemUser = await userModel
                .findOne({ systemUser: true })
                .select("+systemUser");

            if (!systemUser) {
                console.warn(
                    "No system user found — skipping signup bonus. Seed a user with systemUser: true to enable it."
                );
            } else {
                const systemAccount = await accountModel.findOne({
                    user: systemUser._id
                });

                if (!systemAccount) {
                    console.warn(
                        "System user has no account — skipping signup bonus. Create an account for the system user to enable it."
                    );
                } else {
                    const result = await moveSystemFunds({
                        fromAccountId: systemAccount._id,
                        toAccountId: account._id,
                        amount: SIGNUP_BONUS_AMOUNT,
                        idempotencyKey: `signup-bonus-${account._id}`,
                        reason: "SIGNUP_BONUS"
                    });

                    if (
                        result.status === 201 ||
                        result.status === 200
                    ) {
                        bonusTransaction =
                            result.body.transaction;
                    } else {
                        console.warn(
                            "Signup bonus transfer did not complete:",
                            result.body.message
                        );
                    }
                }
            }
        } catch (err) {
            console.error(
                "Error while crediting signup bonus:",
                err
            );
        }
    }

    res.status(201).json({
        account,
        signupBonus: bonusTransaction
            ? {
                  amount: SIGNUP_BONUS_AMOUNT,
                  transactionId: bonusTransaction._id
              }
            : null
    });
}

async function getUserAccountsController(req, res) {
    const accounts = await accountModel.find({
        user: req.user._id
    });

    res.status(200).json({
        accounts
    });
}

async function getAccountBalanceController(req, res) {
    const { accountId } = req.params;

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    });

    if (!account) {
        return res.status(404).json({
            message: "Account not found"
        });
    }

    const balance = await account.getBalance();

    res.status(200).json({
        accountId: account._id,
        balance: balance
    });
}

module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController
};