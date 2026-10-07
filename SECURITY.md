# Security policy

## Reporting a vulnerability

Report suspected vulnerabilities privately through
[GitHub Security Advisories](https://github.com/panahister/mpfrontend-tiffin-reference/security/advisories/new).
Do not publish credentials, tokens, cookies, personal data, private design material, or exploitable
deployment details in an issue or pull request.

Include the affected surface and revision, prerequisites, impact, a minimal reproduction, and any known
mitigation. Use fictional or redacted data. The maintainer will investigate and coordinate disclosure
after a fix or mitigation is available; no fixed response time is promised for this proof of concept.

## Supported versions

Only the latest commit on `main` is evaluated for security fixes. The vendored MP Frontend packages are
prerelease artifacts; older cohorts do not receive backports unless a release note says otherwise.

## Deployment responsibility

This repository demonstrates a local product integration. Consumers remain responsible for production
TLS, origin policy, secret and key custody, identity-provider configuration, backend authorization,
Redis and gateway hardening, high availability, rate limits, dependency updates, monitoring, data
protection, and deployment-specific threat review.
