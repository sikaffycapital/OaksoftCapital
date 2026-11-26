---
name: Public npm registry push check
description: Required pre-push lockfile check for the GitHub-to-Vercel deployment.
---

Before every push, run `grep -c "replit.internal" package-lock.json` and stop unless it prints `0`.

**Why:** The user required this check because Vercel cannot fetch packages from Replit's private package mirror.

**How to apply:** Run the check immediately before each push, including after package operations. A zero count makes grep exit with status 1; check the printed count rather than treating that exit status as a failure. For a registry-URL-only repair, preserve versions and integrity hashes and do not run `npm install` afterward, as it can rewrite the URLs.
