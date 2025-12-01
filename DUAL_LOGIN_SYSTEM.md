# Dual Login System Documentation

## Overview

This application now supports dual login authentication, allowing users to sign in using either:
1. **Their real email address** (e.g., `john@example.com`)
2. **Their numeric member ID** (e.g., `250000001`)

## System Architecture

### Technical Email System

Since Supabase Auth doesn't allow numeric IDs as email addresses, we use a "technical email" system:

- **Member IDs** are stored in Supabase Auth as: `<memberId>@members.tikredi.ht`
  - Example: Member ID `250000001` → `250000001@members.tikredi.ht`

- **Real emails** are stored in `user_metadata.true_email`

- **Member IDs** are also stored in `user_metadata.member_id` for easy access

### Authentication Flow

#### Login Process

1. User enters either:
   - Email: `john@example.com`
   - Member ID: `250000001`

2. System detects the format:
   - If input contains `@` → treated as email
   - Otherwise → treated as member ID

3. For member IDs:
   - Converted to technical email: `250000001@members.tikredi.ht`
   - Login attempted with technical email + password

4. For emails:
   - Login attempted directly with email + password

#### Signup Process

1. User provides:
   - Member ID (required)
   - Real email (required)
   - Password (required)

2. System creates Supabase Auth user:
   - Email: `<memberId>@members.tikredi.ht` (technical email)
   - Password: user-provided password
   - Metadata:
     - `true_email`: real email
     - `member_id`: member ID
     - `full_name`: optional full name

## File Structure

### Core Files

1. **`lib/auth.ts`** - Authentication helper functions
   - `login(identifier, password)` - Handles both email and member ID login
   - `signUp(memberId, realEmail, password, fullName?)` - Creates user with technical email
   - `memberIdToTechnicalEmail(memberId)` - Converts member ID to technical email
   - `normalizeIdentifier(identifier)` - Detects and normalizes identifier format
   - Helper functions for extracting metadata

2. **`app/login/page.tsx`** - Login page
   - Single input field for "Email or Member ID"
   - Password field
   - Automatic format detection
   - Error handling

3. **`app/signup/page.tsx`** - Signup page
   - Member ID input
   - Email input
   - Password and confirm password fields
   - Validation and error handling

4. **`middleware.ts`** - Route protection
   - Protects `/dashboard/*` routes
   - Redirects unauthenticated users to `/login`
   - Redirects authenticated users away from login/signup pages

### Updated Files

- **`lib/supabase.ts`** - No changes needed (works with existing setup)

## Usage Examples

### Login with Email

```typescript
import { login } from '@/lib/auth';

const { data, error } = await login('john@example.com', 'password123');
```

### Login with Member ID

```typescript
import { login } from '@/lib/auth';

const { data, error } = await login('250000001', 'password123');
// Internally converts to: 250000001@members.tikredi.ht
```

### Signup

```typescript
import { signUp } from '@/lib/auth';

const { data, error } = await signUp(
  '250000001',           // Member ID
  'john@example.com',    // Real email
  'password123',          // Password
  'John Doe'              // Optional full name
);
```

### Accessing User Metadata

```typescript
import { getRealEmail, getMemberId } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const { data: { user } } = await supabase.auth.getUser();

const realEmail = getRealEmail(user);    // 'john@example.com'
const memberId = getMemberId(user);      // '250000001'
```

## Route Protection

### Middleware

The `middleware.ts` file protects all routes under `/dashboard`:

- Unauthenticated users → redirected to `/login?redirect=/dashboard/...`
- Authenticated users accessing `/login` or `/signup` → redirected to `/dashboard`

### Client-Side Protection

For additional security, use the existing `AuthGuard` component in protected pages:

```tsx
import AuthGuard from '@/components/auth/AuthGuard';

export default function ProtectedPage() {
  return (
    <AuthGuard>
      {/* Protected content */}
    </AuthGuard>
  );
}
```

## Migration Notes

### For Existing Users

If you have existing users created with the old phone-based authentication:

1. **Option 1**: Keep both systems running (backward compatible)
2. **Option 2**: Migrate existing users to technical email format

### Migration Script (if needed)

```typescript
// Example migration script (run once)
async function migrateUsers() {
  const { data: users } = await supabase.auth.admin.listUsers();
  
  for (const user of users) {
    const memberId = user.user_metadata?.member_id;
    if (memberId && !user.email?.includes('@members.tikredi.ht')) {
      // Update user email to technical email format
      await supabase.auth.admin.updateUserById(user.id, {
        email: `${memberId}@members.tikredi.ht`,
        user_metadata: {
          ...user.user_metadata,
          true_email: user.email, // Preserve original email
        },
      });
    }
  }
}
```

## Testing

### Test Cases

1. **Login with email**: ✅
   - Enter: `john@example.com`
   - Should authenticate successfully

2. **Login with member ID**: ✅
   - Enter: `250000001`
   - Should convert to `250000001@members.tikredi.ht` and authenticate

3. **Signup**: ✅
   - Enter member ID, email, password
   - Should create user with technical email and store real email in metadata

4. **Route protection**: ✅
   - Unauthenticated access to `/dashboard` → redirects to `/login`
   - Authenticated access to `/login` → redirects to `/dashboard`

## Configuration

### Environment Variables

No additional environment variables needed. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Supabase Settings

Ensure in Supabase Dashboard:
- **Email Auth** is enabled
- **Phone Auth** can be disabled (not needed for this system)
- **Email confirmations** can be enabled/disabled as per your preference

## Security Considerations

1. **Technical Email Domain**: The domain `@members.tikredi.ht` is used internally. Ensure this domain is not used for real email addresses.

2. **Password Security**: All passwords are handled by Supabase Auth with proper hashing.

3. **Session Management**: Sessions are managed by Supabase Auth with secure cookies.

4. **Metadata Storage**: Real emails are stored in `user_metadata`, which is encrypted at rest by Supabase.

## Troubleshooting

### User can't login with member ID

- Check that the member ID was converted to technical email format during signup
- Verify `user_metadata.member_id` exists
- Check Supabase Auth logs for errors

### User can't login with email

- Verify the email matches `user_metadata.true_email`
- Check that the user was created with the correct email
- Ensure email auth is enabled in Supabase Dashboard

### Middleware not working

- Check that `middleware.ts` is in the project root
- Verify Next.js version supports middleware (Next.js 12+)
- Check browser console for errors

## Support

For issues or questions:
1. Check Supabase Auth logs in Dashboard
2. Review browser console for client-side errors
3. Check Next.js server logs for middleware issues

