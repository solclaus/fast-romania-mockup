const $ = (s, r=document) => r.querySelector(s);
let geo = null, geoById = {}, thumbs = {}, leafletMaps = [];

function svgPath(coords, w=108, h=72, pad=4) {
  let minx=Infinity,miny=Infinity,maxx=-Infinity,maxy=-Infinity;
  coords[0].forEach(([x,y]) => { if(x<minx)minx=x; if(y<miny)miny=y; if(x>maxx)maxx=x; if(y>maxy)maxy=y; });
  const dx=maxx-minx||1, dy=maxy-miny||1;
  const s = Math.min((w-pad*2)/dx, (h-pad*2)/dy);
  const ox = (w - dx*s)/2, oy = (h - dy*s)/2;
  const d = coords[0].map(([x,y],i) => {
    const px = ox + (x-minx)*s;
    const py = oy + (maxy-y)*s;
    return (i?"L":"M")+px.toFixed(1)+","+py.toFixed(1);
  }).join(" ")+" Z";
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#7d9aa0"/><path d="${d}" fill="#c8d6c0" stroke="#fff" stroke-width="1.2"/></svg>`;
}

async function loadGeo() {
  const r = await fetch("data/holding.geojson");
  geo = await r.json();
  geo.features.forEach(f => {
    const id = f.properties.plot_id || f.id;
    geoById[id] = f;
    thumbs[id] = svgPath(f.geometry.coordinates);
  });
}

