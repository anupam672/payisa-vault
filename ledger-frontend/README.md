# Payisa Vault — Frontend

React (Vite) dashboard for the Payisa Vault ledger platform. See the [root README](../README.md) for a full project overview and architecture.

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

```env
VITE_API_BASE_URL=
```

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Your backend API's base URL (e.g. `http://localhost:3000/api`) |

Make sure the backend is running first, and its `FRONTEND_URL` env var matches wherever this app runs (Vite may pick a port other than 5173 if it's already in use).

## Run

```bash
npm run dev
```

## Pages

| Route | Description |
|---|---|
| `/login` | Sign in |
| `/register` | Create an account |
| `/accounts` | List accounts, view balances, create a new account |
| `/send` | Transfer funds to another account |
| `/transaction-complete` | Confirmation screen shown right after a transfer |
| `/history` | Paginated transaction history |
| `/transactions/:id` | Full detail for a single transaction |

## Tech

React 19, Vite, React Router, plain `fetch` (no state library) — hand-written CSS with a small design-token system in `src/index.css`.