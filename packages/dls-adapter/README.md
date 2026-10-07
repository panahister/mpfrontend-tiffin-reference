# Reference UI adapter

Owns Tiffin visual composition, typography and the supplied Figma icon.
Imports the public neutral UI package; it does not copy its interaction implementation.
Customer and admin applications load this adapter. Default Button/Field/Select design contexts were
inspected; complete component, interaction, contrast and responsive acceptance remains open.

The reference theme is in `../../themes/tiffin-dls/`. Applications load its palette and this
adapter stylesheet after neutral core styles. Fonts are local, consumer-owned assets:

- Inter 4.1 variable WOFF2: official rsms/inter v4.1, SIL Open Font License retained in assets/fonts.
- Noto Sans Arabic variable TTF: google/fonts revision 8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5,
  SIL Open Font License retained beside the font.

On 2026-10-07 the owner accepted any frontend font while forbidding Figma changes. Noto Sans Arabic
is an intentional frontend-only substitute for the source RTL font, not exact Figma typography parity.
The default Select icon keeps its intrinsic 24px geometry inside the source 18px positioning slot.
Publication is gated on tests, verified distribution rights and an explicit approved registry identity.
