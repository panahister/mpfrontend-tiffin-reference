## Product problem

Describe the customer or operations scenario and the affected role, city, and contract.

## Change

Describe authored and generated ownership, API compatibility, localization, and security impact.

## Evidence

- [ ] `node scripts/verify-core-artifacts.mjs`
- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm check --skip-nx-cache`
- [ ] Relevant success and failure paths were exercised.
- [ ] English/Arabic and LTR/RTL impact was reviewed.
- [ ] No credentials, personal data, private design material, or generated caches are included.

## Limits

State what this change does not prove or support.
