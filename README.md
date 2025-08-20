# Payment Terminal Backend (Production-Ready)

Node.js + Express + MongoDB backend implementing MTI-like payment flows, payouts, JWT auth, and Socket.IO live updates.

## Features
- User registration & login (JWT)
- Process transactions through an MTI-style flow (0100/0110/0200/0210)
- Payout initiation (bank/crypto mocks)
- Real-time notifications via Socket.IO
- MongoDB models for Users & Transactions
- Security hardening: helmet, CORS, rate-limits, compression, logging
- Validation with Joi
- Pagination on history endpoints

## Quick Start

```bash
cp .env.example .env
# edit .env as needed

npm install
npm run dev
# server at http://localhost:5000
```

### MongoDB
Set `MONGODB_URI` in `.env` (defaults to local).

### Socket.IO Client Auth
Pass `{ auth: { token: <JWT> } }` when connecting. Server joins you to room `merchant_<merchantId>`.

## API

- `POST /api/auth/register` `{ email, password, businessName }`
- `POST /api/auth/login` `{ email, password }`
- `GET /api/auth/me` (Bearer token)

- `POST /api/transactions/process`
```json
{
  "cardHolderName": "Jane Doe",
  "cardNumber": "4242 4242 4242 4242",
  "expiryDate": "12/27",
  "cvv": "123",
  "amount": 100.50,
  "currency": "USD",
  "protocol": "POS Terminal -101.1 (4-digit approval)",
  "authCode": "1234",
  "isOnline": true,
  "payoutMethod": "bank"
}
```
- `GET /api/transactions/history?page=1&limit=10`
- `GET /api/transactions/:transactionId`
- `GET /api/payouts/status/:id`

## Notes

- **Do not** store raw PAN/CVV in production. Use a PCI-compliant vault/tokenization. This repo stores minimal demo data for flow simulation only.
- Replace payout mocks with real providers.
- Set strong `JWT_SECRET` in `.env`.
