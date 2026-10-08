# Local development

Tiffin supports three explicit local workflows. Choose by what you need to edit, not by which parts of
the architecture you want to see: every mode uses the same Keycloak realm, APISIX routes, nine business
services, default RustFS media store, US demo data, Customer application, and Operations application.

## Choose a workflow

| Workflow | Docker owns | Host owns | Best for |
|---|---|---|---|
| **Hybrid Mode** | Infrastructure and the four frontend processes | Nine .NET services | Backend breakpoints, service changes, migrations, and scenario work |
| **Frontend Mode** | The complete seeded backend platform | Customer and Operations with Next.js hot reload, plus both host BFFs | UI, BFF, generated-contract, localization, and product-adapter work |
| **Full Demo Mode** | The entire product | Nothing | Reviewers and contributors who want the integrated result with one command |

The complete reference spans four public repositories. Keep them as siblings:

```text
workspace/
├── mpcore-tiffin-sample/
├── mpfrontend-tiffin-reference/
├── tiffin-keycloak/
└── tiffin-apisix/
```

```bash
git clone https://github.com/panahister/mpcore-tiffin-sample.git
git clone https://github.com/panahister/mpfrontend-tiffin-reference.git
git clone https://github.com/panahister/tiffin-keycloak.git
git clone https://github.com/panahister/tiffin-apisix.git
```

The backend repository owns the integrated Docker topology. Advanced layouts may set
`TIFFIN_FRONTEND_SOURCE_DIR`, `TIFFIN_BACKEND_SOURCE_DIR`, and the documented Keycloak/APISIX source
variables instead of using sibling checkouts.

## Frontend Mode

This is the shortest path for frontend implementation. Docker builds and starts PostgreSQL,
TimescaleDB, Kafka, RabbitMQ, Redis, Keycloak, APISIX, WireMock, RustFS, and all nine .NET services. It
then waits for health and seeds four US restaurants, twelve menu items, and their media through the real
product APIs. Ports `4411` and `4412` remain free for host debugging.

Prerequisites:

- Git and Docker with at least 10 GB available
- Node.js `24.19.0`
- pnpm `11.25.0`

Start the backend:

```bash
cd mpcore-tiffin-sample
scripts/full-demo.sh up-backend
```

Install and run the editable frontend:

```bash
cd ../mpfrontend-tiffin-reference
node scripts/verify-core-artifacts.mjs
pnpm install --frozen-lockfile
pnpm dev:product
```

`pnpm dev:product` starts four supervised host processes: Customer presentation, Customer BFF,
Operations presentation, and Operations BFF. The presentation runtimes use Next.js development mode.
Both BFFs use the containerized Redis validation profile and the ignored, machine-local session key.
The launcher copies only the generated local APISIX certificate into the ignored trust location; no
credential or key is committed or printed.

Open:

- Customer: `http://localhost:4411`
- Operations: `http://localhost:4412`
- Keycloak: `http://localhost:38180`
- APISIX HTTPS edge: `https://localhost:39443`

Verify the applications and real seeded catalog:

```bash
curl --fail --silent http://localhost:4411/ >/dev/null
curl --fail --silent http://localhost:4412/ >/dev/null
curl --fail --silent 'http://localhost:4411/api/catalog?search=seattle&page=1&size=1' >/dev/null
```

Keep the Docker backend running during the daily edit loop. Next.js reloads presentation changes; restart
`pnpm dev:product` after BFF or launcher changes.

Press `Ctrl+C` once to stop all four frontend processes. The backend and demo data remain running, so a
frontend restart is fast. Stop that backend without deleting data:

```bash
cd ../mpcore-tiffin-sample
scripts/full-demo.sh down
```

Use `scripts/full-demo.sh reset` only when you intentionally want to delete the local demo databases,
queues, identity state, and media volumes.

## Hybrid Mode

This path keeps infrastructure in Docker, all nine .NET services on the host, and the four frontend
processes in Docker. It gives backend developers direct IDE/debugger ownership while still presenting
the complete browser product.

