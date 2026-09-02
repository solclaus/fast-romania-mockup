/* FaST Romania mockup — hash router, Leaflet maps, screens. No backend. */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const HOLD = FAST.holding;
  const P = FAST.parcels;
  const byId = Object.fromEntries(P.map((p) => [p.id, p]));

  let homeMap, plotMap, homeLayer, plotLayer;
  let selectedId = P[0].id;

  function fmtHa(n) {
    return Number(n).toFixed(2) + " ha";
  }
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function fmtDate(iso) {
    const m = String(iso).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return iso;
    return Number(m[3]) + " " + MONTHS[+m[2] - 1] + " " + m[1];
  }
  function fmtDateTime(iso) {
    const m = String(iso).match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) return fmtDate(iso);
    return fmtDate(iso) + ", " + m[4] + ":" + m[5];
  }

  function parseHash() {
    const h = (location.hash || "#/").replace(/^#/, "");
    const parts = h.split("/").filter(Boolean);
    const screen = parts[0] || "map";
    const id = parts[1];
    return { screen, id };
  }

  function go(path) {
    location.hash = path.startsWith("#") ? path : "#/" + path.replace(/^\//, "");
  }

  /* ---------- maps ---------- */
  const esriUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  const esriAttr = "Tiles © Esri — World Imagery · parcels: mock LPIS on visible fields";

  function styleFeat(feat, highlight) {
    const c = feat.properties.color;
    return {
      color: highlight ? "#ffffff" : c,
      weight: highlight ? 3 : 2,
      fillColor: c,
      fillOpacity: highlight ? 0.55 : 0.38,
    };
  }

  function geoJSON() {
    return {
      type: "FeatureCollection",
      features: P.map((p) => ({
        type: "Feature",
        properties: p,
        geometry: { type: "Polygon", coordinates: p.coordinates },
      })),
    };
  }

  function kickMap(map, layer) {
    if (!map) return;
    map.invalidateSize();
    if (layer) map.fitBounds(layer.getBounds(), { padding: [28, 72] });
  }

  function ensureHomeMap() {
    if (homeMap) {
      [0, 80, 250, 600].forEach((t) => setTimeout(() => kickMap(homeMap, homeLayer), t));
      return;
    }
    homeMap = L.map("home-map", {
      zoomControl: false,
      attributionControl: false,
    }).setView(HOLD.center, HOLD.zoom);
    L.tileLayer(esriUrl, { maxZoom: 19, attribution: esriAttr }).addTo(homeMap);
    homeLayer = L.geoJSON(geoJSON(), {
      style: (f) => styleFeat(f, false),
      onEachFeature: (f, layer) => {
        const p = f.properties;
        layer.bindPopup(
          `<div class="popup-t">${p.apiaId}</div>
           <div class="popup-s">${p.cropRo} · ${fmtHa(p.areaHa)}</div>`
        );
        layer.on("click", () => go("plot/" + p.id));
      },
    }).addTo(homeMap);
    homeMap.whenReady(() => kickMap(homeMap, homeLayer));
    [80, 250, 600].forEach((t) => setTimeout(() => kickMap(homeMap, homeLayer), t));
    if (window.ResizeObserver) {
      new ResizeObserver(() => homeMap && homeMap.invalidateSize()).observe(document.getElementById("home-map"));
    }
  }

  function ensurePlotMap(plot) {
    const el = $("#plot-map");
    if (plotMap) {
      plotMap.remove();
      plotMap = null;
    }
    plotMap = L.map(el, { zoomControl: false, attributionControl: false }).setView(plot.centroid, 16);
    L.tileLayer(esriUrl, { maxZoom: 19 }).addTo(plotMap);
    const gj = {
      type: "Feature",
      properties: plot,
      geometry: { type: "Polygon", coordinates: plot.coordinates },
    };
    plotLayer = L.geoJSON(gj, { style: () => styleFeat({ properties: plot }, true) }).addTo(plotMap);
    plotMap.whenReady(() => {
      plotMap.invalidateSize();
      plotMap.fitBounds(plotLayer.getBounds(), { padding: [20, 20] });
    });
    [80, 250].forEach((t) => setTimeout(() => {
      if (plotMap) {
        plotMap.invalidateSize();
        if (plotLayer) plotMap.fitBounds(plotLayer.getBounds(), { padding: [20, 20] });
      }
    }, t));
  }

  /* ---------- header / tabs ---------- */
  function setChrome(title, sub, showBack) {
    $("#hdr-title").textContent = title;
    $("#hdr-sub").textContent = sub;
    $("#header").classList.toggle("show-back", !!showBack);
  }

  function setTab(name) {
    $$(".tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === name));
  }

  function showScreen(id) {
    $$(".screen").forEach((s) => s.classList.toggle("active", s.id === "screen-" + id));
  }

  /* ---------- screens ---------- */
  function renderMapSheet() {
    $("#sheet-name").textContent = HOLD.name;
    $("#sheet-meta").textContent =
      HOLD.uat + ", " + HOLD.county + " · " + HOLD.parcelCount + " parcels · " + fmtHa(HOLD.totalHa);
  }

  function ndviSpark(series) {
    const w = 320, h = 64, pad = 6;
    const min = 0.15, max = 0.85;
    const n = series.length;
    const pts = series.map((v, i) => {
      const x = pad + (i * (w - pad * 2)) / (n - 1);
      const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
      return [x, y, v];
    });
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
    const last = pts[pts.length - 1];
    return `<svg class="ndvi-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <line x1="${pad}" y1="${h / 2}" x2="${w - pad}" y2="${h / 2}" stroke="#d7e3da" stroke-dasharray="3 3"/>
      <path d="${d}" fill="none" stroke="#1f7a45" stroke-width="2.4" stroke-linejoin="round"/>
      <circle cx="${last[0]}" cy="${last[1]}" r="4" fill="#1f7a45"/>
    </svg>`;
  }

  function renderPlots() {
    const el = $("#plots-list");
    const kpis = `<div class="kpis">
      <div class="kpi"><b>${HOLD.parcelCount}</b><span>Parcels</span></div>
      <div class="kpi"><b>${HOLD.totalHa.toFixed(2)}</b><span>Total ha</span></div>
      <div class="kpi"><b>2025</b><span>Campaign</span></div>
    </div>`;
    el.innerHTML =
      kpis +
      P.map(
        (p) => `<article class="card tap plot-card" data-go="plot/${p.id}">
        <div class="bar" style="background:${p.color}"></div>
        <div class="grow">
          <div class="id">APIA ${p.apiaId} · BF ${p.blocFizic} / ${p.nrParcela}</div>
          <h3>${p.cropRo}</h3>
          <div class="sub">${p.landuse} · NDVI ${p.ndvi.toFixed(2)} · ${p.cropEn}</div>
        </div>
        <div class="ha">${fmtHa(p.areaHa)}</div>
        <span class="chev material-symbols-outlined">chevron_right</span>
      </article>`
      ).join("");
  }

  function renderPlot(id) {
    const p = byId[id] || P[0];
    selectedId = p.id;
    $("#plot-body").innerHTML = `
      <div class="scroll tight">
        <div class="card">
          <div class="id" style="font-size:11px;color:var(--muted);font-weight:600">APIA ${p.apiaId} · crop code ${p.cropCode}</div>
          <h2 style="font-size:18px;margin:4px 0 8px">${p.cropRo}</h2>
          <div class="dl">
            <div><div class="k">Area</div><div class="v">${fmtHa(p.areaHa)}</div></div>
            <div><div class="k">Land use</div><div class="v">${p.landuse} (${p.landuseCode})</div></div>
            <div><div class="k">Declared</div><div class="v">${fmtDate(p.declared)}</div></div>
            <div><div class="k">Last update</div><div class="v">${fmtDate(p.updated)}</div></div>
            <div><div class="k">Bloc fizic</div><div class="v">${p.blocFizic}</div></div>
            <div><div class="k">Parcelă</div><div class="v">${p.nrParcela}</div></div>
          </div>
        </div>
        <div class="card">
          <div class="ndvi-head">
            <div>
              <div class="section-t" style="margin:0">Sentinel-2 NDVI</div>
              <div class="ndvi-val">${p.ndvi.toFixed(2)} <small>cloud-free ${fmtDate(p.ndviDate)}</small></div>
            </div>
          </div>
          ${ndviSpark(p.ndviSeries)}
          <div class="ndvi-months">${FAST.ndviMonths.map((m) => "<span>" + m + "</span>").join("")}</div>
        </div>
        <a class="btn" href="#/fertiliser/${p.id}">
          <span class="material-symbols-outlined">science</span> Navigator F3 recommendation
        </a>
        <a class="btn ghost" href="#/photos">
          <span class="material-symbols-outlined">photo_camera</span> Geotagged photos
        </a>
      </div>`;
    ensurePlotMap(p);
  }

  function splitN(n) {
    const basal = Math.round(n * 0.4);
    return { basal, top: n - basal };
  }

  function renderFert(id) {
    const p = byId[id] || byId[selectedId] || P[0];
    selectedId = p.id;
    const chips = P.map(
      (x) => `<button class="chip ${x.id === p.id ? "on" : ""}" data-go="fertiliser/${x.id}">${x.apiaId}</button>`
    ).join("");
    const sp = splitN(p.n);
    const unit = p.crop === "pajiște" ? "t DM/ha" : "t/ha";
    $("#fert-body").innerHTML = `
      <div class="select-row">${chips}</div>
      <div class="card">
        <div class="id" style="font-size:11px;color:var(--muted);font-weight:600">${p.cropRo} · ${fmtHa(p.areaHa)} · ${p.apiaId}</div>
        <h2 style="font-size:16px;margin:4px 0 6px">Target yield ${p.yieldT} ${unit}</h2>
        <div class="section-t" style="margin-top:8px">Recommended NPK</div>
        <div class="npk">
          <div class="cell"><b>${p.n}</b><span>N kg/ha</span></div>
          <div class="cell"><b>${p.p2o5}</b><span>P₂O₅ kg/ha</span></div>
          <div class="cell"><b>${p.k2o}</b><span>K₂O kg/ha</span></div>
        </div>
        <div class="dl" style="margin-top:12px">
          <div><div class="k">Basal (sowing)</div><div class="v">${sp.basal} N · ${p.p2o5} P₂O₅ · ${p.k2o} K₂O</div></div>
          <div><div class="k">Top-dress</div><div class="v">${sp.top} N kg/ha</div></div>
        </div>
      </div>
      <div class="card">
        <div class="section-t" style="margin-top:0">Soil sample (mock)</div>
        <div class="soil">
          <div class="cell"><b>${p.ph.toFixed(1)}</b><span>pH (H₂O)</span></div>
          <div class="cell"><b>${p.pSoil}</b><span>P-AL mg/kg</span></div>
          <div class="cell"><b>${p.kSoil}</b><span>K-AL mg/kg</span></div>
        </div>
      </div>
      <p class="disclaimer">Mockup — not a nitrate-directive legal tool. Navigator F3-style advisory rates for stakeholder walkthrough only. Do not use for compliance or application maps.</p>
    `;
  }

  function wxIcon(name) {
    if (name === "sunny") return "sunny";
    if (name === "rain") return "rainy";
    return "partly_cloudy_day";
  }

  function renderWeather() {
    const w = FAST.weather;
    const t = w[0];
    $("#wx-body").innerHTML = `
      <div class="wx-hero">
        <div class="loc">Mărculești, Ialomița · early September</div>
        <div class="temp">${t.tmax}°</div>
        <div class="desc">${t.desc} · ${t.tmin}° / ${t.tmax}° · wind ${t.wind} km/h</div>
      </div>
      <div class="wx-strip">
        ${w
          .map(
            (d) => `<div class="wx-day">
            <div class="wd">${d.label}</div>
            <div class="ic material-symbols-outlined">${wxIcon(d.icon)}</div>
            <div class="t">${d.tmax}° <span style="color:var(--muted);font-weight:500">${d.tmin}°</span></div>
            <div class="mm">${d.mm ? d.mm + " mm" : "—"}</div>
          </div>`
          )
          .join("")}
      </div>
      <div class="card" style="margin-top:12px">
        <div class="section-t" style="margin:0 0 6px">Station</div>
        <div class="dl">
          <div><div class="k">Location</div><div class="v">${HOLD.uat}, ${HOLD.county}</div></div>
          <div><div class="k">Period</div><div class="v">2–8 Sep 2026</div></div>
          <div><div class="k">7-day rain</div><div class="v">${w.reduce((s, d) => s + d.mm, 0)} mm</div></div>
          <div><div class="k">Source</div><div class="v">Weather service (mock)</div></div>
        </div>
      </div>`;
  }

  function renderPhotos() {
    $("#photos-body").innerHTML = FAST.photos
      .map((ph) => {
        const plot = byId[ph.plotId];
        return `<article class="card photo-card tap" data-go="plot/${ph.plotId}">
          <img src="${ph.src}" alt="${ph.caption}">
          <div class="body">
            <div class="cap">${ph.caption}</div>
            <div class="ex">
              ${plot.apiaId} · ${plot.cropRo}<br>
              ${fmtDateTime(ph.takenAt)} · ${ph.lat.toFixed(5)}°N ${ph.lon.toFixed(5)}°E · ±${ph.accM} m · hdg ${ph.heading}°
            </div>
          </div>
        </article>`;
      })
      .join("");
  }

  function cropTotals() {
    const m = {};
    P.forEach((p) => {
      m[p.cropRo] = (m[p.cropRo] || 0) + p.areaHa;
    });
    return Object.entries(m)
      .map(([k, v]) => `<div><div class="k">${k}</div><div class="v">${fmtHa(v)}</div></div>`)
      .join("");
  }

  function renderMore() {
    $("#more-body").innerHTML = `
      <div class="card">
        <h2 style="font-size:16px">${HOLD.name}</h2>
        <div class="sub" style="font-size:12px;color:var(--muted);margin:4px 0 10px">${HOLD.nameEn}</div>
        <div class="badge"><span class="dot"></span> ${HOLD.badge}</div>
        <div class="dl" style="margin-top:12px">
          <div><div class="k">Campaign</div><div class="v">${HOLD.campaign}</div></div>
          <div><div class="k">Cerere unică</div><div class="v">${HOLD.applicationId}</div></div>
          <div><div class="k">Județ</div><div class="v">${HOLD.county} (${HOLD.countyCode})</div></div>
          <div><div class="k">UAT / SIRUTA</div><div class="v">${HOLD.uat} · ${HOLD.siruta}</div></div>
          <div><div class="k">Parcels</div><div class="v">${HOLD.parcelCount}</div></div>
          <div><div class="k">Holding area</div><div class="v">${fmtHa(HOLD.totalHa)}</div></div>
          <div><div class="k">Declared</div><div class="v">${fmtDate(HOLD.declaredAt)}</div></div>
          <div><div class="k">SyncHolding</div><div class="v">${fmtDateTime(HOLD.syncAt)}</div></div>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:8px">${HOLD.apiaCentre}</div>
      </div>
      <div class="card">
        <div class="section-t" style="margin-top:0">Crops 2025</div>
        <div class="dl">${cropTotals()}</div>
      </div>
      <div class="card">
        <div class="section-t" style="margin-top:0">Connected services</div>
        ${FAST.services
          .map(
            (s) => `<div class="svc">
            <div class="ok">✓</div>
            <div><div class="name">${s.name}</div><div class="det">${s.detail}</div></div>
          </div>`
          )
          .join("")}
      </div>
      <a class="btn ghost" href="#/fertiliser/${selectedId}">Open Navigator F3</a>
      <p class="mini-note">FaST Romania · mockup · fictional holding · no live APIs</p>
    `;
  }

  /* ---------- router ---------- */
  function route() {
    const { screen, id } = parseHash();
    const tabMap = { map: "map", plots: "plots", plot: "plots", fertiliser: "more", photos: "photos", weather: "weather", more: "more" };

    if (screen === "plot" && id) {
      showScreen("plot");
      setTab("plots");
      const p = byId[id] || P[0];
      setChrome(p.apiaId, p.cropRo + " · " + fmtHa(p.areaHa), true);
      renderPlot(p.id);
      return;
    }
    if (screen === "fertiliser") {
      showScreen("fert");
      setTab("more");
      setChrome("Fertiliser", "Navigator F3-style · advisory mockup", true);
      renderFert(id);
      return;
    }
    if (screen === "plots") {
      showScreen("plots");
      setTab("plots");
      setChrome("Plots", "APIA IACS · campania 2025", false);
      renderPlots();
      return;
    }
    if (screen === "photos") {
      showScreen("photos");
      setTab("photos");
      setChrome("Photos", "Geotagged field captures", false);
      renderPhotos();
      return;
    }
    if (screen === "weather") {
      showScreen("weather");
      setTab("weather");
      setChrome("Weather", HOLD.uat + ", " + HOLD.county, false);
      renderWeather();
      return;
    }
    if (screen === "more") {
      showScreen("more");
      setTab("more");
      setChrome("Holding", "Connected services", false);
      renderMore();
      return;
    }
    showScreen("map");
    setTab("map");
    setChrome(HOLD.name, HOLD.uat + " · campania 2025", false);
    renderMapSheet();
    ensureHomeMap();
  }

  document.addEventListener("click", (e) => {
    const goEl = e.target.closest("[data-go]");
    if (goEl) {
      e.preventDefault();
      go(goEl.getAttribute("data-go"));
    }
  });

  $("#btn-back").addEventListener("click", () => history.back());
  $("#btn-locate").addEventListener("click", () => {
    if (homeMap && homeLayer) homeMap.fitBounds(homeLayer.getBounds(), { padding: [36, 80] });
  });

  window.addEventListener("hashchange", route);
  route();
})();