function go(hash) { location.hash = hash; }
function route() {
  leafletMaps.forEach(m => { try { m.remove(); } catch(e){} });
  leafletMaps = [];
  const h = (location.hash || "#/").replace(/^#/, "") || "/";
  const parts = h.split("/").filter(Boolean);
  const view = parts[0] || "home";
  if (view === "exploatatie") renderFarm();
  else if (view === "parcela") renderParcel(parts[1]);
  else if (view === "ingrasamant") renderNmp(parts[1]);
  else if (view === "servicii") renderServices();
  else if (view === "mesaje") parts[1] ? renderThread(parts[1]) : renderInbox();
  else if (view === "vreme") renderWeather();
  else if (view === "foto") renderPhotos();
  else renderHome();
}

function shell(title, {back, mail, extraRight, tab, hideTab}={}) {
  const mailBtn = mail !== false ? `<button class="nav-btn badge" onclick="go('#/mesaje')" aria-label="Mesaje">
    <svg viewBox="0 0 24 24" fill="none" stroke="#6B7B91" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/></svg>
  </button>` : (extraRight || `<span class="nav-btn"></span>`);
  const left = back ? `<button class="nav-btn" onclick="history.back()" aria-label="Înapoi">
    <svg viewBox="0 0 24 24" fill="none" stroke="#6B7B91" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
  </button>` : `<span class="nav-btn"></span>`;
  $("#app").innerHTML = `
    <div class="status"><span class="sig">•••••</span><span></span><span>100%</span></div>
    <div class="navbar">${left}<h1>${title}</h1>${mailBtn}</div>
    <div class="content" id="c"></div>
    ${hideTab ? "" : toolbar(tab)}`;
}

function toolbar(tab) {
  const items = [
    ["home", "#/", "img/toolbar/icon-activity-ios.svg"],
    ["farm", "#/exploatatie", "img/toolbar/icon-map-of-roads-ios.svg"],
    ["nmp", "#/ingrasamant", "img/toolbar/icon-leaves-ios.svg"],
    ["svc", "#/servicii", "img/toolbar/icon-add-round-ios.svg"]
  ];
  return `<nav class="toolbar">${items.map(([k,href,src]) =>
    `<a href="${href}" class="${k===tab?"on":""}"><img src="${src}" alt=""></a>`).join("")}</nav>`;
}

function renderHome() {
  shell("FaST", {tab:"home"});
  const p8 = FAST.parcels.find(p => p.id==="P8");
  $("#c").innerHTML = `
    <div class="sec">Astăzi</div>
    <div class="card">
      <p>Aveți <b>1 solicitare nouă</b> de la APIA Ialomița privind cererea unică de plată 2025.</p>
      <div class="link-right"><a href="#/mesaje">Deschide mesajele</a></div>
    </div>
    <div class="card">
      <p>Cererea unică de plată pentru <b>anul de cerere 2025</b> se depune în 3 zile.</p>
      <a class="cta" href="#/servicii">Depune cererea</a>
    </div>
    <div class="card" onclick="go('#/ingrasamant/2025')" style="cursor:pointer">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div><span style="margin-right:6px">🌿</span> Plan de fertilizare · an de cerere 2025</div>
        <span class="tag">activ</span>
      </div>
      <div class="nmp-row">
        <div class="thumb">${thumbs.P8 || ""}</div>
        <div class="nmp-meta">
          <div class="title">Parcelă TA-08</div>
          <div class="sub">Aplicare gunoi de grajd</div>
          <div class="val">1,5 t/ha</div>
        </div>
      </div>
    </div>`;
}

function renderFarm() {
  shell("Exploatația mea", {tab:"farm"});
  $("#c").innerHTML = `
    <div class="sec">Parcele agricole</div>
    <div class="hscroll">
      ${FAST.parcels.map(p => `
        <div class="pcard" onclick="go('#/parcela/${p.id}')">
          <div class="nm">Parcelă ${p.id}</div>
          <div class="map">${thumbs[p.id]||""}</div>
          <div class="ha">${p.ha.toFixed(2).replace(".",",")} ha</div>
        </div>`).join("")}
    </div>
    <div class="add-line">Adăugați sau importați o parcelă agricolă…</div>
    <div class="sec">Efective de animale</div>
    <div class="live-row">
      ${FAST.livestock.map(l => `<div class="live"><div class="ic">${l.icon}</div><div class="n">${l.n}</div></div>`).join("")}
      <div class="live add">+</div>
    </div>
    <div class="add-line">Adăugați sau modificați efectivele…</div>
    <div class="sec">Clădiri și suprafețe neagricole</div>`;
}

function renderParcel(id) {
  const p = FAST.parcels.find(x => x.id===id) || FAST.parcels[0];
  shell("Parcelă " + p.id, {back:true, tab:"farm"});
  $("#c").innerHTML = `
    <div id="pmap" class="pmap"></div>
    <div class="facts">
      <div>Suprafață: <b>${p.ha.toFixed(2).replace(".",",")} ha</b><br>UAT: <b>${FAST.uat}</b></div>
      <div>ID: <b>${p.id}</b><br>${p.useLabel}</div>
    </div>
    <div class="sec">Constrângeri</div>
    ${p.nvz ? `<div class="constraint">⛰ Zonă vulnerabilă la nitrați <span class="view">Vizualizați</span></div>` : ""}
    ${p.natura ? `<div class="constraint">🌿 Sit Natura 2000 <span class="view">Vizualizați</span></div>` : `<div class="constraint" style="color:#8b95a3">Nicio constrângere suplimentară</div>`}
    <div class="sec">Cultură și producție</div>
    <div class="card">
      <p><b>${p.crop}</b>${p.yield ? ` · producție ${String(p.yield).replace(".",",")} t/ha` : ""}</p>
      ${p.photo ? `<p style="margin-top:8px"><a href="#/foto">Fotografie georeferențiată</a></p>` : ""}
    </div>`;
  mountMap("pmap", [p.id]);
}

function renderNmp(which) {
  if (which === "2025") {
    shell("Plan 2025", {back:true, tab:"nmp"});
    $("#c").innerHTML = `
      <div class="sec">Plan activ</div>
      <div class="card">
        <p><b>Plan de fertilizare · an de cerere 2025</b></p>
        <p>Exploatația Mărculești · 195,33 ha</p>
      </div>
      <div class="row" onclick="go('#/parcela/P8')">
        <div class="av">${thumbs.P8||""}</div>
        <div><div class="t">Parcelă TA-08 · porumb</div><div class="d">Gunoi de grajd bovin 1,5 t/ha · producție 8,7 t/ha</div></div>
      </div>
      <div class="row">
        <div><div class="t">Efective de animale</div><div class="d">18 bovine · 42 ovine</div></div>
      </div>
      <div class="card"><p>Bilanț NPK precompletat din datele ICPA / APIA.</p></div>`;
    return;
  }
  shell("Planurile mele de fertilizare", {tab:"nmp"});
  $("#c").innerHTML = `
    <div class="sec">Plan activ</div>
    <div class="row" onclick="go('#/ingrasamant/2025')">
      <div class="av" style="display:flex;align-items:center;justify-content:center">🌿</div>
      <div><div class="t">Plan pentru anul de cerere 2025</div><div class="d">Creat la 12.03.2025</div></div>
      <span class="tag">activ</span>
    </div>
    <div class="sec">Planuri anterioare</div>
    <div class="row"><div><div class="t">Plan 2024</div></div><span class="chev">›</span></div>
    <div style="padding:16px"><button class="cta">Creați un plan nou</button></div>`;
}

function renderServices() {
  shell("Alte servicii", {tab:"svc"});
  $("#c").innerHTML = `
    <div class="sec">Serviciile mele</div>
    <div class="row">
      <div class="svc-logo" style="background:#1f4e9e">APIA</div>
      <div style="flex:1">
        <div class="t">Cerere unică de plată</div>
        <div class="d">Completați, verificați și depuneți cererea unică. Istoricul plăților.</div>
        <div class="d">Serviciu România</div>
      </div>
      <button class="pill">Dezactivare</button>
    </div>
    <div class="row">
      <div class="svc-logo" style="background:#2e7d32">S2</div>
      <div style="flex:1">
        <div class="t">Imagini satelitare</div>
        <div class="d">Imagini agronomice zilnice Sentinel-2 (Copernicus) pentru exploatație.</div>
        <div class="d">Serviciu Uniunea Europeană</div>
      </div>
      <button class="pill">Dezactivare</button>
    </div>
    <div class="row">
      <div class="svc-logo" style="background:#528A97">ICPA</div>
      <div style="flex:1">
        <div class="t">ICPA PMN</div>
        <div class="d">Plan de fertilizare pe baza datelor de sol.</div>
        <div class="d">Serviciu România</div>
      </div>
      <button class="pill">Dezactivare</button>
    </div>
    <div class="add-line">Activați alte servicii…</div>`;
}

function renderInbox() {
  shell("Mesaje", {mail:false, extraRight:`<span class="nav-btn">+</span>`, tab:"home"});
  const groups = {};
  FAST.messages.forEach(m => { (groups[m.section]=groups[m.section]||[]).push(m); });
  $("#c").innerHTML = Object.entries(groups).map(([sec, items]) =>
    `<div class="sec">${sec}</div>` + items.map(m => `
      <div class="row" onclick="go('#/mesaje/${m.id}')">
        <div class="av" style="display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;background:#1f4e9e;color:#fff">${m.from.slice(0,2)}</div>
        <div style="min-width:0;flex:1">
          <div class="t">${m.from}</div>
          <div class="d">${m.preview}</div>
        </div>
        <div class="when">${m.when}</div>
      </div>`).join("")
  ).join("");
}

function renderThread(id) {
  const m = FAST.messages.find(x => x.id===id) || FAST.messages[0];
  shell(m.title, {back:true, mail:false, extraRight:`<span class="nav-btn">···</span>`, hideTab:true});
  const content = $("#c");
  const draw = () => {
    content.innerHTML = m.thread.map(b => `
      <div class="bubble">
        <div class="who">${b.who}<span class="tm">${b.time}</span></div>
        <div class="txt">${b.text}</div>
        ${b.photo ? `<img class="pic" src="${b.photo}" alt="Fotografie georeferențiată">` : ""}
      </div>`).join("") + `
      <div class="composer">
        <span style="color:#8b95a3;font-size:20px">+</span>
        <input id="msg" placeholder="Solicitare…">
      </div>`;
    const inp = $("#msg");
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter" && inp.value.trim()) {
        m.thread.push({ who: "Fermier", time: "acum", text: inp.value.trim() });
        draw();
        content.scrollTop = content.scrollHeight;
      }
    });
  };
  draw();
}

