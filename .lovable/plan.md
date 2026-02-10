

## Fix: Password Reset Link Redirecting Back to Forgot Password

### Problem
When clicking "Reset Password" in the email, the authentication system exchanges the token automatically and fires a `PASSWORD_RECOVERY` event. However, the Reset Password page is looking for an `access_token` in the URL hash (an older pattern). Since it doesn't find one, it immediately redirects you back to the Forgot Password page.

### Solution
Update the Reset Password page to work with the modern auth flow by listening for the `PASSWORD_RECOVERY` event from the auth state change listener, instead of checking URL hash parameters.

---

### Technical Changes

**`src/pages/ResetPassword.tsx`**
- Remove the `useEffect` that checks for `access_token` and `type=recovery` in the URL hash
- Add a new `useEffect` that subscribes to `supabase.auth.onAuthStateChange` and listens for the `PASSWORD_RECOVERY` event
- Track a `isReady` state that becomes `true` when a recovery session is detected
- Show a loading state while waiting for the auth event
- Only redirect to `/forgot-password` after a timeout if no recovery event is received (e.g., if someone navigates to `/reset-password` directly without a valid link)

**`src/contexts/AuthContext.tsx`**
- Ensure the `PASSWORD_RECOVERY` event is not intercepted or cleared before the Reset Password page can handle it (no changes expected, but will verify)

### How It Will Work After the Fix
1. User clicks "Reset Password" in the email
2. The auth system automatically exchanges the token and establishes a recovery session
3. The Reset Password page detects the `PASSWORD_RECOVERY` event
4. The form is displayed, and the user can set a new password
5. `supabase.auth.updateUser({ password })` saves the new password
6. User is redirected to the login page

