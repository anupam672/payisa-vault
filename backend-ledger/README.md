# Payisa Vault — Backend

Express + MongoDB API powering the Payisa Vault ledger platform. See the [root README](../README.md) for a full project overview and architecture.

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

```env
MONGO_URI=
JWT_SECRET=
FRONTEND_URL=
EMAIL_USER=
CLIENT_ID=
CLIENT_SECRET=
REFRESH_TOKEN=
```

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | Any long random string, used to sign JWTs |
| `FRONTEND_URL` | Your frontend's URL, for CORS (defaults to `http://localhost:5173`) |
| `EMAIL_USER` | Gmail address used to send notifications |
| `CLIENT_ID` / `CLIENT_SECRET` / `REFRESH_TOKEN` | Gmail OAuth2 credentials (Google Cloud Console) |

## Seed the system account

The signup bonus and admin credit/debit endpoints both move funds from a "system account." Create it once with:

```bash
npm run seed
```

Safe to re-run — it checks for an existing system user/account before creating new ones.

## Run

```bash
npm run dev      # with nodemon
npm start        # plain node
```

Server runs on `http://localhost:3000` by default.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start with nodemon (auto-restart on changes) |
| `npm start` | Start normally |
| `npm run seed` | Create the system user/account |

## API Endpoints

See the [root README](../README.md#api-endpoints) for the full endpoint table.