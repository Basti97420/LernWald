// Lernwald – Anki-Add-on
// Copyright (C) 2026 Basti97420
// Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
// Ansichten: Gesamtkarte, ein Gebiet, Album. Was gezeichnet wird, liefert das Thema (thema-*.js).
(function () {
  "use strict";
  const { zufall, hash, f, grenze, esc, RANG } = window.LW;

  // Das Skript steht vor dem Inhalt der Seite, die Daten werden erst beim Start gelesen.
  let D, T, NAME, root;

  // Zeichnungen mit class="einpassen" bekommen einen Bildausschnitt, der genau um den Inhalt liegt
  function einpassen() {
    root.querySelectorAll("svg.einpassen").forEach((el) => {
      const b = el.firstElementChild.getBBox(), p = Math.max(b.width, b.height) * 0.08;
      el.setAttribute("viewBox", [b.x - p, b.y - p, b.width + 2 * p, b.height + 2 * p].map(f).join(" "));
    });
  }

  function befehl(cmd) {
    if (typeof pycmd === "function") pycmd(cmd);
  }

  const zustandText = (g) => T.zustand[g.zustand] + (g.gesundheit === null ? "" : " " + g.gesundheit + " %");
  const symbol = (inhalt) => `<svg class="einpassen" width="26" height="30"><g>${inhalt}</g></svg>`;

  // --- Rahmen ---------------------------------------------------------------

  function kopf(aktiv) {
    const da = D.belohnungen.filter((b) => D.album[b.id]).length;
    const knopf = (id, text) => `<button data-nav="${id}" class="${aktiv === id ? "an" : ""}">${text}</button>`;
    return `<header>
      <h1>${T.titel}</h1>
      <span class="kennzahlen">${D.gebiete.length} Gebiete · ${D.gesunde_gebiete} ${T.zustand.gesund} · ${T.zaehler(da, D.belohnungen.length)}</span>
      <nav>${knopf("karte", "Karte")}${knopf("album", T.album)}${knopf("einstellungen", "Einstellungen")}</nav>
    </header>` + (D.neu && D.neu.length
      ? `<div class="hinweis">${T.neu}: ${D.neu.map((b) => esc(NAME[b])).join(", ")}</div>` : "");
  }

  function binden() {
    root.querySelectorAll("[data-nav]").forEach((el) => el.addEventListener("click", () => {
      const ziel = el.dataset.nav;
      if (ziel === "einstellungen") befehl("lernwald:einstellungen");
      else if (ziel === "album") zeigeAlbum();
      else zeigeKarte();
    }));
    einpassen();
    root.querySelectorAll("[data-gebiet]").forEach((el) => el.addEventListener("click", () => zeigeGebiet(+el.dataset.gebiet)));
  }

  // --- Gesamtkarte ----------------------------------------------------------

  function anordnen(gebiete) {
    // Kreise nach Größe, spiralförmig ohne Überlappung gelegt
    const liste = gebiete.map((g, i) => ({ i, r: Math.min(46 + Math.sqrt(g.karten) * 3.2, 190) }))
      .sort((a, b) => b.r - a.r);
    const fertig = [];
    for (const o of liste) {
      if (!fertig.length) { o.x = 0; o.y = 0; fertig.push(o); continue; }
      for (let t = 0; ; t += 0.35) {
        const x = Math.cos(t) * t * 9 * 1.5, y = Math.sin(t) * t * 9;
        if (fertig.every((p) => Math.hypot(p.x - x, p.y - y) > p.r + o.r + 60)) { o.x = x; o.y = y; break; }
      }
      fertig.push(o);
    }
    return fertig.sort((a, b) => a.i - b.i);
  }

  function blob(R, rnd) {
    const n = 14, pkt = [];
    for (let i = 0; i < n; i++) {
      const w = (i / n) * Math.PI * 2, rr = R * (0.86 + rnd() * 0.22);
      pkt.push([Math.cos(w) * rr * 1.08, Math.sin(w) * rr * 0.9]);
    }
    let d = "";
    for (let i = 0; i < n; i++) {
      const a = pkt[i], b = pkt[(i + 1) % n], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      d += (i ? " Q" : `M${f((pkt[n - 1][0] + a[0]) / 2)},${f((pkt[n - 1][1] + a[1]) / 2)} Q`) + `${f(a[0])},${f(a[1])} ${f(m[0])},${f(m[1])}`;
    }
    return d + " Z";
  }

  function stichprobe(baeume, n) {
    if (baeume.length <= n) return baeume.slice();
    const out = [];
    for (let i = 0; i < n; i++) out.push(baeume[Math.floor((i + 0.5) * baeume.length / n)]);
    return out;
  }

  function zeigeKarte() {
    if (!D.gebiete.length) {
      root.innerHTML = kopf("karte") + `<div class="leer"><p>${T.leer}</p>
        <p>Lege unter „Einstellungen“ fest, welche Stapel oder Schlagwörter ein Gebiet bilden.</p></div>`;
      return binden();
    }
    const lage = anordnen(D.gebiete);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    lage.forEach((o) => {
      minX = Math.min(minX, o.x - o.r * 1.2); maxX = Math.max(maxX, o.x + o.r * 1.2);
      minY = Math.min(minY, o.y - o.r * 1.15); maxY = Math.max(maxY, o.y + o.r * 1.15 + 30);
    });
    const rand = 30;
    const vb = [minX - rand, minY - rand, maxX - minX + 2 * rand, maxY - minY + 2 * rand].map(f).join(" ");
    let s = "";
    // ein paar Grasbüschel als Hintergrund
    const hr = zufall(7);
    for (let i = 0; i < 160; i++) {
      const x = minX - rand + hr() * (maxX - minX + 2 * rand), y = minY - rand + hr() * (maxY - minY + 2 * rand);
      s += `<path d="M${f(x)},${f(y)} l-2,-4 M${f(x)},${f(y)} l0,-5 M${f(x)},${f(y)} l2,-4" class="gras"/>`;
    }
    D.gebiete.forEach((g, i) => {
      const o = lage[i], rnd = zufall(hash(g.name));
      const boden = T.boden[g.zustand];
      let inhalt = `<path d="${blob(o.r, rnd)}" fill="${boden[0]}" stroke="${boden[1]}" stroke-width="3" class="flaeche"/>`;
      if (T.kartenDeko) inhalt += T.kartenDeko(o.r, rnd);
      const zahl = grenze(Math.round(Math.sqrt(g.karten) * 2.4), 3, 70);
      const gross = grenze(o.r / 120, 0.35, 0.75);
      const orte = stichprobe(g.baeume, zahl).map(() => {
        const w = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * o.r * 0.78;
        return { x: Math.cos(w) * d * 1.05, y: Math.sin(w) * d * 0.8 - o.r * 0.08, d };
      });
      let stuecke = stichprobe(g.baeume, zahl);
      if (T.zentriert) {  // Große Häuser in die Mitte, Bauplätze an den Rand
        orte.sort((a, b) => a.d - b.d);
        stuecke = stuecke.map((b) => ({ b, rang: RANG[b[0]] + rnd() })).sort((a, b) => a.rang - b.rang).map((x) => x.b);
      }
      const punkte = stuecke.map((b, k) => ({ b, x: orte[k].x, y: orte[k].y }));
      (g.belohnungen || []).forEach((t) => {
        const w = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * o.r * 0.6;
        punkte.push({ t, x: Math.cos(w) * d, y: Math.sin(w) * d * 0.7 });
      });
      punkte.sort((a, b) => a.y - b.y).forEach((p) => {
        const bild = p.t ? T.belohnung(p.t) : T.bild(p.b[0], p.b[1], rnd);
        const sk = p.t ? gross * T.belohnungGroesse * 0.8 : gross;
        inhalt += `<g transform="translate(${f(p.x)},${f(p.y)}) scale(${f(sk)})">${bild}</g>`;
      });
      const art = T.groesse(g);
      const zeile2 = (art ? art + " · " : "") + `${g.karten} Karten · ` +
        (g.gesundheit === null ? "noch nichts gelernt" : zustandText(g));
      const breite = Math.max(g.name.length * 9.5, zeile2.length * 6.4) + 24;
      inhalt += `<g transform="translate(0,${f(o.r * 0.9)})" class="schild">
          <rect x="${f(-breite / 2)}" y="-17" width="${f(breite)}" height="38" rx="5"/>
          <text y="-1" class="name">${esc(g.name)}</text><text y="14" class="info">${esc(zeile2)}</text></g>`;
      s += `<g class="gebiet" data-gebiet="${i}" transform="translate(${f(o.x)},${f(o.y)})">${inhalt}</g>`;
    });
    root.innerHTML = kopf("karte") +
      `<svg class="karte" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${s}</svg>` + legende();
    binden();
  }

  function legende() {
    return `<div class="legende">` + Object.keys(T.stufen).map((st) =>
      `<span>${symbol(T.bild(st, 0, zufall(3)))}${T.stufen[st]}</span>`
    ).join("") + `<span>${symbol(T.bild("jung", 1, zufall(5)))}${T.welk}</span></div>`;
  }

  // --- Ein Gebiet -----------------------------------------------------------

  function zeigeGebiet(i) {
    const g = D.gebiete[i], rnd = zufall(hash(g.name) ^ 0x9e37);
    const geo = { W: 1000, H: 620, HORIZONT: 190, WIESE: 90, zustand: g.zustand };  // vorne bleibt Platz für Tiere bzw. Bauten
    const { W, H, HORIZONT, WIESE } = geo;
    const boden = T.boden[g.zustand];
    const himmel = g.zustand === "verwildert" ? ["#c9cbc4", "#e6e2d4"] : ["#9fd0ef", "#e4f3fb"];
    const n = g.baeume.length;
    const plaetze = T.plaetze(g.baeume, rnd, geo);
    const dinge = g.baeume.map((b, k) => Object.assign({ b }, plaetze[k]));
    const belohnungen = (g.belohnungen || []).map((t, k, alle) =>
      ({ t, x: (k + 0.5 + (rnd() - 0.5) * 0.5) * W / alle.length, y: H - WIESE * 0.45 + rnd() * WIESE * 0.3, s: T.belohnungGroesse }));
    let s = `<defs><linearGradient id="himmel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${himmel[0]}"/><stop offset="1" stop-color="${himmel[1]}"/></linearGradient>
      <linearGradient id="boden" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${boden[1]}"/><stop offset="1" stop-color="${boden[0]}"/></linearGradient></defs>
      <rect width="${W}" height="${HORIZONT + 20}" fill="url(#himmel)"/>
      <path d="M0,${HORIZONT + 5} Q180,${HORIZONT - 55} 380,${HORIZONT - 5} T760,${HORIZONT - 20} T1000,${HORIZONT} L1000,${HORIZONT + 20} L0,${HORIZONT + 20} Z" fill="${boden[1]}" opacity=".55"/>
      <rect y="${HORIZONT}" width="${W}" height="${H - HORIZONT}" fill="url(#boden)"/>`;
    if (g.zustand !== "verwildert") s += `<circle cx="880" cy="70" r="28" fill="#fff3b0" opacity=".9"/>`;
    if (T.vorne) s += T.vorne(geo);
    s += plaetze.deko || "";
    dinge.sort((a, b) => a.y - b.y).concat(belohnungen.sort((a, b) => a.y - b.y)).forEach((d) => {
      const bild = d.t ? T.belohnung(d.t) : T.bild(d.b[0], d.b[1], rnd);
      s += `<g transform="translate(${f(d.x)},${f(d.y)}) scale(${f(d.s)})">${bild}</g>`;
    });
    const z = g.zahlen;
    const zeilen = Object.keys(T.stufen).map((st) =>
      `<tr><td>${symbol(T.bild(st, 0, zufall(3)))}</td><td>${T.stufen[st]}</td><td class="zahl">${z[st]}</td></tr>`
    ).join("");
    const namen = (g.belohnungen || []).map((t) => esc(NAME[t])).join(", ");
    const art = T.groesse(g);
    root.innerHTML = kopf("") + `<div class="gebietkopf"><button data-nav="karte">← Karte</button>
        <h2>${esc(g.name)}</h2>${art ? `<span class="art">${art}</span>` : ""}<span class="zustand ${g.zustand}">${zustandText(g).replace(/ (\d+ %)$/, " · $1")}</span></div>
      <svg class="szene" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice">${s}</svg>
      <div class="gebietinfo"><table>${zeilen}<tr><td>${symbol(T.bild("jung", 1, zufall(5)))}</td><td>davon fällig: ${T.welk.split(" – ")[0]}</td><td class="zahl">${g.welk}</td></tr></table>
      <p>${namen ? T.hier(namen) : g.zustand === "gesund" ? T.nochKeine(D.min_reife) : T.nurGesund}</p>
      ${n < g.karten ? `<p class="klein">Gezeichnet: ${n} von ${g.karten} Karten (gleichmäßig ausgewählt).</p>` : ""}</div>`;
    binden();
  }

  // --- Album ----------------------------------------------------------------

  function zeigeAlbum() {
    const karten = D.belohnungen.map((t) => {
      const da = D.album[t.id];
      const datum = da ? new Date(da + "T12:00:00").toLocaleDateString("de-DE") : "";
      return `<div class="fund ${da ? "" : "fehlt"} ${D.neu && D.neu.includes(t.id) ? "neu" : ""}">
        <svg class="einpassen" width="132" height="110"><g>${T.belohnung(t.id)}</g></svg>
        <b>${da ? esc(t.name) : "?"}</b>
        <span>${da ? T.datum + " " + datum : T.ab(t.ab)}</span></div>`;
    }).join("");
    root.innerHTML = kopf("album") + `<p class="erklaerung">${T.erklaerung}</p><div class="album">${karten}</div>`;
    binden();
  }

  function start() {
    D = JSON.parse(document.getElementById("lernwald-daten").textContent);
    T = window.LW.themen[D.thema] || window.LW.themen.wald;
    NAME = Object.fromEntries(D.belohnungen.map((t) => [t.id, t.name]));
    root = document.getElementById("lernwald");
    zeigeKarte();
  }

  window.lernwald = { zeigeKarte, zeigeGebiet, zeigeAlbum };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
