# Clean verification and CI contract

This repository is an independent MP Frontend consumer. It uses exact vendored prerelease packages and
contains no source alias to the MP Frontend repository.

## Package integrity

`core-artifacts.lock.json` declares twelve archives under `artifacts/packages/`, their package names,
versions, SHA-256 digests, and expected exports. The archives are committed so a clean checkout contains
the exact cohort required by `pnpm-lock.yaml`.

Before dependency installation, run:

```bash
node scripts/verify-core-artifacts.mjs
```

The verifier checks inventory completeness, archive bytes, consumer dependency/override declarations,
lockfile integrity, path containment, and symlink refusal. Matching hashes prove byte identity against the
reviewed lock, not independent provenance, vulnerability status, or production suitability.

## Source gate

```bash
pnpm install --frozen-lockfile
NX_DAEMON=false NX_ISOLATE_PLUGINS=false NEXT_TELEMETRY_DISABLED=1 \
  pnpm check --skip-nx-cache
```

The gate includes artifact verification and nineteen uncached lint, typecheck, test, build,
generated-check, and design-verify targets. Application builds explicitly depend on library builds so a
warm local `dist/` directory cannot conceal a missing dependency edge.

## Current verified cohort

The lock digest is `b98535404c82706c548fe741a2f192787e5bf3d689bfaa799d536efe9bf909a0`.
The current CLI/plugin/AI procedure versions are `0.1.0-dev.18`, `0.1.0-dev.17`, and `0.1.0-dev.11`.
A clean publication checkout passed archive verification, frozen installation, and all nineteen targets.

## Design boundary

The public theme verifier checks the independently authored Tiffin semantic theme across Light, Dark, and
System modes. Private design bindings, exports, file keys, generated ownership state, and product-external
provenance are excluded. Theme verification is not a substitute for human visual or accessibility review.

## What CI does not prove

- Live backend and browser journeys.
- Dependency vulnerability status unless the separate networked audit runs.
- Production TLS, secret custody, HA Redis, load, or regional failover.
- Full accessibility conformance.
- Rights to any external design source a consumer may attach privately.
- Package-registry availability or stable semantic-version compatibility.
