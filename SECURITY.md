# Security policy

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub's
[private vulnerability reporting](https://github.com/Mbarney928/pixelproof/security/advisories/new).
Do not open a public issue. You can expect an acknowledgement within a few days.

## Scope and data

- pixelproof is a CLI that screenshots pages you point it at, plus a static review app. It has no server,
  accounts, telemetry or API keys, and it needs no secrets.
- Everything in this repository is **synthetic**. "Lumen Supply" is an invented store, and the Storybook
  fixture images are drawn by a script.
- Screenshots and reports are written only to your local `.pixelproof/` folder (gitignored). Review
  decisions stay in the reviewer's browser until they export them.

## Measures in place

- The review app accepts reports only from relative `.json` paths inside its own folder. Image paths are
  validated against a strict pattern, and a strict Content Security Policy is set (`script-src 'self'`,
  `connect-src 'self'`). `v-html` is banned by lint.
- Config files, reports and approvals are validated with zod, and approvals must match the run they were
  made for.
- The demo server only serves files inside its site folder.
- gitleaks runs as a pre-commit hook and in CI over full history.
- `npm audit` runs in CI: no known vulnerabilities in production dependencies, and none rated high or
  above in dev tooling.
- Dependabot updates npm packages and GitHub Actions.
- Workflows use read-only default permissions, actions pinned to full commit SHAs,
  `persist-credentials: false` and no repository secrets.
