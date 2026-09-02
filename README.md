# FaST Romania — stakeholder mockup

Static, clickable farmer-app mockup of **FaST for Romania** (campaign 2025).

**GitHub Pages:** <https://solclaus.github.io/fast-romania-mockup/>

Or open `index.html` in a browser (no build step). Hash routes (`#/plots`, `#/plot/P1`, …) work on GitHub Pages.

## What this is

A **fictional** holding already signed in via APIA. SyncHolding for campania 2025 has succeeded. Every official connection looks live (APIA IACS, LPIS, Copernicus-style satellite, weather, Navigator F3, geotagged photos). There is **no login wall, no backend, and no live APIs**.

Tiny label in the status bar: **FaST Romania · mockup**.

## Holding (demo)

| | |
|---|---|
| Name | Exploatația Câmpia Bărăgan |
| Location | Mărculești, Ialomița (IL), SIRUTA 179980 |
| Map centre | 44.5772°N, 27.5180°E |
| Parcels | 7 |
| Area | 66.00 ha (from polygon geometry) |
| Campaign | 2025 unique payment application `CU-IL-2025-08421` |

Crops: grâu, porumb, floarea-soarelui, rapiță, pajiște. Parcel polygons sit on **real field edges** visible in Esri World Imagery (Bărăgan plain east of Slobozia).

## Stack

- `index.html` + `css/app.css` + `js/data.js` + `js/app.js`
- Leaflet 1.9 (CDN) + Esri World Imagery (key-free)
- `data/holding.geojson` — same parcels for GIS inspection
- Hash routing; `404.html` is a copy of `index.html`

Field photos are Wikimedia Commons images (no people). See `assets/photos/ATTRIBUTION.txt`.
