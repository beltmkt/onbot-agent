# AI Coding Agent Instructions for C2S CreateSeller Platform

## Project Overview
This is a corporate internal platform for Contact2Sale (C2S) built with React/TypeScript, featuring restricted authentication, comprehensive audit logging, CSV processing via N8N workflows, and real-time chat capabilities.

## Architecture Overview
- **Frontend**: React 18 + TypeScript + Vite SPA with Tailwind CSS
- **Authentication**: Supabase Auth with domain restriction (@c2sglobal.com)
- **Database**: Supabase with Row Level Security (RLS) enabled
- **Processing**: N8N workflows for CSV validation and user creation
- **Real-time**: Server-Sent Events (SSE) for chat simulation
- **Backend**: Multiple Node.js Express servers (OnBot proxy, SSE relay)
- **Audit**: Comprehensive logging of all user actions to `audit_logs` table

## Critical Developer Workflows

### Authentication Flow
- Domain validation: Only @c2sglobal.com emails allowed
- JWT tokens stored in localStorage
- Automatic logout for unauthorized domains
- All auth operations logged to audit table

### CSV Processing Pipeline
1. User uploads CSV via `CSVUpload.tsx`
2. File sent to N8N webhook: `https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/criar_conta_final`
3. N8N processes validation/creation
4. Results sent to Supabase edge function (`n8n-status-callback`)
5. Status updates logged to audit table

### Real-time Chat
- SSE connection via `relay-server.js` on port 3001
- Simulates N8N processing with typing indicators
- Messages broadcast to session-specific channels

## Project-Specific Patterns

### Service Functions
All service functions follow this pattern:
```typescript
export const serviceFunction = async (params): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    // Implementation
    return { success: true, data: result };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
};
```
Examples: `auditService.createLog()`, `csvService.uploadCSVToN8N()`

### Audit Logging
Every user action must be logged:
```typescript
await auditService.createLog({
  userEmail: user.email,
  actionType: 'csv_upload', // | 'login' | 'token_validation' | etc.
  status: 'success', // | 'error' | 'pending'
  metadata: { additionalData }
});
```

### Authentication Context
- Check `AuthContext.tsx` for domain validation logic
- Use `isAuthorizedDomain()` for email checks
- Store user/token in localStorage
- Validate tokens on app initialization

### Supabase Integration
- Direct client usage in services: `import { supabase } from '../lib/supabase'`
- RLS policies ensure users only see their own data
- Audit logs are immutable (no updates/deletes)

### Environment Variables
Required in `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_N8N_WEBHOOK_URL`

## Key Files to Reference
- `src/services/auditService.ts`: Audit logging patterns
- `src/services/csvService.ts`: N8N webhook integration
- `src/contexts/AuthContext.tsx`: Authentication logic
- `relay-server.js`: Real-time SSE implementation
- `supabase/functions/n8n-status-callback/index.ts`: Edge function for N8N callbacks
- `supabase/migrations/`: Database schema changes

## Development Commands
- `npm run dev`: Start Vite dev server
- `npm run build`: Production build
- `npm run typecheck`: TypeScript checking
- `node server.js`: Start OnBot proxy server (port 5000)
- `node relay-server.js`: Start SSE relay server (port 3001)

## Security Considerations
- Never commit `.env` files
- All database tables use RLS
- Domain validation on both frontend and backend
- Audit logs track all sensitive operations
- JWT tokens validated on each request

## Common Patterns
- Error handling: Return `{ success: false, error: message }`
- Loading states: Use `isLoading` in contexts
- Toasts: Use Sonner for user notifications
- File uploads: FormData with custom headers for N8N
- Real-time updates: SSE channels by session ID