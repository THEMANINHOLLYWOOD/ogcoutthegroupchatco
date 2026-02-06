

# Plan: Fix Edge Function Deployment Issue

## Problem Diagnosis

The "Failed to send a request to the Edge Function" error occurs because the `search-trip` edge function is not properly deployed:

| Evidence | Finding |
|----------|---------|
| Network requests | All POST requests to `/functions/v1/search-trip` fail with "Failed to fetch" |
| Edge function logs | **No logs found** - function is not running |
| Code exists | `supabase/functions/search-trip/index.ts` is present and correct |
| Config exists | `supabase/config.toml` includes the function |

The function code is valid - it just needs to be deployed.

## Solution

Redeploy the `search-trip` edge function to activate it. No code changes are required - the existing implementation is correct.

### Action: Redeploy Edge Function

The `search-trip` function will be redeployed to Supabase. This will:
1. Upload the function code to the Supabase infrastructure
2. Make it respond to incoming requests
3. Enable logging for debugging

### What Happens After Deployment

Once deployed, when you search for a trip:
1. Request goes to `search-trip` function
2. Function calls Lovable AI Gateway with trip details
3. AI returns realistic flight and hotel pricing
4. User sees the cost breakdown

## Files Affected

| File | Action |
|------|--------|
| `supabase/functions/search-trip/index.ts` | Redeploy (no code changes) |

## Timeline

This is a deployment-only fix. No code modifications needed - just need to trigger a redeploy of the edge function.

