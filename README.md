# Payisa Vault

A full-stack double-entry ledger and payments platform , built like a simplified digital wallet, with an immutable accounting core, atomic fund transfers, JWT authentication, and a branded email notification system.

**Live demo:** [https://payisa-vault-odxm.vercel.app/](#) &nbsp;·&nbsp; **Backend API:** [https://payisa-vault-backend.onrender.com](#)


## Overview

Payisa Vault lets users open accounts, receive a welcome credit, and transfer funds to each other — with every rupee tracked through **immutable double-entry ledger records** rather than a mutable balance field. This is the same accounting pattern used by real payment platforms: balances are never stored directly, they're always *derived* by summing credit and debit entries, so the full transaction history is always auditable.

## Features

- **JWT authentication** — registration, login, logout with token blacklisting, bcrypt password hashing
- **Double-entry ledger core** — account balances are computed from immutable ledger entries, never stored/mutated directly
- **Atomic fund transfers** — MongoDB session-based transactions with automatic rollback on failure, and idempotency-key protection against duplicate transfer requests
- **Signup bonus** — new users automatically receive a welcome credit on their first account (capped at 2 accounts per email)
- **Admin dispute resolution** — credit/debit endpoints for admins to correct account balances, fully auditable via the same ledger system
- **Transaction history & detail views** — paginated history with sender/receiver names, direction (sent/received), status, and a dedicated detail page per transaction
- **Branded transactional emails** — HTML email notifications (welcome, transfer success/failure) sent via Gmail OAuth2
- **Responsive React dashboard** — accounts overview, send-money flow, transaction history, and a transfer-confirmation screen

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router |
| Backend | Node.js, Express 5 |
| Database | MongoDB (Mongoose) |
| Auth | JWT, bcrypt |
| Email | Nodemailer + Gmail OAuth2 |
| Deployment | Render (backend), Vercel (frontend) |

## Architecture

```
┌─────────────────┐      REST API       ┌──────────────────┐      Mongoose      ┌─────────────┐
│  React Frontend  │ ──────────────────► │  Express Backend  │ ─────────────────► │  MongoDB     │
│  (Vercel)        │ ◄────────────────── │  (Render)          │ ◄───────────────── │  Atlas       │
└─────────────────┘     JWT / JSON       └──────────────────┘                     └─────────────┘
                                                    │
                                                    ▼
                                          Gmail OAuth2 (Nodemailer)
```

Every transfer runs inside a MongoDB session: a `transaction` document is created as `PENDING`, a `DEBIT` ledger entry and a `CREDIT` ledger entry are written, the transaction is marked `COMPLETED`, and the whole thing is committed atomically — if anything fails partway through, the session is aborted and nothing is left in an inconsistent state.

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Log in, returns JWT |
| POST | `/api/auth/logout` | — | Blacklist current token |
| POST | `/api/accounts/` | User | Create an account (2 max per user, signup bonus on first) |
| GET | `/api/accounts/` | User | List logged-in user's accounts |
| GET | `/api/accounts/balance/:accountId` | User | Get derived balance |
| POST | `/api/transactions/` | User | Transfer funds between two accounts |
| GET | `/api/transactions/` | User | Paginated transaction history |
| GET | `/api/transactions/:id` | User | Single transaction detail |
| POST | `/api/transactions/system/initial-funds` | System user | Credit funds from the system account to any account |
| POST | `/api/admin/accounts/:accountId/credit` | Admin | Credit funds (dispute resolution) |
| POST | `/api/admin/accounts/:accountId/debit` | Admin | Debit funds (dispute resolution) |

## Project Structure

```
payisa-vault/
├── backend-ledger/     # Express API — see backend-ledger/README.md
└── ledger-frontend/    # React dashboard — see ledger-frontend/README.md
```

## Getting Started

### 1. Clone

```bash
git clone https://github.com/anupam672/payisa-vault.git
cd payisa-vault
```

### 2. Backend

```bash
cd backend-ledger
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, Gmail OAuth2 credentials
npm run seed            # creates the system account (needed for signup bonus & admin actions)
npm run dev
```

### 3. Frontend

```bash
cd ledger-frontend
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your backend
npm run dev
```

Full setup details, environment variables, and troubleshooting are in each subfolder's README.

## Environment Variables

### Backend (`backend-ledger/.env`)

```env
MONGO_URI=
JWT_SECRET=
FRONTEND_URL=
EMAIL_USER=
CLIENT_ID=
CLIENT_SECRET=
REFRESH_TOKEN=
```

### Frontend (`ledger-frontend/.env`)

```env
VITE_API_BASE_URL=
```

## License

MIT