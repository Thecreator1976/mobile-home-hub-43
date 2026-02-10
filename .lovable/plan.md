

# Add Temporary Password to Invite Tenant Admin Dialog

## Summary
Add a "Temporary Password" field to the **Invite Tenant Admin** dialog on the AdminOrganizations page, and remove it from the AdminUsers invite dialog.

## Changes

### 1. Update `src/pages/AdminOrganizations.tsx`
- Import `createUserDirect` and `creatingUser` from `useInvitations` hook (currently only imports `sendInvitation` and `sending`)
- Add state for `invitePassword`
- Add a "Temporary Password" input field to the Invite Tenant Admin dialog (below the email field)
- Update `handleSendInvite` to check if a password is provided:
  - If yes: call `createUserDirect` with email, password, org ID, and role `tenant_admin`
  - If no: fall back to the existing `sendInvitation` email flow
- Update button label to show "Create Account" when password is filled, "Send Invitation" when empty
- Reset password state when dialog opens/closes

### 2. Update `src/pages/AdminUsers.tsx`
- Remove the temporary password field and related logic from the Invite User dialog
- Remove `invitePassword` state
- Remove the `createUserDirect` / `creatingUser` imports and usage
- Keep the dialog as a simple email + role invitation only

## Technical Details

**Files to modify:**
- `src/pages/AdminOrganizations.tsx` -- add password field and direct creation logic
- `src/pages/AdminUsers.tsx` -- remove password field and direct creation logic

**No backend or database changes needed** -- the `create-user-with-password` edge function already exists and supports this flow.

