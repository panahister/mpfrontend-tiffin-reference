# Demo guide

All accounts and businesses are fictional and intended only for the local proof of concept. Passwords are
deliberately low-value development credentials and must never be reused outside this stack.

## Seeded users

| Username | Password | City | Role | Intended surface |
|---|---|---|---|---|
| `olivia` | `olivia-lab` | Seattle | Customer | Customer app |
| `ethan` | `ethan-lab` | Seattle | Customer | Customer app |
| `emma` | `emma-lab` | Austin | Customer | Customer app |
| `madison` | `madison-lab` | Seattle | Restaurant manager | Operations app |
| `mason` | `mason-lab` | Austin | Restaurant manager | Operations app |
| `noah` | `noah-lab` | Seattle | Courier | Operations app |
| `ava` | `ava-lab` | Seattle | City administrator | Backend Access/governance APIs |
| `logan` | `logan-lab` | Austin | City administrator | Backend Access/governance APIs |
| `grace` | `grace-lab` | Platform | Platform administrator | Backend Access/governance APIs |

The operations panel is intentionally for restaurant and courier work. City and platform administrators
govern identities and role decisions through the Access service; they do not receive restaurant or courier
capabilities merely because their role is administratively powerful.

## Customer journey

1. Open the customer app and select Seattle.
2. Browse Harbor & Pine or Rain City Noodle House and inspect the three-item menu.
3. Sign in as `olivia`, or create a new customer through the Keycloak registration flow.
4. Add an item and place an order. Any non-empty bounded test phone and address are accepted by the POC.
5. Select the approved demo card outcome for the success path.
6. In another browser context, sign in to Operations as `madison` and accept the kitchen ticket.
7. Sign in as `noah`, go on duty, accept the delivery, report a position, and complete it.
8. Return to the customer app and observe tracking plus received, on-the-way, and delivered notifications.

Use the declined demo payment outcome to verify cancellation and compensation without real payment data.

## City isolation

Seattle users see Seattle restaurants and work; Austin users see Austin data. The city is a tenant claim
issued by Keycloak and enforced again by each backend. Switching the city selector does not grant access
to another tenant's protected records.

## Locale and appearance

Both applications support English and Arabic, LTR and RTL, and Light, Dark, or System appearance. The
selected application locale is forwarded to Keycloak through the standard OIDC `ui_locales` parameter so
login, registration, and password recovery follow the same language.

## Expected limitations

- Payment is a fictional provider played by WireMock.
- Addresses and phone numbers are permissive POC inputs, not a production delivery-address service.
- The local stack is single-host and not an HA or load-test environment.
- Demo credentials, local client secrets, and development TLS material are never production defaults.
