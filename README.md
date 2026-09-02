# FaST farmer SPA — Romanian demo (mocked backend)

This is the **real FaST farmer Quasar SPA** (`services/apps/farmer` from
[solclaus/fastplatform-mobile-farmer-mobile-app](https://github.com/solclaus/fastplatform-mobile-farmer-mobile-app),
product version 2.0.15), built as a static site for GitHub Pages.

It is **not** a from-scratch phone-shell mockup. The UI, routes, translations and
map components are the upstream farmer app. A client-side Apollo GraphQL mock
replaces Hasura/OIDC, and campaign plots use **official APIA IPA 2025 parcel
geometries** (UAT Mărculești, județ Ialomița, SIRUTA 179980).

## What you should see

- Romanian UI (`preferredLanguage = ro`, pathfinder `language_codes` `ro,en`)
- No login wall (OIDC skipped; demo user + tokens seeded)
- Holding **Fermă Mărculești** already present and IACS/APIA shown as synced
- Map: Esri World Imagery + OSM basemaps; 10 real IPA 2025 plots (~195.33 ha)
- Layer toggles: NVZ (covers the holding — Ialomița), Natura 2000 corridor nearby,
  water course along a drainage
- Fieldbook → ICPA PMN including the livestock step
- Photos and messages pages load without crashing

## Data notes

- Parcel **outlines** are public IPA 2025 contours (CC-BY-4.0, data.gov.ro).
- Grouping them as one farm, farmer identity, and overlay sketches (NVZ/Natura/hydro)
  are **fictional demo constructs**. The source dataset is GDPR-stripped.

## GitHub Pages

- `vueRouterMode`: hash
- `publicPath`: `/fast-romania-mockup/`
- `404.html` is a copy of `index.html`

Serve this folder at `https://<user>.github.io/fast-romania-mockup/`.
