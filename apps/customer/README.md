# Tiffin customer application

The customer application is an independently buildable Next.js product surface generated from MP
Frontend foundations and completed with Tiffin-owned features. It supports restaurant discovery, menu
browsing, OIDC login and signup, orders, tracking, and notifications.

The browser calls the presentation server. Provider tokens and internal service origins remain in the
Security BFF. Generated contracts validate selected backend reads and writes; authored feature adapters
own product behavior and user experience.

Run the complete product topology through the repository root and
[local development guide](../../docs/LOCAL-DEVELOPMENT.md).
