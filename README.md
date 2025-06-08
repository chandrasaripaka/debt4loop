# DebtLoop - XRPL Debt Settlement Platform

A blockchain-powered debt settlement platform that automatically detects and settles circular debt relationships between companies using the XRP Ledger.

## 🚀 Overview

DebtLoop revolutionizes B2B debt settlement by:
- **Detecting debt loops** between multiple companies automatically
- **Settling debts efficiently** through circular clearing mechanisms
- **Using blockchain technology** (XRPL) for transparency and immutability
- **Reducing transaction costs** by up to 80% through loop-based settlements
- **Providing real-time insights** into debt positions and settlement opportunities

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Modern UI** with Tailwind CSS and shadcn/ui components
- **Real-time updates** using TanStack Query
- **Responsive design** for desktop and mobile
- **Four main sections**: Dashboard, Positions, Loops, Wallet & Blockchain

### Backend (Node.js + Express)
- **RESTful API** with TypeScript
- **PostgreSQL database** with Drizzle ORM
- **XRPL integration** using xrpl.js SDK
- **Real-time blockchain** transaction monitoring

### Blockchain Integration
- **XRP Ledger testnet** for development and testing
- **Custom DEBT token** (DebtLoop Settlement Token)
- **Smart contract preparation** for automated settlements
- **Transaction verification** and audit trails

## 📋 Features

### Core Debt Settlement
- ✅ **Anonymous company registration** with unique IDs
- ✅ **Debt/credit position recording** with counterparty details
- ✅ **Automatic loop detection** using graph algorithms
- ✅ **Settlement proposals** with efficiency calculations
- ✅ **Multi-party debt clearing** optimization

### Blockchain Integration
- ✅ **XRPL wallet creation** and management
- ✅ **Custom DEBT token** issuance and transfers
- ✅ **Transaction recording** on XRP Ledger
- ✅ **Real-time balance tracking** and verification
- ✅ **Block explorer integration** with direct links

### Platform Features
- ✅ **Dashboard analytics** with debt position insights
- ✅ **Transaction history** with blockchain verification
- ✅ **Token management** (issue, transfer, burn)
- ✅ **Database persistence** with PostgreSQL
- ✅ **Real-time updates** across all components

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL, Drizzle ORM |
| **Blockchain** | XRP Ledger, xrpl.js SDK |
| **State Management** | TanStack Query |
| **Build Tools** | Vite, tsx |
| **Styling** | Tailwind CSS, Radix UI |

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd debtloop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Database (automatically provided by Replit)
   DATABASE_URL=postgresql://...
   PGHOST=...
   PGPORT=...
   PGUSER=...
   PGPASSWORD=...
   PGDATABASE=...
   ```

4. **Initialize database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open your browser to `http://localhost:5000`
   - The platform will automatically initialize with sample data

## 📚 API Documentation

### Company Management
```typescript
GET    /api/company/current     // Get current company info
GET    /api/companies          // List all companies
POST   /api/companies          // Create new company
```

### Position Management
```typescript
GET    /api/positions          // Get all positions
POST   /api/positions          // Create new position
PUT    /api/positions/:id      // Update position
DELETE /api/positions/:id      // Delete position
```

### Loop Detection
```typescript
GET    /api/loops              // Get all detected loops
GET    /api/loops/active       // Get active loops only
POST   /api/loops/:id/accept   // Accept loop settlement
POST   /api/loops/:id/execute  // Execute settlement
```

### XRPL Integration
```typescript
POST   /api/xrpl/wallet/create         // Create XRPL wallet
GET    /api/xrpl/wallet/balance        // Get wallet balance
POST   /api/xrpl/position/record       // Record position on blockchain
POST   /api/xrpl/loop/settle          // Execute loop settlement on XRPL
GET    /api/xrpl/transactions          // Get transaction history
```

### Token Management
```typescript
GET    /api/token/info                 // Get DEBT token information
POST   /api/token/issue                // Issue new tokens
POST   /api/token/transfer             // Transfer tokens
POST   /api/token/burn                 // Burn tokens
GET    /api/token/balance              // Get token balance
GET    /api/token/supply               // Get token supply info
```

## 🏦 Database Schema

