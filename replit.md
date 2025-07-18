# Medinote - Medical Report Generator

## Overview

Medinote is a full-stack web application that generates medical documentation, specifically SOAP notes, using AI. The application features a React frontend with a modern UI built using shadcn/ui components, an Express.js backend, and integrates with Anthropic's Claude AI for report generation. The application now includes a credit-based monetization system with free trials and paid options.

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

### January 17, 2025 - Comprehensive Platform Enhancement
- **Complete Rebranding**: Enhanced Medinote branding with clickable logo navigation throughout the platform
- **Multi-Report Support**: Expanded beyond SOAP notes to include Progress Notes and Discharge Summaries with distinct themes
- **AI Review System**: Implemented comprehensive AI suggestions panel with modal dialog for improving documentation
- **Smart Input Assistants**: Added symptom checkboxes, medical system dropdowns, and patient information helpers
- **Section-by-Section Generation**: Live AI generation with loading animations and individual section processing
- **Save/Load Functionality**: Complete draft management with PostgreSQL persistence and user workflow tracking
- **Premium Dark Design**: Professional SaaS-inspired interface with smooth animations and modern gradients
- **Enhanced Navigation**: Consistent navigation with "Back to Home" functionality across all report builders
- **Multi-Report Types**: Color-coded themes (emerald for SOAP, blue for Progress, purple for Discharge)

### July 16, 2025 - Final Updates and Branding
- **Rebranded to "Medinote"**: Updated all references from "Noto" to "Medinote" throughout the application
- **Custom Discharge Summary Prompt**: Implemented user-provided discharge summary prompt with structured XML output
- **Enhanced Progress Notes**: Integrated custom user-provided progress notes prompt for comprehensive patient updates
- **TypeScript Fixes**: Resolved type safety issues with report type selections
- **Complete Functionality**: All three report types (SOAP, Progress Notes, Discharge Summary) fully operational

### July 16, 2025 - Progress Notes and Discharge Summary Implementation
- Added complete Progress Notes functionality with specialized AI prompts
- Implemented custom user-provided Progress Notes prompt for enhanced clinical documentation
- Implemented Discharge Summary generation with comprehensive hospital documentation  
- Updated schema validation to support all three report types: soap, progress, discharge
- Enhanced AI service with specific prompts for each medical document type
- Added dynamic placeholder text that changes based on selected report type
- Unified API endpoint to handle all medical report generation
- Removed "Coming Soon" labels - all report types now fully functional

### July 16, 2025 - Major UI/UX Redesign  
- Completely redesigned home page to feel like a premium SaaS product
- Added full-screen hero section with gradient backgrounds and large typography
- Implemented animated typing demo that shows live SOAP note generation
- Added smooth scroll navigation between sections
- Enhanced visual design with glass morphism effects and gradients
- Improved mobile responsiveness and animations
- Added floating elements and interactive hover effects
- Restructured page layout: Hero → Input Section → Features → Footer
- Unified emerald/teal color scheme throughout for medical branding
- Fixed demo SOAP note formatting with proper line breaks and structure

### July 18, 2025 - Migration and UI Fixes
- **Migration to Replit**: Successfully migrated project from Replit Agent to standard Replit environment
- **Database Setup**: Configured PostgreSQL database and completed schema migrations
- **Assistant Panel Fixes**: Fixed scrolling issues in Dr. MediAI assistant panel after saving drafts
- **Enhanced Patient Information**: Added comprehensive patient demographics, healthcare provider info, and medical details
- **Improved AI Review**: Enhanced review system to check for essential medical elements like vital signs, allergies, medications
- **Fixed Export Dialog**: Corrected positioning of copy/download popup that was stuck at top of screen
- **New Patient Fields**: Added patient name, DOB, MRN, doctor name, hospital name, department, chief complaint, allergies, current medications
- **Better Organization**: Reorganized assistant panel with color-coded sections for better user experience

### July 18, 2025 - Migration & UI Fixes
- Successfully migrated project from Replit Agent to standard Replit environment
- Fixed Dr. MediAI assistant panel scrolling issues after draft saving
- Enhanced AI review system with comprehensive medical documentation checklist
- Added essential elements checklist including vital signs, medications, and follow-up instructions
- Fixed copy/download popup positioning issues - now properly centered and accessible
- Improved AI review prompts to focus on critical medical documentation elements
- Enhanced sheet layout for better overflow handling and scrolling behavior

### July 18, 2025 - Complete Migration to Replit
- Successfully completed migration from Replit Agent to standard Replit environment
- Configured PostgreSQL database with proper schema migrations
- Set up all required environment variables (DATABASE_URL, ANTHROPIC_API_KEY)
- Verified all dependencies are properly installed and configured
- Application now runs cleanly without any configuration issues
- All three report types (SOAP, Progress Notes, Discharge Summary) fully operational with AI integration

### July 18, 2025 - Credit System Removal and Render Deployment Preparation
- ✓ Completely removed credit-based monetization system for clean deployment
- ✓ Removed all Stripe dependencies and payment processing code
- ✓ Cleaned up database schema to remove credit-related tables and columns
- ✓ Removed CreditDisplay component and all credit UI references
- ✓ Updated API endpoints to remove credit checking and deduction
- ✓ All AI features are now free to use without restrictions
- ✓ Created render.yaml configuration for easy Render deployment
- ✓ Updated deployment documentation for Render platform
- ✓ Application ready for production deployment on Render