Prerequisites add the .NET SDK `10.0.400`, `jq`, `curl`, `grpcurl`, and protobuf tooling on Apple Silicon.

```bash
cd mpcore-tiffin-sample
scripts/up.sh
scripts/setup.sh
scripts/run.sh all
python3 scripts/seed-us-poc.py

cd ../mpfrontend-tiffin-reference
node scripts/verify-core-artifacts.mjs
pnpm install --frozen-lockfile
docker compose -f compose.local.yaml up --detach --build --wait
```

Verify that both browser applications reach the host-debugged services:

```bash
curl --fail --silent http://localhost:4411/ >/dev/null
curl --fail --silent http://localhost:4412/ >/dev/null
```

Before review, run `scripts/scenarios.sh` from the backend checkout. The browser and scenario requests use
the same Keycloak, APISIX, messaging, storage, and service ports that the IDE-hosted services use.

Open the same Customer and Operations URLs. To debug one backend in an IDE, stop the launcher process
for that service before binding its port. The backend [running guide](https://github.com/panahister/mpcore-tiffin-sample/blob/main/docs/running.md)
explains one-service execution and scenario commands.

Stop without deleting data:

```bash
cd ../mpfrontend-tiffin-reference
docker compose -f compose.local.yaml down

cd ../mpcore-tiffin-sample
scripts/run.sh stop
scripts/down.sh
```

## Full Demo Mode

This path requires only Git and Docker with at least 10 GB available. It builds every application image
from the four checked-out repositories, waits for the platform, applies the idempotent demo seed, and
starts the browser applications:

```bash
cd mpcore-tiffin-sample
scripts/full-demo.sh up
```

The command prints `The complete Tiffin demo is ready.` only after health checks and the idempotent seed
succeed. Verify Customer, Operations, and identity discovery:

```bash
curl --fail --silent http://localhost:4411/ >/dev/null
curl --fail --silent http://localhost:4412/ >/dev/null
curl --fail --silent http://localhost:38180/realms/tiffin/.well-known/openid-configuration >/dev/null
```

Use:

```bash
scripts/full-demo.sh status
scripts/full-demo.sh logs
scripts/full-demo.sh down
```

`down` preserves data. `reset` deletes the named local volumes. Add `--observability` to include the
collector, Prometheus, Grafana, Jaeger, and Kafka UI. RustFS is the default; run
`MEDIA_STORE=seaweedfs scripts/full-demo.sh up` to select the retained S3-compatible alternative.

## Verify frontend source without running the product

```bash
cd mpfrontend-tiffin-reference
node scripts/verify-core-artifacts.mjs
pnpm install --frozen-lockfile
pnpm check --skip-nx-cache
```

Do not skip archive verification. The reference intentionally refuses a mixed or modified MP Frontend
cohort.

## Trade-offs and safety rules

- Full Demo is the simplest evaluation but does not provide host breakpoints.
- Frontend Mode is optimized for UI/BFF work; backend image rebuilds are slower than a host
  service restart.
- Hybrid Mode exposes every .NET process to the host debugger but requires the full backend
  toolchain and more terminals or an IDE.
- Do not run Full Demo together with either host mode: they intentionally use the same local ports.
- A package-integrity error means the committed MP Frontend archive cohort and lock disagree; do not edit
  a digest to suppress it.
- An OIDC redirect error usually means the current public origin is missing from the `tiffin-app` client.
- A gateway certificate error means the generated backend certificate and ignored BFF trust copy differ;
  restart the selected workflow instead of disabling TLS validation.
- A protected UI with no capabilities may be the wrong role for that surface; see the
  [Demo guide](DEMO-GUIDE.md).
- A catalog without images usually indicates Media/store readiness or a failed demo seed, not a frontend
  placeholder problem.

The full presentation server provides the custom-host realtime profile. Focused `next dev` commands are
useful for isolated UI work, but only the documented product launcher proves both BFF and realtime paths.