function renderWeather() {
  shell("Vremea", {back:true, tab:"home"});
  $("#c").innerHTML = `
    <div class="sec">Prognoză</div>
    <div class="forecast">
      <div></div>${FAST.weather.map(w=>`<div class="hd">${w.d}</div>`).join("")}
      <div class="ic">🌡</div>${FAST.weather.map(w=>`<div>${w.t}</div>`).join("")}
      <div class="ic">☀️</div>${FAST.weather.map(w=>`<div class="ic">${w.ic}</div>`).join("")}
      <div class="ic">💧</div>${FAST.weather.map(w=>`<div>${w.p}</div>`).join("")}
    </div>
    <div class="sec">Hărți</div>
    <div class="card" style="padding:8px 16px;color:#8b95a3;font-size:13px">Radar precipitații · Mărculești</div>
    <div id="wmap" class="wxmap"></div>`;
  mountMap("wmap", FAST.parcels.map(p=>p.id), 13);
}

function renderPhotos() {
  shell("Fotografii georeferențiate", {back:true, tab:"farm"});
  const shots = FAST.parcels.filter(p => p.photo);
  $("#c").innerHTML = shots.map(p => `
    <div class="card">
      <img class="pic" src="${p.photo}" alt="" style="width:100%;display:block;border-radius:2px">
      <p style="margin-top:8px">Parcelă ${p.id} · ${FAST.uat} · atașată parcelei</p>
    </div>`).join("");
}

function mountMap(elId, ids, z=15) {
  const el = document.getElementById(elId);
  if (!el || !window.L || !geo) return;
  const feats = geo.features.filter(f => ids.includes(f.properties.plot_id || f.id));
  const map = L.map(el, { zoomControl: false, attributionControl: false });
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}").addTo(map);
  const layer = L.geoJSON({type:"FeatureCollection", features: feats}, {
    style: { color: "#4fc3f7", weight: 2, fillOpacity: 0.15 }
  }).addTo(map);
  try { map.fitBounds(layer.getBounds().pad(0.15)); } catch(e) { map.setView([44.556, 27.53], z); }
  leafletMaps.push(map);
  setTimeout(() => map.invalidateSize(), 80);
}

window.addEventListener("hashchange", route);
loadGeo().then(route);
