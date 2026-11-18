// Lernwald – Anki-Add-on
// Copyright (C) 2026 Basti97420
// Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
// Ansichten: Gesamtkarte, ein Gebiet, Album. Was gezeichnet wird, liefert das Thema (thema-*.js).
(function () {
  "use strict";
  const { zufall, hash, f, grenze, esc, RANG, wahl, schatten } = window.LW;

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
  // Themen können die fertige Zeichnung umfärben (Tusche-Stadt: Schraffur statt Farbe)
  const N = (svg) => (T.nachbearbeiten ? T.nachbearbeiten(svg) : svg);
  const symbol = (inhalt) => `<svg class="einpassen" width="26" height="30"><g class="zeichnung">${N(inhalt)}</g></svg>`;
  const zahl = (n) => Number(n).toLocaleString("de-DE");
  const datumText = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("de-DE");

  // --- Rahmen ---------------------------------------------------------------

  function kopf(aktiv) {
    const da = D.belohnungen.filter((b) => D.album[b.id]).length;
    const knopf = (id, text) => `<button data-nav="${id}" class="${aktiv === id ? "an" : ""}">${text}</button>`;
    return `<header>
      <h1>${T.titel}</h1>
      <span class="kennzahlen">${D.gebiete.length} Gebiete · ${D.gesunde_gebiete} ${T.zustand.gesund} · ${T.zaehler(da, D.belohnungen.length)}${serieText()}</span>
      <nav>${knopf("karte", "Karte")}${knopf("chronik", "Chronik")}${knopf("album", T.album)}${knopf("einstellungen", "Einstellungen")}</nav>
    </header>` + (D.neu && D.neu.length
      ? `<div class="hinweis">${T.neu}: ${D.neu.map((b) => esc(NAME[b])).join(", ")}</div>` : "");
  }

  function serieText() {
    const c = D.chronik;
    if (!c) return "";
    return (c.serie ? ` · Serie ${c.serie} ${c.serie === 1 ? "Tag" : "Tage"}` : "") + ` · heute ${zahl(c.heute)} Wiederholungen`;
  }

  function binden() {
    root.querySelectorAll("[data-nav]").forEach((el) => el.addEventListener("click", () => {
      const ziel = el.dataset.nav;
      if (ziel === "einstellungen") befehl("lernwald:einstellungen");
      else if (ziel === "album") zeigeAlbum();
      else if (ziel === "chronik") zeigeChronik();
      else zeigeKarte();
    }));
    einpassen();
    root.querySelectorAll("svg.von-oben").forEach(zoomen);
    root.querySelectorAll("[data-gebiet]").forEach((el) => el.addEventListener("click", () => zeigeGebiet(+el.dataset.gebiet)));
  }

  // Ansicht von oben: Mausrad zoomt zur Maus hin, Ziehen verschiebt, Doppelklick stellt zurück
  function zoomen(svg) {
    const vb = svg.viewBox.baseVal, start = [vb.x, vb.y, vb.width, vb.height];
    const punkt = (e) => {
      const p = svg.createSVGPoint();
      p.x = e.clientX; p.y = e.clientY;
      return p.matrixTransform(svg.getScreenCTM().inverse());
    };
    svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      const k = Math.pow(1.0015, e.deltaY), breite = grenze(vb.width * k, start[2] / 6, start[2] * 2.5);
      const p = punkt(e), q = breite / vb.width;
      vb.x = p.x - (p.x - vb.x) * q; vb.y = p.y - (p.y - vb.y) * q;
      vb.width = breite; vb.height *= q;
    }, { passive: false });
    let griff = null;
    svg.addEventListener("pointerdown", (e) => { griff = punkt(e); svg.setPointerCapture(e.pointerId); svg.classList.add("zieht"); });
    svg.addEventListener("pointermove", (e) => {
      if (!griff) return;
      const p = punkt(e);
      vb.x -= p.x - griff.x; vb.y -= p.y - griff.y;
    });
    const los = () => { griff = null; svg.classList.remove("zieht"); };
    svg.addEventListener("pointerup", los);
    svg.addEventListener("pointercancel", los);
    svg.addEventListener("dblclick", () => { [vb.x, vb.y, vb.width, vb.height] = start; });
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
    root.innerHTML = kopf("karte") + karte() + legende();
    binden();
  }

  // Nur die Karte, ohne Kopf und Legende: liegt blass hinter der Stapelübersicht von Anki
  function zeigeHintergrund() {
    if (!D.gebiete.length) root.innerHTML = "";
    else root.innerHTML = root.dataset.ansicht === "gebiet" ? szene(0, false).svg : karte();
  }

  function karte() {
    const lage = anordnen(D.gebiete);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    lage.forEach((o) => {
      minX = Math.min(minX, o.x - o.r * 1.2); maxX = Math.max(maxX, o.x + o.r * 1.2);
      minY = Math.min(minY, o.y - o.r * 1.15); maxY = Math.max(maxY, o.y + o.r * 1.15 + 30);
    });
    const rand = 30;
    const vb = [minX - rand, minY - rand, maxX - minX + 2 * rand, maxY - minY + 2 * rand].map(f).join(" ");
    let s = "", schilder = "";
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
      const lt = g.chronik ? g.chronik.lerntage : 0;
      const zeile2 = (art ? art + " · " : "") + `${g.karten} Karten · ` + (lt ? `${lt} Lerntage · ` : "") +
        (g.gesundheit === null ? "noch nichts gelernt" : zustandText(g));
      const breite = Math.max(g.name.length * 9.5, zeile2.length * 6.4) + 24;
      schilder += `<g class="gebiet" data-gebiet="${i}" transform="translate(${f(o.x)},${f(o.y + o.r * 0.9)})"><g class="schild">
          <rect x="${f(-breite / 2)}" y="-17" width="${f(breite)}" height="38" rx="5"/>
          <text y="-1" class="name">${esc(g.name)}</text><text y="14" class="info">${esc(zeile2)}</text></g></g>`;
      s += `<g class="gebiet" data-gebiet="${i}" transform="translate(${f(o.x)},${f(o.y)})">${inhalt}</g>`;
    });
    s += voegel(minX - rand - 40, minY - rand, maxX - minX + 2 * rand + 80, (maxY - minY) * 0.5, 5, zufall(11));
    return `<svg class="karte" viewBox="${vb}" preserveAspectRatio="xMidYMid meet"><g class="zeichnung">${N(s)}</g>${schilder}</svg>`;
  }

  function legende() {
    return `<div class="legende">` + Object.keys(T.stufen).map((st) =>
      `<span>${symbol(T.bild(st, 0, zufall(3)))}${T.stufen[st]}</span>`
    ).join("") + `<span>${symbol(T.bild("jung", 1, zufall(5)))}${T.welk}</span></div>`;
  }

  // --- Ein Gebiet -----------------------------------------------------------

  // Ein Gebiet als Bild. wachsen: Bäume bzw. Häuser wachsen beim Öffnen nacheinander aus dem Boden
  function szene(i, wachsen) {
    const g = D.gebiete[i], rnd = zufall(hash(g.name) ^ 0x9e37);
    const c = g.chronik || {};
    const zeit = D.chronik ? D.chronik.tageszeit : null;
    const wetter = c.quote == null ? "sonne" : c.quote >= 90 ? "sonne" : c.quote >= 80 ? "wolken" : "regen";
    if (T.szene) {  // eigene Ansicht des Themas: die Stadt von oben (iso-stadt.js)
      const iso = T.szene(g, { rnd, zeit, wetter, c, wachsen, hilfen: { dauer, figur, voegel } });
      const fuellen = root.classList.contains("lw-hintergrund") ? "slice" : "meet";
      const grund = T.nachbearbeiten ? "#f4ecd8" : iso.grund;
      return { svg: `<svg class="szene von-oben" viewBox="${iso.viewBox}" preserveAspectRatio="xMidYMid ${fuellen}" style="background:${grund}">` +
        `<g class="zeichnung">${N(iso.svg)}</g></svg>`, n: g.baeume.length, c, wetter, zeit };
    }
    const geo = { W: 1000, H: 620, HORIZONT: 190, WIESE: 90, zustand: g.zustand };  // vorne bleibt Platz für Tiere bzw. Bauten
    const { W, H, HORIZONT, WIESE } = geo;
    const boden = T.boden[g.zustand];
    const himmel = g.zustand === "verwildert" || wetter === "regen" ? ["#c9cbc4", "#e6e2d4"] : HIMMEL[zeit] || HIMMEL.tag;
    const n = g.baeume.length;
    const plaetze = T.plaetze(g.baeume, rnd, geo);
    const dinge = g.baeume.map((b, k) => Object.assign({ b }, plaetze[k]));
    const belohnungen = (g.belohnungen || []).map((t, k, alle) =>
      ({ t, x: (k + 0.5 + (rnd() - 0.5) * 0.5) * W / alle.length, y: H - WIESE * 0.45 + rnd() * WIESE * 0.3, s: T.belohnungGroesse }));
    let s = `<defs><linearGradient id="himmel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${himmel[0]}"/><stop offset="1" stop-color="${himmel[1]}"/></linearGradient>
      <linearGradient id="boden" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${boden[1]}"/><stop offset="1" stop-color="${boden[0]}"/></linearGradient></defs>
      <rect x="-20" y="-20" width="${W + 40}" height="${HORIZONT + 40}" fill="url(#himmel)"/>
      <path d="M0,${HORIZONT + 5} Q180,${HORIZONT - 55} 380,${HORIZONT - 5} T760,${HORIZONT - 20} T1000,${HORIZONT} L1000,${HORIZONT + 20} L0,${HORIZONT + 20} Z" fill="${boden[1]}" opacity=".55"/>
      <rect x="-20" y="${HORIZONT}" width="${W + 40}" height="${H - HORIZONT + 20}" fill="url(#boden)"/>`;
    s += gestirn(zeit, g.zustand !== "verwildert" && wetter !== "regen", rnd);
    if (wetter !== "sonne" || g.zustand === "verwildert") s += wolken(wetter === "regen" ? 5 : 3, wetter === "regen", rnd);
    const ausbau = T.ausbau ? T.ausbau(c.lerntage || 0, rnd, geo) : {};
    s += ausbau.hinten || "";
    if (T.vorne) s += T.vorne(geo);
    s += plaetze.deko || "";
    const alle = dinge.sort((a, b) => a.y - b.y).concat(belohnungen.sort((a, b) => a.y - b.y));
    const jedes = Math.max(1, Math.ceil(n / 120));  // höchstens rund 120 Bäume wiegen sich, sonst wird es zäh
    alle.forEach((d, k) => {
      let bild = d.t ? T.belohnung(d.t) : T.bild(d.b[0], d.b[1], rnd);
      if (T.wiegen && !d.t && k % jedes === 0) bild = `<g class="lw-wiegen" style="${dauer(4 + rnd() * 3, rnd)}">${bild}</g>`;
      if (wachsen) bild = `<g class="lw-wachsen" style="animation-delay:${f(0.1 + 1.4 * k / Math.max(1, alle.length))}s">${bild}</g>`;
      s += `<g transform="translate(${f(d.x)},${f(d.y)}) scale(${f(d.s)})">${bild}</g>`;
    });
    s += ausbau.vorne || "";
    // Bewohner: so viele wie heute in diesem Gebiet wiederholt wurde (höchstens 30)
    const leute = [];
    for (let k = 0; k < Math.min(30, c.heute || 0); k++) leute.push({ x: 20 + rnd() * (W - 40), y: H - WIESE + 16 + rnd() * (WIESE - 22) });
    leute.sort((a, b) => a.y - b.y).forEach((p) => {
      s += `<g transform="translate(${f(p.x)},${f(p.y)}) scale(1.5)">${geher(rnd, 15 + rnd() * 35)}</g>`;
    });
    if ((c.serie || 0) >= 7) s += wimpel(geo, rnd);
    if (wetter === "regen") s += regen(geo, rnd);
    if (wetter !== "regen" && zeit !== "nacht") s += voegel(-60, 40, W + 120, 90, g.zustand === "gesund" ? 7 : 3, rnd);
    return { svg: `<svg class="szene" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice"><g class="zeichnung">${N(s)}</g></svg>`,
      n, c, wetter, zeit };
  }

  function zeigeGebiet(i) {
    const g = D.gebiete[i];
    const { svg, n, c, wetter, zeit } = szene(i, true);
    const z = g.zahlen;
    const zeilen = Object.keys(T.stufen).map((st) =>
      `<tr><td>${symbol(T.bild(st, 0, zufall(3)))}</td><td>${T.stufen[st]}</td><td class="zahl">${z[st]}</td></tr>`
    ).join("");
    const namen = (g.belohnungen || []).map((t) => esc(NAME[t])).join(", ");
    const art = T.groesse(g);
    root.innerHTML = kopf("") + `<div class="gebietkopf"><button data-nav="karte">← Karte</button>
        <h2>${esc(g.name)}</h2>${art ? `<span class="art">${art}</span>` : ""}<span class="zustand ${g.zustand}">${zustandText(g).replace(/ (\d+ %)$/, " · $1")}</span></div>
      ${svg}
      <div class="gebietinfo"><table>${zeilen}<tr><td>${symbol(T.bild("jung", 1, zufall(5)))}</td><td>davon fällig: ${T.welk.split(" – ")[0]}</td><td class="zahl">${g.welk}</td></tr></table>
      <div><p>${namen ? T.hier(namen) : g.zustand === "gesund" ? T.nochKeine(D.min_reife) : T.nurGesund}</p>
      ${T.lebenText ? `<p>${T.lebenText({ zustand: g.zustand, reif: z.baum + z.alt, sicherheit: g.sicherheit, hoch: g.hoch })}</p>` : ""}
      ${gebietChronik(c, wetter, zeit)}
      ${n < g.karten ? `<p class="klein">Gezeichnet: ${n} von ${g.karten} Karten (gleichmäßig ausgewählt).</p>` : ""}</div></div>`;
    binden();
  }

  // --- Bewegung (Vorbild: Capriccio von emollick; eigener Code) ----------------
  // Dauer und Startpunkt je Element zufällig, damit sich nichts im Gleichschritt bewegt

  function dauer(sek, rnd) {
    return `animation-duration:${f(sek)}s;animation-delay:-${f(rnd() * sek)}s`;
  }

  // Jemand geht hin und her (Richtung zufällig) und wippt dabei
  function geher(rnd, weg) {
    const bild = T.bewohner ? T.bewohner(rnd) : figur(rnd);
    return `<g${rnd() < 0.5 ? ' transform="scale(-1,1)"' : ""}><g class="lw-gehen" style="--weg:${f(weg)}px;${dauer(14 + rnd() * 16, rnd)}">` +
      `<g class="lw-wippen" style="${dauer(0.5 + rnd() * 0.2, rnd)}">${bild}</g></g></g>`;
  }

  // Vögel ziehen mit Flügelschlag von links nach rechts über einen Streifen (x, y, Breite, Höhe)
  function voegel(x, y, breite, hoehe, anzahl, rnd) {
    let s = "";
    for (let i = 0; i < anzahl; i++) {
      const g = 0.7 + rnd() * 0.6;
      s += `<g transform="translate(${f(x)},${f(y + rnd() * hoehe)}) scale(${f(g)})">` +
        `<g class="lw-flug" style="--weg:${f(breite / g)}px;${dauer(28 + rnd() * 26, rnd)}">` +
        `<path class="lw-fluegel" style="${dauer(0.45 + rnd() * 0.25, rnd)}" d="M-7,0 Q-3.5,-4.5 0,0 Q3.5,-4.5 7,0" stroke="#3d342b" stroke-width="1.4" fill="none" stroke-linecap="round"/></g></g>`;
    }
    return s;
  }

  // --- Wetter, Licht, Bewohner (aus der Statistik) ----------------------------

  const HIMMEL = {
    morgen: ["#a9d4ef", "#fbe3cc"], tag: ["#9fd0ef", "#e4f3fb"],
    abend: ["#e39a63", "#f7d9a8"], nacht: ["#1f2d4d", "#4a5a80"],
  };
  const ZEIT_TEXT = { morgen: "morgens", tag: "tagsüber", abend: "abends", nacht: "nachts" };
  const WETTER_TEXT = { sonne: "Sonne", wolken: "Wolken", regen: "Regen" };

  function gestirn(zeit, klar, rnd) {
    if (zeit === "nacht") {
      let s = `<circle cx="860" cy="70" r="20" fill="#f4f0d2"/><circle cx="870" cy="64" r="17" fill="#2a3a5e"/>`;
      for (let i = 0; i < 40; i++) {
        s += `<circle cx="${f(rnd() * 1000)}" cy="${f(rnd() * 170)}" r="${f(0.6 + rnd())}" fill="#f4f0d2" opacity=".8" class="lw-stern" style="${dauer(1.5 + rnd() * 3, rnd)}"/>`;
      }
      return s;
    }
    if (!klar) return "";
    const y = zeit === "abend" ? 150 : zeit === "morgen" ? 120 : 70, x = zeit === "morgen" ? 120 : 880;
    return `<circle cx="${x}" cy="${y}" r="28" fill="${zeit === "abend" ? "#f6b26b" : "#fff3b0"}" opacity=".9"/>`;
  }

  function wolke(x, y, s, farbe) {
    return `<g transform="translate(${f(x)},${f(y)}) scale(${f(s)})"><ellipse cx="0" cy="0" rx="34" ry="12" fill="${farbe}"/>` +
      `<circle cx="-14" cy="-6" r="13" fill="${farbe}"/><circle cx="6" cy="-12" r="17" fill="${farbe}"/><circle cx="22" cy="-4" r="11" fill="${farbe}"/></g>`;
  }

  function wolken(n, dunkel, rnd) {
    let s = "";
    for (let i = 0; i < n; i++) {
      s += `<g class="lw-wolke" style="--weg:${f(30 + rnd() * 60)}px;${dauer(30 + rnd() * 30, rnd)}">` +
        wolke(80 + (i + rnd() * 0.6) * 860 / n, 45 + rnd() * 70, 0.9 + rnd() * 0.8, dunkel ? "#a9adb0" : "#f7f7f2") + "</g>";
    }
    return s;
  }

  function regen(g, rnd) {
    let d = "";
    for (let i = 0; i < 260; i++) {
      const x = rnd() * g.W, y = 60 + rnd() * (g.H - 60);
      d += `M${f(x)},${f(y)} l-3,10 `;
    }
    return `<path d="${d}" stroke="#7d93a8" stroke-width="1" opacity=".45" fill="none" class="lw-regen"/>`;
  }

  function figur(r) {  // Bewohner bzw. Wanderer
    const k = wahl(r, ["#c8322b", "#2f6fb3", "#3e8e41", "#8a5a34", "#6b4a8a", "#d9b434"]);
    return schatten(3.5) + `<path d="M-2.6,0 L-1.6,-7 L1.6,-7 L2.6,0 Z" fill="${k}"/>` +
      `<rect x="-1.9" y="-11.5" width="3.8" height="5" rx="1.2" fill="${k}"/><circle cx="0" cy="-13.6" r="2.1" fill="#e9c9a8"/>`;
  }

  function wimpel(g, rnd) {  // Wimpelkette ab 7 Tagen Serie im Gebiet
    const y0 = g.H - 8, oben = y0 - 70, farben = ["#c8322b", "#f2d640", "#2f6fb3", "#3e8e41"];
    let s = "";
    [30, 970].forEach((x) => { s += `<path d="M${x},${y0} L${x},${oben}" stroke="#6b4a2b" stroke-width="2.4"/>`; });
    const n = 34, punkte = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      punkte.push([30 + t * 940, oben + 4 + Math.sin(Math.PI * t) * 34]);
    }
    s += `<path d="M${punkte.map((p) => p.map(f).join(",")).join(" L")}" stroke="#5a4a3a" stroke-width=".8" fill="none"/>`;
    punkte.slice(1, -1).forEach((p, i) => {
      s += `<path d="M${f(p[0] - 6)},${f(p[1])} L${f(p[0] + 6)},${f(p[1])} L${f(p[0])},${f(p[1] + 12)} Z" fill="${farben[i % 4]}" class="lw-wimpel" style="${dauer(1.6 + rnd(), rnd)}"/>`;
    });
    return s;
  }

  function gebietChronik(c, wetter, zeit) {
    if (!c || !c.lerntage) return `<p class="klein">Hier wurde noch nicht gelernt.</p>`;
    const teile = [
      `<b>${zahl(c.lerntage)}</b> Lerntage${T.ausbauText ? " – " + T.ausbauText(c.lerntage) : ""}`,
      c.serie ? `Serie <b>${c.serie}</b> ${c.serie === 1 ? "Tag" : "Tage"}${c.serie >= 7 ? " – Wimpel hängen" : ""}` :
        c.pause ? `seit <b>${c.pause}</b> ${c.pause === 1 ? "Tag" : "Tagen"} nicht gelernt` : "",
      `heute <b>${c.heute}</b> Wiederholungen${c.heute ? " – so viele " + (T.leuteText || "Leute") + " sind unterwegs" : ""}`,
      c.quote == null ? "" : `Trefferquote (30 Tage) <b>${c.quote} %</b> – ${WETTER_TEXT[wetter]}`,
      zeit ? `Licht: meist ${ZEIT_TEXT[zeit]} gelernt` : "",
    ].filter(Boolean);
    return `<ul class="statistik">${teile.map((t) => `<li>${t}</li>`).join("")}</ul>`;
  }

  // --- Chronik --------------------------------------------------------------

  const MEILENSTEIN = {
    wiederholungen: { text: (n) => `${zahl(n)} Wiederholungen`, bild: "obelisk" },
    lerntage: { text: (n) => `${zahl(n)} Lerntage`, bild: "saeule" },
    serie: { text: (n) => `${zahl(n)} Tage Serie`, bild: "bogen" },
  };

  function denkmal(art) {
    const stein = "#cfc9be", dunkel = "#a9a398";
    const sockel = `<rect x="-12" y="-6" width="24" height="6" fill="${dunkel}"/><rect x="-9" y="-10" width="18" height="4" fill="${stein}"/>`;
    if (art === "obelisk") return schatten(14) + sockel + `<path d="M-5,-10 L-3.4,-52 L0,-58 L3.4,-52 L5,-10 Z" fill="${stein}"/>`;
    if (art === "saeule") return schatten(14) + sockel + `<rect x="-4" y="-48" width="8" height="38" fill="${stein}"/>` +
      `<path d="M-2,-46 L-2,-12 M0,-46 L0,-12 M2,-46 L2,-12" stroke="${dunkel}" stroke-width=".5"/>` +
      `<rect x="-6.5" y="-52" width="13" height="4" fill="${dunkel}"/><circle cx="0" cy="-56" r="4" fill="#c9a640"/>`;
    return schatten(18) + `<path d="M-16,0 L-16,-34 L16,-34 L16,0 L7,0 L7,-14 A7,7 0 0 0 -7,-14 L-7,0 Z" fill="${stein}"/>` +
      `<rect x="-18" y="-40" width="36" height="6" fill="${dunkel}"/>`;
  }

  function pflaster(c) {
    // jede Woche eine Spalte, jeder Tag ein Pflasterstein; ohne Lernen bleibt eine Lücke mit Gras
    const W = 15, wd = c.wochentag, maxi = Math.max(1, ...c.tage);
    const farben = ["#e2d8bf", "#c9bc9c", "#ab9e7e", "#8a7e62", "#655b46"];
    const heute = new Date(c.datum + "T12:00:00");
    const r = zufall(5);
    let s = "", monat = -1;
    c.tage.forEach((n, d) => {
      const spalte = 52 - Math.floor((d + 6 - wd) / 7), zeile = (((wd - d) % 7) + 7) % 7;
      if (spalte < 0) return;
      const x = spalte * W, y = 18 + zeile * W;
      if (n) {
        const stufe = Math.min(4, Math.floor(Math.sqrt(n / maxi) * 5));
        s += `<rect x="${f(x + 1 + r() * 1.2)}" y="${f(y + 1 + r() * 1.2)}" width="${f(W - 3 + r())}" height="${f(W - 3 + r())}" rx="3.5" fill="${farben[stufe]}"` +
          `${d === 0 ? ' stroke="#c9a640" stroke-width="2"' : ""}><title>${datumText(new Date(heute - d * 864e5).toISOString().slice(0, 10))}: ${n} Wiederholungen</title></rect>`;
      } else {
        s += `<path d="M${f(x + 5)},${f(y + 11)} l-1.5,-4 M${f(x + 7.5)},${f(y + 11)} l0,-5 M${f(x + 10)},${f(y + 11)} l1.5,-4" stroke="#8fa069" stroke-width="1" fill="none"/>`;
      }
      if (zeile === 0) {
        const tag = new Date(heute - d * 864e5);
        if (tag.getDate() <= 7 && tag.getMonth() !== monat) {
          monat = tag.getMonth();
          s += `<text x="${x}" y="11" class="monat">${tag.toLocaleDateString("de-DE", { month: "short" })}</text>`;
        }
      }
    });
    return `<svg class="pflaster" viewBox="-30 0 ${53 * W + 34} ${18 + 7 * W + 4}">` +
      ["Mo", "", "Mi", "", "Fr", "", "So"].map((t, i) => `<text x="-26" y="${18 + i * W + 11}" class="monat">${t}</text>`).join("") +
      `<g class="zeichnung">${N(s)}</g></svg>`;
  }

  function zeigeChronik() {
    const c = D.chronik;
    const kachel = (wert, text) => `<div class="kachel"><b>${wert}</b><span>${text}</span></div>`;
    const kacheln = [
      kachel(c.serie, `Tage Serie (beste: ${c.beste_serie})`),
      kachel(zahl(c.lerntage), "Lerntage"),
      kachel(zahl(c.wiederholungen), "Wiederholungen"),
      kachel(c.heute, `heute, ${c.minuten_heute} min, ${c.neu_heute} neue Karten`),
      kachel(c.morgen, "morgen fällig"),
      kachel(c.quote == null ? "–" : c.quote + " %", "Trefferquote 30 Tage"),
      kachel(c.tageszeit ? ZEIT_TEXT[c.tageszeit] : "–", "meist gelernt"),
    ].join("");
    const steine = c.meilensteine.slice().reverse().map((m) =>
      `<div class="fund"><svg class="einpassen" width="90" height="80"><g class="zeichnung">${N(denkmal(MEILENSTEIN[m.art].bild))}</g></svg>
        <b>${MEILENSTEIN[m.art].text(m.wert)}</b><span>erreicht am ${datumText(m.datum)}</span></div>`).join("");
    const naechste = c.naechste.map((m) =>
      `<li>${MEILENSTEIN[m.art].text(m.wert)}: ${zahl(m.stand)} von ${zahl(m.wert)}</li>`).join("");
    const zeilen = D.gebiete.map((g) => {
      const x = g.chronik || {};
      return `<tr><td>${esc(g.name)}</td><td class="zahl">${zahl(x.lerntage || 0)}</td><td class="zahl">${x.serie || 0}</td>` +
        `<td class="zahl">${x.quote == null ? "–" : x.quote + " %"}</td><td class="zahl">${x.heute || 0}</td>` +
        `<td>${x.pause == null ? "noch nie" : x.pause === 0 ? "heute" : x.pause === 1 ? "gestern" : "vor " + x.pause + " Tagen"}</td></tr>`;
    }).join("");
    root.innerHTML = kopf("chronik") + `<div class="chronik">
      <div class="kacheln">${kacheln}</div>
      <h3>${T.pflasterTitel || "Lernweg"} – jeder Stein ein Lerntag</h3>${pflaster(c)}
      <p class="klein">Je dunkler der Stein, desto mehr Wiederholungen. Tage ohne Lernen bleiben als Lücke mit Gras.</p>
      <h3>Denkmäler</h3>${steine ? `<div class="album">${steine}</div>` : `<p class="klein">Noch keine Meilensteine.</p>`}
      ${naechste ? `<p>Als Nächstes:</p><ul>${naechste}</ul>` : ""}
      <h3>Gebiete</h3><table class="tabelle"><tr><th>Gebiet</th><th>Lerntage</th><th>Serie</th><th>Treffer</th><th>heute</th><th>zuletzt</th></tr>${zeilen}</table>
    </div>`;
    binden();
  }

  // --- Album ----------------------------------------------------------------

  function zeigeAlbum() {
    const karten = D.belohnungen.map((t) => {
      const da = D.album[t.id];
      const datum = da ? datumText(da) : "";
      return `<div class="fund ${da ? "" : "fehlt"} ${D.neu && D.neu.includes(t.id) ? "neu" : ""}">
        <svg class="einpassen" width="132" height="110"><g class="zeichnung">${N(T.belohnung(t.id))}</g></svg>
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
    root.classList.add("thema-" + D.thema);
    if (D.animationen === false) root.classList.add("lw-ruhig");
    if (T.defs && !document.getElementById("lernwald-defs")) {
      document.body.insertAdjacentHTML("afterbegin",
        `<svg id="lernwald-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${T.defs}</defs></svg>`);
    }
    if (root.classList.contains("lw-hintergrund")) zeigeHintergrund();
    else zeigeKarte();
  }

  window.lernwald = { zeigeKarte, zeigeGebiet, zeigeAlbum, zeigeChronik };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
