# Contributing to PurgeQ

Thanks for considering a contribution. The project is small and the
codebase is intentionally easy to navigate — most fixes land in a
single file.

## Code of conduct

Be respectful, inclusive, professional. Disagreement is fine,
hostility isn't.

## Repo layout

- [`extension/`](extension/) — the browser extension. TypeScript +
  React + Vite. This is where 95% of changes happen.
- [`landing/`](landing/) — the landing site + auth bridge page.
  Static HTML / CSS / JSX (no build step).
- [`supabase/migrations/`](supabase/migrations/) — SQL migrations for
  the Supabase backend. Numbered chronologically, append-only.
- [`.github/workflows/release.yml`](.github/workflows/release.yml) —
  CI that builds + ships the extension on every semver tag.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the wider picture.

## Getting started

```bash
git clone https://github.com/Watashi199/PurgeQ.git
cd PurgeQ/extension
npm install
npm run build       # → extension/dist/
```

Load `extension/dist/` as an unpacked extension via
`chrome://extensions` → developer mode → Load unpacked.

For changes that touch Supabase (schema, RLS, RPC), write a new
migration in `supabase/migrations/` with the next available timestamp
prefix. Don't edit a migration that's already been applied to
production — write a follow-up instead.

## Development guidelines

### TypeScript / React

- Strict typing — `noImplicitAny`, `strictNullChecks` are on.
- Functional components with hooks.
- Type-check before pushing: `npx tsc --noEmit` in `extension/`.

### SQL

- Lowercase keywords, two-space indent.
- Comment the *why*, not the *what*.
- Helper functions go in the `private` schema so PostgREST doesn't
  expose them as RPC endpoints.

### Commit messages

Short imperative subject, then a paragraph of context if useful.
Conventional Commits prefixes (`feat:`, `fix:`, `docs:`, `refactor:`,
`chore:`) are nice but not enforced.

Examples that landed in this repo:

```
Refactor extension to talk directly to Supabase (SaaS backend)
Co-locate auth page under landing/auth/
Surface accept_invite errors as readable text (was "[object Object]")
```

## Pull request flow

1. Fork → branch → push → PR against `main`.
2. The PR should compile (`npx tsc --noEmit`) and build
   (`npm run build`) locally. CI doesn't currently run typecheck on
   PR but reviewers will.
3. For UI changes, attach a quick screenshot or screen capture.
4. For schema changes, include the migration file in the PR.

## Reporting bugs

Use the [issue tracker](https://github.com/Watashi199/PurgeQ/issues).
Include:

- Browser + extension version (visible in `chrome://extensions`).
- A short repro: what you clicked, what you expected, what happened.
- Screenshots or DevTools console output when relevant.

## Security reports

Don't open a public issue for security-sensitive bugs. See
[SECURITY.md](SECURITY.md) for how to report privately.

## License

By contributing you agree your code will be licensed under MIT (see
[LICENSE](LICENSE)).
