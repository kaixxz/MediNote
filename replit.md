# Medical Report Generator

## Overview

This is a full-stack web application that generates medical documentation, specifically SOAP notes, using AI. The application features a React frontend with a modern UI built using shadcn/ui components, an Express.js backend, and integrates with Anthropic's Claude AI for report generation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **API Design**: RESTful endpoints
- **Request/Response**: JSON-based communication
- **Error Handling**: Centralized error middleware
- **Logging**: Custom request logging with duration tracking

### Data Storage Solutions
- **Primary Database**: PostgreSQL (configured via Drizzle)
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Development Storage**: In-memory storage class for development/testing
- **Schema Management**: Shared schema definitions between client and server

### Authentication and Authorization
- Currently uses a basic in-memory storage system
- User model exists but authentication is not fully implemented
- Session management configured with connect-pg-simple for PostgreSQL sessions

## Key Components

### Frontend Components
- **Home Page**: Main interface for generating medical reports
- **Report Generator**: Form with textarea for patient notes and report type selection
- **UI Components**: Comprehensive set of shadcn/ui components including buttons, forms, cards, toasts, etc.
- **Error Handling**: Toast notifications for user feedback

### Backend Services
- **AI Service**: Integration with Anthropic Claude API for SOAP note generation
- **Storage Service**: Abstracted storage interface with in-memory implementation
- **Route Handler**: Express route registration and middleware setup

### Database Schema
- **Users Table**: ID, username, password fields
- **Reports Table**: ID, report type, patient notes, generated report, timestamp
- **Type Safety**: Zod schemas for validation and TypeScript type inference

## Data Flow

1. **Report Generation Flow**:
   - User enters patient notes in the frontend form
   - Frontend validates input and sends POST request to `/api/generate`
   - Backend validates request using Zod schema
   - AI service processes notes through Claude API to generate SOAP note
   - Generated report is saved to storage
   - Report content is returned to frontend
   - Frontend displays generated report with copy functionality

2. **Error Handling Flow**:
   - Validation errors are caught and returned with appropriate HTTP status codes
   - AI service errors are logged and user-friendly messages are returned
   - Frontend displays error messages using toast notifications

## External Dependencies

### AI Integration
- **Anthropic Claude API**: Uses Claude Sonnet 4 (claude-sonnet-4-20250514) for medical report generation
- **Configuration**: Requires ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable
- **Error Handling**: Graceful fallbacks for API failures

### Database
- **Neon Database**: Serverless PostgreSQL provider (@neondatabase/serverless)
- **Configuration**: Requires DATABASE_URL environment variable
- **Migration**: Drizzle Kit for schema migrations

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Date-fns**: Date manipulation utilities
- **Class Variance Authority**: Component variant management

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Type Checking**: TypeScript compilation check without emission

### Environment Configuration
- **Development**: Uses Vite dev server with HMR and proxy setup
- **Production**: Serves static files from Express with built React app
- **Environment Variables**: DATABASE_URL and ANTHROPIC_API_KEY required

### Replit Integration
- **Development Banner**: Automatic replit development banner injection
- **Runtime Error Overlay**: Vite plugin for better error visualization
- **Cartographer**: Code mapping for better debugging in development

### Scripts
- `npm run dev`: Development server with TypeScript execution
- `npm run build`: Production build for both frontend and backend
- `npm run start`: Production server startup
- `npm run check`: TypeScript type checking
- `npm run db:push`: Database schema migration

The application is designed to be easily deployable to platforms like Replit, with proper environment variable configuration for database and AI service connections.

## Recent Changes

### July 16, 2025 - Major UI/UX Redesign
- Completely redesigned home page to feel like a premium SaaS product
- Added full-screen hero section with gradient backgrounds and large typography
- Implemented animated typing demo that shows live SOAP note generation
- Added smooth scroll navigation between sections
- Enhanced visual design with glass morphism effects and gradients
- Improved mobile responsiveness and animations
- Added floating elements and interactive hover effects
- Restructured page layout: Hero → Input Section → Features → Footer
- Used modern color scheme with gray-900/950 backgrounds and blue/purple accents