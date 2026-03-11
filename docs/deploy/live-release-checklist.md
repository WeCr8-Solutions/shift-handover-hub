# Live Release Checklist

Use this checklist any time the live site looks stale or you need proof that a deploy is serving the latest code.

## Source of Truth

1. Confirm GitHub `main` contains the expected commit.
2. Confirm the app's visible build badge shows the same short SHA.
3. Open `/release.json` on the deployed site and verify:
   - `commitSha`
   - `releaseStamp`
   - `buildTime`
   - `deployTarget`

## Lovable Verification

1. Open the exact Lovable project connected to this repository.
2. Confirm the editor reflects the latest GitHub changes.
3. Run `Publish -> Update`.
4. Reload the custom domain and compare `/release.json` again.

## If the Live Site Is Still Old

1. Check whether the custom domain is connected to the wrong Lovable project.
2. Verify the domain is `Live` in Lovable domain settings.
3. Remove and reconnect the domain if it is attached to an outdated project snapshot.
4. If using Vercel, verify the deployment tied to the latest `main` commit succeeded.

## Fast External Check

Run this from PowerShell:

```powershell
Invoke-WebRequest -Uri "https://jobline.ai/release.json" -UseBasicParsing | Select-Object -ExpandProperty Content
```

If the returned SHA does not match GitHub `main`, the live environment is not serving the latest release.