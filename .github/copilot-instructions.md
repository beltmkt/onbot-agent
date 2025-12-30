# AI Coding Agent Instructions for C2S CreateSeller Platform

## Project Overview
This is a corporate internal platform for Contact2Sale (C2S) built with React/TypeScript, featuring restricted authentication, comprehensive audit logging, CSV processing via N8N workflows, and real-time chat capabilities.

## Architecture Overview
- **Frontend**: React 18 + TypeScript + Vite SPA with Tailwind CSS + Framer Motion animations
- **Authentication**: Supabase Auth with domain restriction (@c2sglobal.com)
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Processing**: N8N workflows for CSV validation and user creation (external webhook)
- **Real-time**: Server-Sent Events (SSE) via `relay-server.js` on port 3001
- **Backend**: Two Node.js Express servers:
  - Port 5000: OnBot chat proxy (`server.js`) - connects to external AI agent
  - Port 3001: SSE relay (`relay-server.js`) - broadcasts SSE messages to frontend
- **Audit**: Immutable audit logs stored in `audit_logs` table with RLS
- **UI Components**: Mix of headless patterns + Lucide React icons, Sonner toasts for notifications

## Critical Developer Workflows

### Starting All Services Locally
For full development, start services in this order:
1. `npm run dev` - Vite frontend dev server (port 5173)
2. `node relay-server.js` - SSE relay server (port 3001) - needed for real-time chat
3. `node server.js` - OnBot proxy (port 5000) - optional, only if testing chat features
4. **Supabase**: Ensure `.env` has valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Authentication Flow
- Domain validation: Only @c2sglobal.com emails allowed via `isAuthorizedDomain()` in `AuthContext.tsx`
- JWT tokens stored in localStorage, managed by Supabase Auth
- On app init, `AuthContext` checks session via `supabase.auth.getSession()`
- Automatic logout for unauthorized domains (front-end enforced)
- All auth events logged via `auditService.createLog()` with `actionType: 'login' | 'login_attempt' | 'logout'`

### CSV Processing Pipeline (End-to-End)
1. **User uploads CSV** → `CSVUpload.tsx` validates file is `.csv` and calls `uploadCSVToN8N(file, token)`
2. **HTTP POST to N8N webhook** → `csvService.uploadCSVToN8N()` sends FormData (Multipart) with exact fields:
   - `file`: Binary CSV file
   - `token`: Raw token string (no formatting/truncation)
3. **Webhook URL**: `https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook-test/criar_conta_final`
4. **N8N processes** → validates structure, creates users in company system
5. **Frontend logs directly to Supabase** → `supabase.from('activity_logs').insert({ user_email, action_type: 'Upload', status, details })`
6. **Frontend notifies user** → toast message via Sonner library
- **Key detail**: Upload happens IMMEDIATELY, no polling required - N8N performs async processing

### Real-time Chat (SSE Connection)
- SSE connection via `relay-server.js` running on port 3001
- Frontend connects to `/sse?channel={sessionId}` endpoint
- Relay broadcasts messages to specific channels (session-based isolation)
- Chat webhook URL: `https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/c3f08451-1847-461c-9ba0-a0f6d0bac603/chat`
- Relay includes `ping` event every 25s to keep connection alive

### Activity Logging (Direct Supabase)
- **No Edge Functions**: Log directly to `activity_logs` table via frontend
- **Log structure**: `user_email`, `action_type` (Login|Upload|Error), `status`, `details` (JSON), `created_at`
- **Insert pattern**: `supabase.from('activity_logs').insert({ user_email, action_type, status, details: {...} })`
- Logs are immutable and track all user actions for audit trail

## Project-Specific Patterns

### Service Functions Pattern
All service functions follow this standardized pattern for consistency:
```typescript
export const serviceFunction = async (params): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    // Implementation with detailed logging via console.error/log
    return { success: true, data: result };
  } catch (error) {
    console.error('Error context:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
```
**Examples in codebase**: `auditService.createLog()`, `csvService.uploadCSVToN8N()`, `auditService.getUserLogs()`
- Always use `success` boolean flag in response
- Include `error` string for failures (used for user-facing toast messages)
- Include `data` field when returning results
- Always use try/catch with console.error for debugging

### Audit Logging (Required for Every User Action)
Every user-initiated action must be logged before or after execution:
```typescript
await auditService.createLog({
  userEmail: user.email,
  userId: user.id,
  actionType: 'csv_upload', // See AuditLogData for valid types
  fileName: file.name,
  fileSize: file.size,
  status: 'success', // | 'error' | 'pending'
  errorMessage: error?.message,
  metadata: { additionalContext }
});
```
**Valid actionTypes** (from `auditService.ts`): `csv_upload`, `token_validation`, `user_creation`, `login`, `logout`, `export_data`, `login_attempt`, `profile_update`
- Audit logs are IMMUTABLE - no updates/deletes allowed (enforced via RLS)
- Logs are per-user visible only (RLS policy) except for system inserts

