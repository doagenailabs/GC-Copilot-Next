# Genesys Cloud Copilot Next

## Overview
Genesys Cloud Copilot Next is an advanced AI-powered assistant for contact center professionals. It enhances the Genesys Cloud experience by providing real-time analysis and insights during customer interactions. The application uses state-of-the-art AI to analyze conversations in real-time, offering actionable insights about customer sentiment, agent performance, and interaction quality through an intuitive dashboard.

This intelligent co-pilot helps agents and supervisors make data-driven decisions, improve customer experience, and maintain high-quality service standards by providing immediate, context-aware guidance and analytics.

## Features

### Real-Time AI Analysis
- Intelligent customer sentiment tracking
- Proactive issue and pain point detection
- Smart urgency level assessment
- Comprehensive agent performance metrics
- Advanced interaction quality monitoring
- Automated business intelligence gathering

### Key Components
- Real-time conversation transcription
- Low-latency WebSocket updates
- Advanced AI analysis powered by OpenAI
- Intuitive, dynamic dashboard
- Seamless Genesys Cloud integration

## Technical Architecture

### Frontend
- Built with Next.js 14
- React components for real-time visualization
- Tailwind CSS for styling
- Lucide React for icons
- Responsive design with mobile support

### Backend
- Edge Runtime for API routes
- OpenAI integration for conversation analysis
- WebSocket connection for real-time updates
- Message history management
- Structured JSON schema for analysis output

### Integration
- Genesys Cloud SDK integration
- Support for multiple environments (mypurecloud.com, pure.cloud, etc.)
- Salesforce LWC compatibility
- Custom toast notifications system

## Setup and Configuration

### Prerequisites
- Genesys Cloud organization account
- OpenAI API key
- Vercel account (for deployment)

### Environment Variables
```
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_GC_OAUTH_CLIENT_ID=your_genesys_cloud_oauth_client_id
OPENAI_MODEL=gpt-4 # or your preferred model
OPENAI_MAX_COMPLETION_TOKENS=2048
OPENAI_TEMPERATURE=0.2
NEXT_PUBLIC_CONVERSATION_HISTORY_MESSAGES_NUMBER=5
```

#### Environment Variables Details

##### NEXT_PUBLIC_CONVERSATION_HISTORY_MESSAGES_NUMBER
- Purpose: Controls the number of conversation messages maintained in the analysis context
- Default: 5
- Impact:
  - Higher values provide more context for analysis but increase token usage
  - Lower values reduce context but save on API costs
  - Affects both user and assistant message history
- Recommended ranges:
  - Minimum: 3 (basic context)
  - Maximum: 10 (full context)
  - Optimal: 5-7 (balanced)
- Note: This directly impacts OpenAI API usage and costs. Each message in history is included in the token count for analysis.

## Deployment Guide (Vercel)

1. Fork or push your code to a GitHub repository

2. Connect your repository to Vercel:
   - Log in to Vercel
   - Click "New Project"
   - Import your repository
   - Configure the project:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: `next build`
     - Install Command: `npm install`

3. Configure environment variables in Vercel:
   - Go to project settings
   - Navigate to "Environment Variables"
   - Add all required environment variables as listed above
   - Make sure to include NEXT_PUBLIC_ prefix for client-side variables

4. Deploy:
   - Vercel will automatically deploy your application
   - Any subsequent pushes to the main branch will trigger automatic deployments

### Post-Deployment Configuration

1. Configure Genesys Cloud:
   - Create a new OAuth client in Genesys Cloud
   - Set the redirect URI to your Vercel deployment URL
   - Update the `NEXT_PUBLIC_GC_OAUTH_CLIENT_ID` in your Vercel environment variables

2. Configure CORS and CSP:
   - The application includes necessary CORS and CSP headers in `next.config.js`
   - Verify these settings match your deployment environment

## Security Considerations

- Implements secure WebSocket connections
- Uses environment variables for sensitive data
- Includes Content Security Policy headers
- Implements proper CORS configuration
- Handles sensitive conversation data securely

## Main Components

### AnalysisDisplay
- Real-time visualization of conversation analysis
- Dynamic color-coded metrics
- Responsive card-based layout
- Alert system for critical indicators

### WebSocket Handler
- Manages real-time communication
- Processes transcription data
- Handles connection lifecycle
- Implements error handling and reconnection logic

### Analysis Engine
- Processes conversation segments
- Generates structured analysis
- Maintains conversation context
- Implements the analysis schema

## Troubleshooting

Common issues and solutions:
1. WebSocket Connection Issues
   - Verify Genesys Cloud credentials
   - Check network connectivity
   - Verify WebSocket endpoints in CSP

2. Analysis Not Updating
   - Check OpenAI API key and quotas
   - Verify WebSocket subscription
   - Check browser console for errors

3. Authentication Issues
   - Verify OAuth client configuration
   - Check redirect URI settings
   - Verify environment variables

4. Message History Issues
   - Verify NEXT_PUBLIC_CONVERSATION_HISTORY_MESSAGES_NUMBER is set correctly
   - Check browser console for history-related errors
   - Monitor OpenAI token usage if set too high