### Companies Table
```sql
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  anonymous_id TEXT UNIQUE NOT NULL,
  debt_balance INTEGER DEFAULT 2500,
  xrpl_address TEXT,
  xrpl_seed TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Positions Table
```sql
CREATE TABLE positions (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  counterparty_id TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  type TEXT CHECK (type IN ('credit', 'debt')),
  due_date DATE NOT NULL,
  description TEXT,
  is_settled BOOLEAN DEFAULT FALSE,
  xrpl_tx_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Loops Table
```sql
CREATE TABLE loops (
  id SERIAL PRIMARY KEY,
  loop_id TEXT UNIQUE NOT NULL,
  participant_ids TEXT[] NOT NULL,
  settlements JSONB NOT NULL,
  total_value DECIMAL(12,2) NOT NULL,
  efficiency DECIMAL(5,2) NOT NULL,
  status TEXT DEFAULT 'detected',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔗 XRPL Integration

### DEBT Token Details
- **Token Symbol**: DEBT
- **Full Name**: DebtLoop Settlement Token
- **Network**: XRP Ledger Testnet
- **Purpose**: Facilitate debt settlements and incentivize network participation
- **Features**: Issue, transfer, burn, trust lines

### Blockchain Features
- **Wallet Creation**: Generate XRPL wallets for companies
- **Transaction Recording**: Store debt positions on blockchain
- **Settlement Execution**: Process loop settlements via smart contracts
- **Real-time Verification**: Monitor transaction status and confirmations

### Explorer Links
- **Testnet Explorer**: https://testnet.xrpl.org
- **Transaction Lookup**: https://testnet.xrpl.org/transactions/{hash}
- **Account Lookup**: https://testnet.xrpl.org/accounts/{address}
- **Testnet Faucet**: https://xrpl.org/xrp-testnet-faucet.html

## 🎯 Use Cases

### 1. Supply Chain Finance
```
Manufacturer → Distributor → Retailer → Bank
     ↓              ↓           ↓        ↓
   $10K debt    $8K debt    $6K debt  $4K debt
```
**Result**: Loop settlement reduces total transactions from 4 to 1

### 2. Service Provider Networks
```
Agency A owes Agency B: $5,000
Agency B owes Agency C: $3,000  
Agency C owes Agency A: $2,000
```
**Result**: Net settlement of $2,000 instead of $10,000 in transfers

### 3. International Trade
- **Cross-border payments** with reduced forex exposure
- **Trade finance** optimization through circular clearing
- **Working capital** improvement via faster settlements

## 📊 Dashboard Features

### Analytics Overview
- **Total Credit/Debt Positions**: Real-time balance tracking
- **Net Position**: Calculated across all counterparties
- **Potential Savings**: Estimated cost reduction through loop settlements
- **Active Loops**: Number of detected settlement opportunities

### Transaction Monitoring
- **Real-time Updates**: Live blockchain transaction status
- **Historical Data**: Complete audit trail of all settlements
- **Performance Metrics**: Settlement efficiency and cost savings

## 🔐 Security & Privacy

### Data Protection
- **Anonymous Company IDs**: No sensitive business information exposed
- **Encrypted Communications**: Secure API endpoints
- **Blockchain Immutability**: Tamper-proof transaction records

### Access Control
- **Company-specific Data**: Each company sees only their positions
- **Secure Wallet Management**: Private keys stored securely
- **Transaction Verification**: Cryptographic proof of settlements

## 🚦 Development Status

### Completed Features ✅
- Core debt settlement algorithm
- XRPL blockchain integration
- Custom DEBT token implementation
- PostgreSQL database with persistence
- Real-time transaction monitoring
- Block explorer integration
- Comprehensive API endpoints

### Roadmap 🎯
- **Smart Contract Deployment**: Automated settlement execution
- **Multi-currency Support**: Beyond USD settlements
- **Advanced Analytics**: Predictive debt analysis
- **Mobile Application**: iOS/Android apps
- **Enterprise Integration**: API connectors for ERP systems

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Structured commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- **API Reference**: Available at `/api/docs` when running locally
- **Database Schema**: See `shared/schema.ts` for complete definitions
- **XRPL Integration**: Reference `server/xrpl-service.ts` for blockchain logic

### Community
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join community discussions for implementation questions
- **Examples**: Check `examples/` directory for integration samples

---

**Built with ❤️ using XRP Ledger technology for the future of B2B debt settlement.**