### Authentication Context (`AuthContext.tsx`)
- **Provider location**: Wraps entire app in `main.tsx` > `App.tsx` tree
- **Key functions**: `signIn()`, `signUp()`, `login()`, `logout()`, `isAuthorizedDomain()`
- **Domain check**: `isAuthorizedDomain(email)` validates email ends with `@c2sglobal.com`
- **State variables**: `user` (Supabase User or null), `isLoading`, `isAuthenticated`
- **Fallback mode**: Supports `isFallbackMode` for offline/testing scenarios
- **Token access**: Use `useAuth()` hook to access in components

### Supabase Integration
- **Client import**: `import { supabase } from '../lib/supabase'` in service files
- **RLS enforced**: Database policies ensure users only see/modify their own data
- **Tables with RLS**: `activity_logs` (read-only for user), all others user-scoped
- **Direct mutations**: Use `supabase.from('table').insert/update/delete()` 
- **Query pattern**: Always include `.select('*')` before filters for clarity
- **Error handling**: Check `error` object returned by Supabase, never throw on DB errors - return `{ success: false }`

### Fallback Mode (Development Testing)
- **Purpose**: When backend/CORS is unstable, allow UI testing without blocking on login
- **Implementation**: If `AuthContext` fails to reach Supabase, fall back to localStorage-based auth
- **Benefits**: Test CSV upload flow, navigation, audit logging UI without API dependency
- **Flag in code**: Check `isFallbackMode` in `AuthContext.tsx` to enable conditional behavior
- **Reset**: Clear localStorage and disable fallback to resume normal auth

### Component Patterns (React)
- **Framer Motion animations**: Used for page transitions (CSVUpload, Dashboard, Login screens)
- **Common variants**: `initial`, `animate`, `exit` for motion transitions with `AnimatePresence` wrapper
- **Icons**: All from Lucide React (`lucide-react` package)
- **Toast notifications**: Via `sonner` library - import and call directly, no wrapper needed
- **Dark mode**: `useTheme()` hook from `ThemeContext` provides `isDarkMode` boolean and `toggleTheme()`
- **Custom UI**: Headless pattern - button/input in `src/ui/` use Tailwind + CVA (class-variance-authority)

### Environment Variables
Required in `.env` file (Vite uses `VITE_` prefix):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_N8N_CSV_WEBHOOK=https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook-test/criar_conta_final
VITE_N8N_CHAT_WEBHOOK=https://consentient-bridger-pyroclastic.ngrok-free.dev/webhook/c3f08451-1847-461c-9ba0-a0f6d0bac603/chat
```
- **Critical**: These N8N URLs are fixed and must not change
- **Supabase keys**: Safe to expose (they're anonymous/public)
- **Access**: `import.meta.env.VITE_VARIABLE_NAME` in code
- **Note**: Frontend only, never include backend secrets

## Database Setup

### Required Migration: `activity_logs` Table
If the table doesn't exist, run this SQL via Supabase dashboard or migration:
```sql
create table if not exists activity_logs (
  id bigint generated by default as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_email text not null,
  action_type text not null,
  status text not null,
  details jsonb
);
```
- Tracks all user actions (Login, Upload, Error)
- Writable directly from frontend via Supabase client
- Immutable audit trail for compliance

## Key Files to Reference
- `src/services/auditService.ts`: Audit logging (createLog, getUserLogs) - pattern for all service functions
- `src/services/csvService.ts`: N8N webhook integration with FormData and custom headers
- `src/contexts/AuthContext.tsx`: Domain validation (isAuthorizedDomain), JWT token handling, session initialization
- `src/hooks/useAuth.tsx`: Hook to access auth context in components
- `relay-server.js`: SSE server (port 3001) - channels, ping heartbeat, cors config
- `server.js`: OnBot proxy server (port 5000) - external AI agent integration
- `supabase/functions/n8n-status-callback/index.ts`: Edge function for N8N async callbacks
- `supabase/migrations/`: Database schema (audit_logs table with RLS policies)
- `src/components/CSVUpload.tsx`: File upload with Framer Motion animations and validation
- `src/components/Header.tsx`: Dark mode toggle via ThemeContext

## Prerequisites
- **Node.js**: v18 or higher
- **npm**: Standard version (comes with Node.js)
- **Supabase**: Project initialized with `.env` variables set
- **N8N**: Webhooks accessible and correctly configured

## Development Commands
- `npm run dev`: Start Vite dev server (port 5173)
- `npm run build`: Production build
- `npm run typecheck`: TypeScript checking
- `npm run lint`: ESLint code quality check
- `node server.js`: Start OnBot proxy server (port 5000)
- `node relay-server.js`: Start SSE relay server (port 3001) - **required for chat**

## Security Considerations
- Never commit `.env` files - add to `.gitignore`
- All database tables use RLS for user-scoped data access
- Domain validation: Only @c2sglobal.com emails allowed
- Activity logs (`activity_logs` table) immutable for compliance
- JWT tokens: Supabase manages lifecycle, stored in localStorage
- **N8N Tokens**: Pass as raw strings in FormData, never truncate or format
- Token validation: Check expiry before API calls, auto-logout on 401

## Common Patterns
- Error handling: Return `{ success: false, error: message }`
- Loading states: Use `isLoading` in contexts
- Toasts: Use Sonner for user notifications
- File uploads: FormData with custom headers for N8N
- Real-time updates: SSE channels by session ID