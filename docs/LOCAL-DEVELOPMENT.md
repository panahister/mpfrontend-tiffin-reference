# Local development

The complete reference spans four repositories. Place them under one parent directory with these names:

```text
workspace/
  mpcore-tiffin-sample/
  mpfrontend-tiffin-reference/
  tiffin-keycloak/
  tiffin-apisix/
```

The backend repository owns the integrated Docker Compose topology. Its environment variables can point
to non-sibling locations if your checkout layout differs.

## Prerequisites

- Docker with at least 10 GB available to the local stack
- .NET SDK `10.0.400`
- Node.js `24.19.0`
- pnpm `11.25.0`
- `jq`, `curl`, and `grpcurl`
- `protoc` and `grpc_csharp_plugin` on Apple Silicon

## 1. Verify the frontend source

```bash
cd mpfrontend-tiffin-reference
npm install --global pnpm@11.25.0
node scripts/verify-core-artifacts.mjs
pnpm install --frozen-lockfile
pnpm check --skip-nx-cache
```

Do not skip archive verification. The reference intentionally refuses a mixed or modified MP Frontend
cohort.

## 2. Start backend dependencies

```bash
cd ../mpcore-tiffin-sample
TIFFIN_KEYCLOAK_SOURCE_DIR=../tiffin-keycloak \
TIFFIN_KEYCLOAK_PRODUCT_DIR=../tiffin-keycloak/product/tiffin-local \
TIFFIN_KEYCLOAK_THEME_DIR=../tiffin-keycloak/themes/tiffin \
TIFFIN_APISIX_PRODUCT_DIR=../tiffin-apisix/product/tiffin-local \
scripts/up.sh
scripts/setup.sh
```

The backend defaults may already match a sibling checkout. The explicit variables make the ownership
boundary visible. RustFS is the default S3-compatible media store; set `MEDIA_STORE=seaweedfs` to run the
retained alternative.

## 3. Run the nine backend services

```bash
scripts/run.sh all
```

Wait for the backend readiness command described in the backend repository before starting the frontend.

## 4. Build and start the frontend services

```bash
cd ../mpfrontend-tiffin-reference
docker compose -f compose.local.yaml build
docker compose -f compose.local.yaml up -d --no-build --wait
```

Open:

- Customer: `http://localhost:4411`
- Operations: `http://localhost:4412`
- Keycloak: `http://localhost:38180`
- APISIX HTTPS edge: `https://localhost:39443`

The full presentation server provides the custom-host realtime profile. Ordinary Next.js dev/start
commands are useful for focused UI work but do not prove that complete transport path.

## 5. Run the business scenarios

```bash
cd ../mpcore-tiffin-sample
scripts/scenarios.sh
```

The backend scenario suite exercises success, compensation, idempotency, concurrency, city isolation,
identity roles, media, tracking, notifications, service outages, and restaurant deadlines. Use the
[demo guide](DEMO-GUIDE.md) for browser roles and the intended manual journey.

## Stop without deleting data

```bash
cd ../mpfrontend-tiffin-reference
docker compose -f compose.local.yaml down

cd ../mpcore-tiffin-sample
scripts/down.sh
```

Do not add `--volumes` unless you intentionally want to remove the local POC data.

## Troubleshooting

- A package-integrity error means the committed archive cohort and lock disagree; do not edit a digest to
  suppress it.
- An OIDC redirect error usually means the current public origin is missing from the `tiffin-app` client.
- A gateway certificate error means the ignored local certificate and frontend trust configuration differ.
- A protected UI with no capabilities may be the wrong role for that surface; see [Demo guide](DEMO-GUIDE.md).
- A catalog without images usually indicates Media/RustFS readiness or an unseeded US demo dataset, not a
  frontend placeholder problem.
