

# Plan: Preserve Trip Data for New Users During Sign-In Flow

## Problem Analysis

When a new user creates a trip and then signs in with Google:

1. User completes trip creation wizard (4 steps)
2. Clicks "Share Trip" → trip is saved to database (without `organizer_id`)
3. Lands on TripView page with "Create Link" button
4. Clicks "Create Link" → redirected to `/auth?redirect=/trip/{tripId}/claim`
5. Signs in with Google OAuth
6. **Bug**: Redirected to `/` instead of `/trip/{tripId}/claim`
7. Trip is orphaned in database, user loses their progress

**Root Causes:**

| Issue | Location | Current Behavior |
|-------|----------|------------------|
| OAuth ignores redirect param | `useAuth.tsx` | `redirect_uri: window.location.origin` always returns to `/` |
| Auth page ignores redirect param | `Auth.tsx` | Always navigates to `/` after sign-in |
| No session persistence | OAuth flow | Google OAuth loses query params during redirect |

---

## Solution Design

### Approach: Store redirect URL in sessionStorage before OAuth

Since OAuth redirects lose query parameters, we need to persist the intended redirect URL before initiating OAuth:

```text
[User clicks "Create Link"]
        |
        v
[Navigates to /auth?redirect=/trip/xyz/claim]
        |
        v
[Auth page stores redirect URL in sessionStorage]
        |
        v
[User clicks "Continue with Google"]
        |
        v
[Google OAuth completes, redirects to origin]
        |
        v
[onAuthStateChange fires, user detected]
        |
        v
[Auth page checks sessionStorage for pending redirect]
        |
        v
[Navigates to /trip/xyz/claim]
        |
        v
[ClaimTrip page claims trip, sets organizer_id]
        |
        v
[Navigates to /trip/xyz/dashboard]
```

---

## Implementation Steps

### Step 1: Update Auth Page to Handle Redirect Parameter

**File: `src/pages/Auth.tsx`**

Modifications:
- Read `redirect` query parameter on mount
- Store it in sessionStorage before any OAuth action
- On successful authentication, check sessionStorage for redirect
- Navigate to stored redirect URL (or `/` as fallback)
- Clear the stored redirect after use

```typescript
// Read redirect param
const [searchParams] = useSearchParams();
const redirectTo = searchParams.get('redirect');

// Store before OAuth
useEffect(() => {
  if (redirectTo) {
    sessionStorage.setItem('authRedirect', redirectTo);
  }
}, [redirectTo]);

// On user detected
useEffect(() => {
  if (user) {
    const storedRedirect = sessionStorage.getItem('authRedirect');
    sessionStorage.removeItem('authRedirect');
    navigate(storedRedirect || '/', { replace: true });
  }
}, [user, navigate]);
```

### Step 2: No Changes Needed to useAuth

The `signInWithGoogle` function correctly uses `window.location.origin` as the OAuth redirect. The Auth page will handle the final navigation using sessionStorage.

### Step 3: No Changes Needed to ClaimTrip

The ClaimTrip page already:
- Checks for authentication
- Calls `claimTrip()` to set `organizer_id`
- Navigates to dashboard on success

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Auth.tsx` | Add useSearchParams, store redirect in sessionStorage, navigate to stored redirect |

---

## Technical Details

### Updated Auth.tsx Logic

```typescript
import { useSearchParams } from 'react-router-dom';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, ... } = useAuth();
  
  // Get redirect param
  const redirectParam = searchParams.get('redirect');
  
  // Store redirect on mount (before OAuth)
  useEffect(() => {
    if (redirectParam) {
      sessionStorage.setItem('auth_redirect', redirectParam);
    }
  }, [redirectParam]);
  
  // Handle successful auth
  useEffect(() => {
    if (user) {
      const storedRedirect = sessionStorage.getItem('auth_redirect');
      sessionStorage.removeItem('auth_redirect');
      
      // Validate redirect is internal path
      const finalRedirect = storedRedirect?.startsWith('/') 
        ? storedRedirect 
        : '/';
        
      navigate(finalRedirect, { replace: true });
    }
  }, [user, navigate]);
  
  // ... rest of component
};
```

### Security Considerations

- Only allow redirects to internal paths (starting with `/`)
- Reject absolute URLs to prevent open redirect vulnerabilities
- Clear sessionStorage after use

---

## User Flow After Fix

```text
1. User creates trip → lands on TripView
2. Clicks "Create Link" 
3. Goes to /auth?redirect=/trip/abc/claim
4. Auth page stores "/trip/abc/claim" in sessionStorage
5. User clicks "Continue with Google"
6. OAuth completes, returns to /auth (or /)
7. Auth page detects user, reads sessionStorage
8. Navigates to /trip/abc/claim
9. ClaimTrip sets organizer_id and navigates to dashboard
10. Trip now appears in "My Trips"
```

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| User navigates to /auth directly (no redirect) | Falls back to `/` |
| OAuth fails | User stays on auth page, sessionStorage preserved for retry |
| User manually goes to /auth later | No stored redirect, goes to `/` |
| Malicious redirect param | Validate path starts with `/`, reject URLs |
| Email/password login | Same flow works, redirect honored |

---

## Summary

**Single file change** to `src/pages/Auth.tsx`:
- Store redirect param in sessionStorage before OAuth
- After authentication, navigate to stored redirect or fallback to `/`
- This preserves the user's intent across the OAuth redirect flow

