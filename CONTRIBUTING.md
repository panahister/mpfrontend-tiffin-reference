# Contributing

Thank you for improving the Tiffin reference. Changes should strengthen a real customer or operations
scenario while preserving the independent-consumer boundary with MP Frontend.

## Engineering rules

- Follow [Tiffin frontend conventions](docs/FRONTEND-CONVENTIONS.md) for placement, separation of concerns,
  generated ownership, and the API-feature verification path.
- Use Node.js `24.19.0` and pnpm `11.25.0`.
- Keep customer and operations applications independently buildable and deployable.
- Capture contracts only from an approved backend revision.
- Keep backend authorization authoritative; UI capability rules control presentation only.
- Preserve generated ownership and place product behavior in authored adapters.
- Review English/Arabic, LTR/RTL, and Light/Dark/System impact for visible changes.
- Keep private design files, credentials, local certificates, build output, and user data out of commits.

## Verification

```bash
node scripts/verify-core-artifacts.mjs
pnpm install --frozen-lockfile
pnpm check --skip-nx-cache
```

Add a regression for defects. If a change affects a business journey, describe both the successful and
refused path that was exercised. Do not edit archive hashes, generated output, or expected evidence merely
to conceal drift.

## Pull requests

State the product problem, role/city boundary, contract revision, authored/generated impact, evidence,
and limits. Follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Security vulnerabilities use the private
process in [SECURITY.md](SECURITY.md).
