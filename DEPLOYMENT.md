# Medinote Deployment Guide

## Render Deployment

### Quick Deploy

Deploy directly to Render using the included `render.yaml` configuration:

1. **Connect your GitHub repository to Render**
2. **Set environment variables**:
   - `ANTHROPIC_API_KEY` - Your Claude API key for AI features
3. **Deploy** - Render will automatically set up PostgreSQL and deploy the app

### Manual Deployment Steps

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

### Features

- **AI-Powered Medical Documentation**: SOAP notes, Progress Notes, Discharge Summaries
- **Complete User Workflow**: Draft management, AI review, export to PDF/DOCX
- **PostgreSQL Database**: Persistent storage for drafts and user data

### API Endpoints

- `POST /api/generate-section` - Generate AI content for medical sections
- `POST /api/review` - AI review and suggestions for reports
- `POST /api/smart-suggestions` - Auto-fill suggestions (free)
- `GET /api/drafts` - Manage saved drafts
- `GET /api/health` - Health check endpoint

### Database Schema

The application uses PostgreSQL with the following tables:
- `users` - User accounts
- `soap_drafts` - Saved medical documentation drafts
- `reports` - Legacy report storage
- `sessions` - User session storage

### Performance Notes

- Frontend bundle: ~1.1MB (gzipped: ~338KB)
- Backend bundle: ~39.5KB
- Database queries are optimized with proper indexing
- All AI features are free to use