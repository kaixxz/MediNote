# Deployment Guide

## Environment Variables Required

Before deploying, make sure to set these environment variables in your hosting service:

### Required Variables:
- `DATABASE_URL` - Your PostgreSQL database connection string
- `ANTHROPIC_API_KEY` - Your Anthropic API key for AI functionality
- `NODE_ENV` - Set to "production" for production deployments

### Optional Variables:
- `PORT` - Server port (defaults to 5000, most hosting services set this automatically)

## Deployment Steps

### 1. Build the Application
```bash
npm install
npm run build
```

### 2. Start the Server
```bash
npm start
```

## Common Issues and Solutions

### Issue: "Build directory not found"
**Solution**: Make sure to run `npm run build` before starting the production server.

### Issue: "DATABASE_URL not found"
**Solution**: Set the `DATABASE_URL` environment variable in your hosting service dashboard.

### Issue: "ANTHROPIC_API_KEY not found"
**Solution**: Set the `ANTHROPIC_API_KEY` environment variable in your hosting service dashboard.

### Issue: Static files not serving
**Solution**: The build process creates files in `client/dist/`. Make sure this directory exists after building.

## Render Deployment

1. Connect your repository to Render
2. Use these settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node.js
3. Add the required environment variables in the Render dashboard

## Vercel Deployment

1. Connect your repository to Vercel
2. Set the build command to: `npm run build`
3. Set the output directory to: `client/dist`
4. Add environment variables in the Vercel dashboard

## Railway Deployment

1. Connect your repository to Railway
2. Railway will automatically detect the Node.js app
3. Add environment variables in the Railway dashboard
4. The service will automatically build and deploy 