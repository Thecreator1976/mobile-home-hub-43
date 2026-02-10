

# Add Temporary Password Field to Invite Dialog

## Summary
Add a "Temporary Password" field to the Invite User dialog so Super Admins can create a user account directly -- bypassing the email invitation flow entirely. The invited user can then log in immediately with their email and the temporary password you set.

## How It Will Work

1. In the **Invite User** dialog, a new optional "Temporary Password" field appears
2. If you fill in a password, the system will:
   - Create the user account immediately (email + password) via the backend
   - Assign them to the correct organization and role
   - Set their status to "active" (or "pending" if you prefer manual approval still)
   - Skip the email invitation entirely
3. If you leave the password blank, the current invite-link flow works as before
4. You then share the email and temporary password with the tenant directly (in person, text, etc.)

## Changes Required

### 1. New Backend Function: `create-user-with-password`
A new backend function that uses the admin API to:
- Create the auth user with the provided email and password
- Wait for the profile trigger to fire
- Update the profile with the organization and status
- Update the user role
- Return success

This requires the service role key (already configured) to create users server-side.

### 2. Update Invite User Dialog (`src/pages/AdminUsers.tsx`)
- Add a "Temporary Password" input field below the email field
- Add a toggle or note: "Set a temporary password to create the account immediately (bypasses email invite)"
- When password is provided, call the new backend function instead of `send-invitation`
- Show success message with the credentials to share

### 3. Update `useInvitations` Hook (`src/hooks/useInvitations.ts`)
- Add a new `createUserDirect` function that calls the new backend function
- Keep the existing `sendInvitation` function for the email flow

## Technical Details

**New file:** `supabase/functions/create-user-with-password/index.ts`
- Uses `supabase.auth.admin.createUser()` with `email_confirm: true` to skip email verification
- Sets organization_id, role, and status on the profile
- Validates password strength server-side
- Only callable by authenticated super_admins and tenant_admins

**Modified files:**
- `src/pages/AdminUsers.tsx` -- add password field and conditional logic in the invite dialog
- `src/hooks/useInvitations.ts` -- add `createUserDirect` method

**No database changes needed** -- uses existing profiles, user_roles, and auth tables.

