

## Plan: Auto-Clear Invalid Auth Tokens

### Problem
When you try to log in, the browser may have stale authentication tokens stored from previous sessions. These invalid tokens cause authentication to fail silently, requiring you to manually open dev tools and clear localStorage.

### Solution
Improve the authentication system to automatically detect and clear invalid tokens, so you can simply refresh the page or log in normally without touching dev tools.

---

## What Will Change

### 1. Enhanced Error Detection in Auth Context
The login system will be updated to:
- Detect when stored tokens are invalid or expired
- Automatically sign out and clear corrupted session data
- Listen for `TOKEN_REFRESHED` events that fail silently
- Catch `AuthSessionMissingError` and similar auth errors

### 2. Automatic Token Cleanup
When an invalid token is detected:
- The system will call `signOut()` to clear all auth state
- All localStorage entries for this project will be cleaned
- You'll be redirected to the login page with a fresh state

### 3. Better Error Feedback
- A toast message will inform you if an expired session was automatically cleared
- The login page will show if you were redirected due to session expiration

---

## Technical Implementation

### Files to Modify

**`src/contexts/AuthContext.tsx`**
- Add error handling in `getSession()` to catch invalid token errors
- Listen for `TOKEN_REFRESHED` failures in `onAuthStateChange`
- Create a `clearAuthState()` helper that clears localStorage and resets state
- Handle `SIGNED_OUT` events triggered by failed token refreshes

**`src/pages/Login.tsx`**
- Display a message when redirected due to session expiration
- Use URL parameters or location state to detect this scenario

### Key Code Changes

```typescript
// In AuthContext - Enhanced session handling
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    console.error("Session error, clearing auth state:", error);
    clearAuthState();
    return;
  }
  // ... existing logic
});

// In onAuthStateChange - Handle token refresh failures
if (event === 'TOKEN_REFRESHED' && !session) {
  // Token refresh failed - session is invalid
  clearAuthState();
}

if (event === 'SIGNED_OUT') {
  // Ensure all state is cleared
  clearAuthState();
}
```

---

## After Implementation

You'll be able to:
1. Refresh the page normally - invalid tokens will auto-clear
2. Go directly to `/login` - no dev tools needed
3. See a friendly message explaining why you were logged out

No more manual localStorage clearing required.

