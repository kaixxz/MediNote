# Medinote Deployment Guide

## Production Deployment

### Environment Variables Required

- `ANTHROPIC_API_KEY` - Your Claude API key for AI features
- `DATABASE_URL` - PostgreSQL database connection string
- `NODE_ENV=production`

### Deployment Steps

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

### Features Deployed

- **AI-Powered Medical Documentation**: SOAP notes, Progress Notes, Discharge Summaries
- **Credit-Based Monetization**: 3 free trial credits, paid packages available
- **Complete User Workflow**: Draft management, AI review, export to PDF/DOCX
- **PostgreSQL Database**: Persistent storage for users, drafts, and credit transactions

### Credit System

- **Free Trial**: 3 credits for new users
- **Pricing Tiers**:
  - Starter: 5 credits for $2.00
  - Professional: 15 credits for $5.00 (Popular)
  - Enterprise: 35 credits for $10.00

### API Endpoints

- `POST /api/generate-section` - Generate AI content (1 credit)
- `POST /api/review` - AI review and suggestions (1 credit)
- `GET /api/credits` - Check user credits
- `POST /api/credits/purchase` - Purchase credit packages
- `GET /api/drafts` - Manage saved drafts

### Database Schema

The application uses PostgreSQL with the following tables:
- `users` - User accounts with credit tracking
- `soap_drafts` - Saved medical documentation drafts
- `credit_transactions` - Credit usage and purchase history
- `credit_packages` - Available credit packages
- `sessions` - User session storage

### Performance Notes

- Frontend bundle: ~1.1MB (gzipped: ~338KB)
- Backend bundle: ~39.5KB
- Database queries are optimized with proper indexing
- Credit system includes transaction tracking for audit purposes