# Firebase Deployment Notes

We use Windows Powershell for deployments.

## Common Commands

1. `firebase deploy --only hosting`
   - Use this for most UI/frontend changes
   - Fastest deployment option
   - Does not update Firebase Functions or other backend services
   - Takes about 1-2 minutes

2. `firebase deploy`
   - Use this for full deployments when backend changes are made
   - Updates everything: Functions, Hosting, etc.
   - Takes about 3-5 minutes
   - Required when changes are made to:
     - API routes
     - Server-side components
     - Firebase Functions

## Known Issues & Solutions

1. CORS Issues:
   - If CORS errors appear after deployment, may need to wait 5-10 minutes for changes to propagate
   - Check that API routes are properly configured with CORS headers

2. ESBuild Errors:
   - If you see "Failed to find esbuild", it will auto-install
   - Don't worry about the esbuild cleanup warnings in Windows

3. Firebase Functions:
   - Warning about outdated firebase-functions is normal (we're on v4.9.0)
   - Upgrading to v5+ requires breaking changes we're not ready for yet

4. Deployment Best Practices:
   - Always check console for errors after deployment
   - Test critical paths (Bible API, authentication, etc.)
   - If changes don't appear immediately, try hard refresh (Ctrl+F5)

## What Not To Do

1. Don't use `firebase deploy --only functions`
   - This can break the connection between hosting and functions
   - Always deploy functions together with hosting

2. Don't ignore "package.json indicates an outdated version" warnings
   - Document them here for future upgrades
   - Current known: firebase-functions needs upgrade to v5+

