# TrustPay - Blockchain Payment Platform

TrustPay is a secure, blockchain-powered cryptocurrency payment platform designed for merchants and individuals. It enables users to send, receive, and manage cryptocurrency transactions with ease.

## Features

- User authentication (register, login, profile management)
- Cryptocurrency wallet management (create, connect, view, delete)
- Transaction processing (send payments, view transaction history)
- Multiple cryptocurrency support (XRP, ETH, BTC, USDT, USDC)
- Real-time transaction tracking
- Dashboard with financial overview

How TrustPay Uses XRP Ledger (XRPL)

TrustPay integrates the XRP Ledger (XRPL) to provide the following core functionalities:

✅ Instant Cross-Border Payments
XRPL Ledger Integration:
TrustPay utilizes XRPL’s decentralized ledger to facilitate instant global transactions, significantly reducing transaction times from days to seconds.

✅ Smart Contract Automation (Hooks)
XRPL Hooks:
TrustPay implements XRPL Hooks (smart contracts) to automate transaction validation, execution, and settlement, ensuring secure, transparent, and tamper-proof payments.

✅ Asset Tokenization & Management
Tokenized Assets:
TrustPay leverages XRPL’s tokenization capabilities to securely manage digital assets, providing users with full control and transparency.

✅ Enhanced Security & Scalability
Consensus Protocol:
XRPL’s robust consensus mechanism ensures high security, decentralization, and scalability, enabling TrustPay to efficiently handle large transaction volumes.

✅ Wallet Integration
XRPL-Compatible Wallets:
TrustPay seamlessly integrates XRPL-compatible wallets (e.g., XUMM, XRPL Snap for MetaMask), providing users with secure and intuitive wallet management.

## Tech Stack

### Frontend
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Context API for state management
- Axios for API calls

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- JSON Web Tokens (JWT) for authentication
- Crypto libraries for wallet management

## Project Structure

```
/
├── frontend/               # Next.js frontend application
│   ├── app/                # App router directory
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context providers
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript type definitions
│   │   ├── page.tsx        # Home page
│   │   └── providers.tsx   # Context providers wrapper
│   └── public/             # Static assets
│
└── backend/                # Express.js backend application
    ├── src/
    │   ├── config/         # Configuration files
    │   ├── controllers/    # Request handlers
    │   ├── middleware/     # Express middleware
    │   ├── models/         # Mongoose schema models
    │   ├── routes/         # API routes
    │   ├── services/       # Business logic
    │   ├── types/          # TypeScript type definitions
    │   ├── utils/          # Utility functions
    │   └── server.ts       # Express app entry point
    └── package.json        # Backend dependencies
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB database
- Git

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/trustpay.git
   cd trustpay
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd ../frontend
   npm install
   ```

4. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```

5. Create a `.env.local` file in the frontend directory:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

3. Access the application at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user data
- `POST /api/auth/logout` - User logout

### Wallets
- `GET /api/wallets` - Get user wallets
- `POST /api/wallets` - Create a new wallet
- `POST /api/wallets/connect` - Connect external wallet
- `DELETE /api/wallets/:id` - Delete a wallet

### Transactions
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Process a payment
- `GET /api/transactions/:id` - Get transaction details
- `PATCH /api/transactions/:id` - Update transaction status

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Blockchain technology providers
- Open-source community for libraries and tools 
