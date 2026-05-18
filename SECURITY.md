# Security Policy

## Supported versions

PurgeQ is a single-track project. Only the latest published version of
the extension and the live SaaS backend receive security fixes. Earlier
versions stop being supported as soon as a newer one ships to the
stores.

## Reporting a vulnerability

Please report security issues privately — **do not open a public issue
on the tracker**.

### 📩 Where to report

DM **@Watashi_R6S** on X (Twitter) with the words "PurgeQ security" in
your message, or open a private security advisory on GitHub:
<https://github.com/Watashi199/PurgeQ/security/advisories/new>

### 🔒 What to include

- A clear description of the vulnerability.
- Steps to reproduce it.
- Affected component (extension popup / content script / Supabase
  migration / auth bridge page).
- Potential impact (data leak, account takeover, persistent XSS, etc.).
- Proof of concept when possible.

### 🧠 What happens next

- I'll acknowledge the report within a few days.
- Valid issues get patched as quickly as possible. For high-impact
  vulnerabilities I'll fast-track a release.
- You're welcome to be credited in the release notes if you want.
- Declined reports come with a short explanation.

### 🚫 Please do not

- Publicly disclose before a fix is released.
- Exploit issues against real user data — RLS lets you create your own
  test accounts to demonstrate scope.

## Scope notes

- **In scope**: the extension code (`extension/`), the auth bridge page
  (`landing/auth/`), the Supabase migrations and RLS policies
  (`supabase/migrations/`), the GitHub Actions release workflow.
- **Out of scope**: vulnerabilities in upstream dependencies that
  haven't been patched yet (please report those to their respective
  projects), social engineering of maintainers, and issues that
  require a compromised user device.

Thanks for helping keep PurgeQ safe.
