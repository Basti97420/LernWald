// Lernwald – Anki-Add-on
// Copyright (C) 2026 Basti97420
// Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
// Die Stadt von oben (isometrisch): Jedes Gebiet ist eine Stadt, die vom Marktplatz aus in alle Richtungen
// wächst. Häuser stehen auf Parzellen zwischen einem Straßengitter, die größten in der Mitte. Mit der Zahl
// reifer Häuser kommen Einwohner und Verkehr dazu (Kutschen, Eisenbahn, Straßenbahn), mit den Lerntagen
// Laternen, Bänke, Stadtmauer und Aquädukt. Die Bewegung steht in bewegung.css.
// Gilt für die Themen Stadt und Tusche-Stadt (die Tusche-Stadt übernimmt die Stadt samt dieser Ansicht).
(function () {
  "use strict";
  const { f, wahl, zufall, RANG } = window.LW;
  const STADT = window.LW.themen.stadt, B = STADT.teile;
  const { WAND, DACH, WAND_W, DACH_W, GLAS, STEIN, GOLD, VERKEHR } = B;

  const KW = 36, KH = 18;  // eine Kachel auf dem Bildschirm: Breite und Höhe
  const P = (i, j, z) => [(i - j) * KW / 2, (i + j) * KH / 2 - (z || 0)];
  const pt = (p) => f(p[0]) + "," + f(p[1]);
  const poly = (punkte, fill, extra) => `<path d="M${punkte.map(pt).join(" L")} Z" fill="${fill}"${extra || ""}/>`;
  const istStrasse = (k) => ((k % 3) + 3) % 3 === 0;  // jede dritte Zeile und Spalte ist Straße
  const PLATZ = 2;  // Marktplatz: Kacheln -2 … 2 in beiden Richtungen
  const FLACH = ' stroke="none"';  // Boden ohne Umriss (die Tusche-Stadt zieht sonst um jede Kachel eine Linie)

  // Farbe abdunkeln (k < 1) oder aufhellen (k > 1); dazu das Licht der Tageszeit
  function ton(farbe, k) {
    let h = farbe.slice(1);
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h, 16);
    const kanal = (x) => Math.max(0, Math.min(255, Math.round(k < 1 ? x * k : x + (255 - x) * (k - 1))));
    return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((x) => kanal(x).toString(16).padStart(2, "0")).join("");
  }

  // --- Bausteine: Quader, Dächer, Fenster ------------------------------------
  // Sichtbar sind der Deckel, die +j-Seite (links unten) und die +i-Seite (rechts unten).

  function quader(L, i0, j0, i1, j1, h, farbe, z0) {
    const z = z0 || 0;
    return poly([P(i0, j1, z), P(i1, j1, z), P(i1, j1, z + h), P(i0, j1, z + h)], L(ton(farbe, 0.93))) +
      poly([P(i1, j0, z), P(i1, j1, z), P(i1, j1, z + h), P(i1, j0, z + h)], L(ton(farbe, 0.74))) +
      poly([P(i0, j0, z + h), P(i1, j0, z + h), P(i1, j1, z + h), P(i0, j1, z + h)], L(ton(farbe, 1.08)));
  }

  // Satteldach auf [i0,i1]×[j0,j1] in Höhe z; quer: First entlang j statt entlang i
  function satteldach(L, i0, j0, i1, j1, z, rh, dach, wand, quer) {
    if (!quer) {
      const jm = (j0 + j1) / 2;
      return poly([P(i0, j0, z), P(i1, j0, z), P(i1, jm, z + rh), P(i0, jm, z + rh)], L(ton(dach, 0.78))) +
        poly([P(i0, j1, z), P(i1, j1, z), P(i1, jm, z + rh), P(i0, jm, z + rh)], L(dach)) +
        poly([P(i1, j0, z), P(i1, j1, z), P(i1, jm, z + rh)], L(ton(wand, 0.74)));
    }
    const im = (i0 + i1) / 2;
    return poly([P(i0, j0, z), P(i0, j1, z), P(im, j1, z + rh), P(im, j0, z + rh)], L(ton(dach, 0.85))) +
      poly([P(i1, j0, z), P(i1, j1, z), P(im, j1, z + rh), P(im, j0, z + rh)], L(ton(dach, 0.7))) +
      poly([P(i0, j1, z), P(i1, j1, z), P(im, j1, z + rh)], L(ton(wand, 0.93)));
  }

  function zeltdach(L, i0, j0, i1, j1, z, rh, dach) {  // spitzes Turmdach
    const s = P((i0 + i1) / 2, (j0 + j1) / 2, z + rh);
    return poly([P(i0, j1, z), P(i1, j1, z), s], L(dach)) + poly([P(i1, j0, z), P(i1, j1, z), s], L(ton(dach, 0.72)));
  }

  // Fensterreihen auf beiden sichtbaren Seiten; nachts leuchtet ein Teil warm
  function fenster(L, i0, j0, i1, j1, geschosse, hoehe, licht, r, z0) {
    let s = "";
    for (let k = 0; k < geschosse; k++) {
      const z = (z0 || 0) + hoehe * k + hoehe * 0.35, wh = hoehe * 0.38;
      for (const t of [0.3, 0.7]) {
        const an = licht && r() < 0.55, glas = an ? "#f6cf73" : L(GLAS), kl = "";
        const a = i0 + (i1 - i0) * t - 0.07, b = j0 + (j1 - j0) * t - 0.07;
        s += poly([P(a, j1, z), P(a + 0.14, j1, z), P(a + 0.14, j1, z + wh), P(a, j1, z + wh)], glas, kl);
        s += poly([P(i1, b, z), P(i1, b + 0.14, z), P(i1, b + 0.14, z + wh), P(i1, b, z + wh)], glas, kl);
      }
    }
    return s;
  }

  function unkraut(i, j) {
    let s = "";
    for (const [a, b] of [[0.15, 0.85], [0.85, 0.2], [0.5, 0.92], [0.9, 0.6]]) {
      const p = P(i + a, j + b);
      s += `<path d="M${pt(p)} l-1.5,-3 M${pt(p)} l0,-4 M${pt(p)} l1.5,-3" stroke="#7d8a4a" stroke-width=".8" fill="none"/>`;
    }
    return s;
  }

  // --- Häuser je Stufe auf einer Parzelle (i, j) ----------------------------

  function haus(L, stufe, welk, i, j, r, licht) {
    const wand = wahl(r, stufe === "krank" ? WAND_W : WAND), dach = wahl(r, stufe === "krank" ? DACH_W : DACH);
    const quer = r() < 0.5;
    let s = "";
    switch (stufe) {
      case "spross": {  // Bauplatz: Erde und Pflöcke
        s += poly([P(i + 0.15, j + 0.15), P(i + 0.85, j + 0.15), P(i + 0.85, j + 0.85), P(i + 0.15, j + 0.85)], L("#cdb88f"));
        for (const [a, b] of [[0.15, 0.15], [0.85, 0.15], [0.85, 0.85], [0.15, 0.85]]) {
          const p = P(i + a, j + b);
          s += `<path d="M${pt(p)} l0,-5" stroke="${L("#6b4a2b")}" stroke-width="1.2"/>`;
        }
        break;
      }
      case "setzling": {  // Baustelle: Mauern halbhoch, Gerüst
        s += quader(L, i + 0.2, j + 0.2, i + 0.8, j + 0.8, 7, STEIN);
        for (const [a, b] of [[0.15, 0.85], [0.85, 0.85], [0.85, 0.15]]) {
          const p = P(i + a, j + b);
          s += `<path d="M${pt(p)} l0,-17" stroke="${L("#8a6a45")}" stroke-width="1"/>`;
        }
        s += `<path d="M${pt(P(i + 0.15, j + 0.85, 13))} L${pt(P(i + 0.85, j + 0.85, 13))} L${pt(P(i + 0.85, j + 0.15, 13))}" stroke="${L("#8a6a45")}" stroke-width="1" fill="none"/>`;
        break;
      }
      case "jung":  // Hütte
        s += quader(L, i + 0.28, j + 0.28, i + 0.72, j + 0.72, 7, wand) +
          satteldach(L, i + 0.24, j + 0.24, i + 0.76, j + 0.76, 7, 6, dach, wand, quer) +
          fenster(L, i + 0.28, j + 0.28, i + 0.72, j + 0.72, 1, 7, licht, r);
        break;
      case "baum": {  // Haus mit zwei Geschossen
        const h = 15 + r() * 4;
        s += quader(L, i + 0.15, j + 0.15, i + 0.85, j + 0.85, h, wand) +
          fenster(L, i + 0.15, j + 0.15, i + 0.85, j + 0.85, 2, h / 2, licht, r) +
          satteldach(L, i + 0.1, j + 0.1, i + 0.9, j + 0.9, h, 9, dach, wand, quer);
        break;
      }
      case "alt": {  // Stadthaus oder Turm
        if (r() < 0.3) {
          const h = 38 + r() * 14;
          s += quader(L, i + 0.3, j + 0.3, i + 0.7, j + 0.7, h, wahl(r, ["#e8e2d4", "#d8cdb2", STEIN])) +
            fenster(L, i + 0.3, j + 0.3, i + 0.7, j + 0.7, 4, h / 4, licht, r) +
            zeltdach(L, i + 0.27, j + 0.27, i + 0.73, j + 0.73, h, 16, wahl(r, ["#4f5d6b", "#5d7f9a", "#6b5f5a"]));
          const spitze = P(i + 0.5, j + 0.5, h + 16);
          s += `<circle cx="${f(spitze[0])}" cy="${f(spitze[1] - 1.5)}" r="1.3" fill="${GOLD}"/>`;
        } else {
          const geschosse = 3 + Math.floor(r() * 2), h = geschosse * 8.5;
          s += quader(L, i + 0.1, j + 0.1, i + 0.9, j + 0.9, h, wand) +
            fenster(L, i + 0.1, j + 0.1, i + 0.9, j + 0.9, geschosse, h / geschosse, licht, r) +
            satteldach(L, i + 0.06, j + 0.06, i + 0.94, j + 0.94, h, 11, dach, wand, quer);
        }
        break;
      }
      case "krank": {  // baufällig: grau, Loch im Dach
        const h = 13;
        s += quader(L, i + 0.18, j + 0.18, i + 0.82, j + 0.82, h, wand) +
          satteldach(L, i + 0.14, j + 0.14, i + 0.86, j + 0.86, h, 8, dach, wand, false) +
          poly([P(i + 0.4, j + 0.62, h + 3), P(i + 0.62, j + 0.62, h + 3), P(i + 0.6, j + 0.75, h + 1), P(i + 0.42, j + 0.75, h + 1)], "#3d342b");
        break;
      }
      case "stumpf":  // Ruine: Mauerreste ohne Dach
        s += quader(L, i + 0.2, j + 0.7, i + 0.8, j + 0.8, 9, STEIN) + quader(L, i + 0.7, j + 0.2, i + 0.8, j + 0.7, 5, STEIN) +
          quader(L, i + 0.2, j + 0.2, i + 0.3, j + 0.7, 7, STEIN);
        break;
      default:
        break;
    }
    return s + (welk ? unkraut(i, j) : "");
  }

  // --- Stadtplan: Parzellen vom Marktplatz aus nach außen ---------------------

  function stadtplan(n, rnd) {
    const lots = [];
    const R = Math.ceil(Math.sqrt((n + 40) * 9 / 4) / 2) + 3;
    for (let i = -R; i <= R; i++) {
      for (let j = -R; j <= R; j++) {
        if (istStrasse(i) || istStrasse(j)) continue;
        if (Math.abs(i) <= PLATZ && Math.abs(j) <= PLATZ) continue;
        lots.push({ i, j, d: Math.hypot(i + 0.5, j + 0.5) + rnd() * 1.4 });
      }
    }
    return lots.sort((a, b) => a.d - b.d).slice(0, n);
  }

  // --- Fahrzeuge -------------------------------------------------------------
  // Gezeichnet in Fahrtrichtung u (längs) und v (quer); achse "i" oder "j", vor = +1 oder -1 (rückwärts).
  // Teile werden von hinten nach vorn gezeichnet (kleinere i + j zuerst).

  function fahrbahn(achse, vor) {
    const ij = (u, v) => (achse === "i" ? [u * vor, v] : [v, u * vor]);
    return {
      teil(L, u0, v0, u1, v1, h, farbe, z0) {
        const a = ij(u0, v0), b = ij(u1, v1);
        return quader(L, Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), h, farbe, z0);
      },
      punkt: (u, v, z) => P(...ij(u, v), z),
      tiefe: (u) => u * vor,  // größer = weiter vorn
    };
  }
  const vonHinten = (fb, teile) => teile.sort((a, b) => fb.tiefe(a[0]) - fb.tiefe(b[0])).map((t) => t[1]).join("");

  function kutsche(L, r, fb) {
    const farbe = wahl(r, ["#7a2e22", "#2f4f6b", "#3d5a3a", "#5a3b22"]);
    return vonHinten(fb, [
      [0.08, fb.teil(L, -0.05, -0.1, 0.22, 0.1, 4.5, "#7b5634", 1.5)],  // Pferd
      [-0.26, fb.teil(L, -0.45, -0.17, -0.08, 0.17, 7, farbe, 1.5) + fb.teil(L, -0.47, -0.19, -0.06, 0.19, 1.2, "#3d342b", 8.5)],
    ]);
  }

  function tram(L, fb) {
    return fb.teil(L, -0.65, -0.2, 0.65, 0.2, 9, "#c8322b", 1) + fb.teil(L, -0.67, -0.22, 0.67, 0.22, 1.4, "#6b5f5a", 10) +
      `<path d="M${pt(fb.punkt(0, 0, 11.4))} L${pt(fb.punkt(0.15, 0, 17))}" stroke="#3d342b" stroke-width=".7"/>`;
  }

  function zug(L, wagen, r, fb) {  // Lok vorn, Wagen dahinter
    const teile = [];
    for (let k = 1; k <= wagen; k++) {
      const a = -k * 1.1;
      teile.push([a, fb.teil(L, a - 0.5, -0.22, a + 0.5, 0.22, 8, wahl(r, ["#2f5a46", "#7a2e22", "#2f4f6b"]), 1) +
        fb.teil(L, a - 0.52, -0.24, a + 0.52, 0.24, 1.2, "#3d342b", 9)]);
    }
    teile.push([0.1, fb.teil(L, -0.5, -0.22, -0.05, 0.22, 10, "#2d2d2d", 1) + fb.teil(L, -0.05, -0.17, 0.55, 0.17, 6, "#3a3a3a", 1) +
      fb.teil(L, 0.35, -0.07, 0.47, 0.07, 6, "#1e1e1e", 7)]);
    let s = vonHinten(fb, teile);
    const kamin = fb.punkt(0.41, 0, 14);
    for (let i = 0; i < 4; i++) {
      s += `<circle cx="${f(kamin[0])}" cy="${f(kamin[1])}" r="2.2" fill="#f4f1ea" opacity=".9" class="lw-dampf" style="animation-delay:-${f(i * 0.4 + r() * 0.2)}s"/>`;
    }
    return s;
  }

  // Bewegung entlang einer Achse: dx, dy für eine Strecke von n Kacheln in +i (achse "i") bzw. +j
  const versatz = (achse, n) => (achse === "i" ? [n * KW / 2, n * KH / 2] : [-n * KW / 2, n * KH / 2]);

  // --- Die Szene ----------------------------------------------------------

  function szene(g, o) {
    const { rnd, zeit, wetter, c, wachsen, hilfen } = o;
    const { dauer, figur, voegel } = hilfen;
    const nacht = zeit === "nacht", abend = zeit === "abend";
    const L = nacht ? (x) => ton(x, 0.55) : abend ? (x) => ton(x, 0.88) : (x) => x;
    const reif = g.zahlen.baum + g.zahlen.alt, tage = c.lerntage || 0;
    const geo = { zustand: g.zustand, reif };
    const n = g.baeume.length;
    const lots = stadtplan(n, rnd);
    // große Häuser in die Mitte
    const ordnung = g.baeume.map((b, k) => ({ b, rang: RANG[b[0]] + rnd() * 0.9, k })).sort((a, b) => a.rang - b.rang);
    const rMax = lots.length ? Math.max(...lots.map((l) => Math.hypot(l.i + 0.5, l.j + 0.5))) : PLATZ + 1;
    const RS = Math.ceil(rMax) + 1;          // so weit reichen die Straßen
    const RW = RS + 1;                       // Stadtmauer
    const RV = RW + 7;                       // sichtbares Land
    const boden = STADT.boden[g.zustand];
    let grund = "";
    const dinge = [];  // { t: Tiefe, s: svg } – hinten zuerst
    const neu = (t, s) => dinge.push({ t, s });

    // Land, Felder, Straßen, Marktplatz
    grund += poly([P(-RV, -RV), P(RV, -RV), P(RV, RV), P(-RV, RV)], L(boden[0]), FLACH);
    const fr = zufall(17);
    for (let k = 0; k < 26; k++) {  // Felder draußen
      const i = Math.floor((fr() * 2 - 1) * (RV - 2)), j = Math.floor((fr() * 2 - 1) * (RV - 2));
      if (Math.hypot(i, j) < RW + 2) continue;
      const w = 2 + Math.floor(fr() * 3), h = 1 + Math.floor(fr() * 3);
      const farbe = wahl(fr, ["#c9c06a", "#b5c26f", "#d4b26a", "#9fb35f"]);
      grund += poly([P(i, j), P(i + w, j), P(i + w, j + h), P(i, j + h)], L(farbe), ' opacity=".8"' + FLACH);
      for (let z = 0.5; z < h; z += 0.5) grund += `<path d="M${pt(P(i, j + z))} L${pt(P(i + w, j + z))}" stroke="${L(ton(farbe, 0.85))}" stroke-width=".6"/>`;
    }
    for (let i = -RS; i < RS; i++) {
      for (let j = -RS; j < RS; j++) {
        const platz = Math.abs(i + 0.5) <= PLATZ + 0.5 && Math.abs(j + 0.5) <= PLATZ + 0.5;
        if (platz) grund += poly([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], L("#d9cfb8"), FLACH);
        else if ((istStrasse(i) || istStrasse(j)) && Math.hypot(i + 0.5, j + 0.5) <= RS) {
          grund += poly([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], L(reif >= VERKEHR[0][0] ? "#c3b79f" : "#d6cbaf"), FLACH);
        }
      }
    }
    if (reif >= VERKEHR[2][0]) {  // Straßenbahngleise auf den Hauptstraßen
      grund += `<path d="M${pt(P(-RS, 0.4))} L${pt(P(RS, 0.4))} M${pt(P(-RS, 0.6))} L${pt(P(RS, 0.6))}` +
        ` M${pt(P(0.4, -RS))} L${pt(P(0.4, RS))} M${pt(P(0.6, -RS))} L${pt(P(0.6, RS))}" stroke="${L("#6f665a")}" stroke-width=".7"/>`;
    }

    // Häuser
    ordnung.forEach((o2, k) => {
      const l = lots[k];
      if (!l) return;
      let s = haus(L, o2.b[0], o2.b[1], l.i, l.j, rnd, nacht || abend);
      if (wachsen) s = `<g class="lw-wachsen" style="animation-delay:${f(0.1 + 1.6 * k / Math.max(1, n))}s">${s}</g>`;
      neu(l.i + l.j + 1, s);
    });

    // Bäume rund um die Stadt
    const baum = window.LW.themen.wald && window.LW.themen.wald.bild;
    if (baum) {
      for (let k = 0; k < 60; k++) {
        const i = (rnd() * 2 - 1) * RV, j = (rnd() * 2 - 1) * RV;
        if (Math.hypot(i, j) < RW + 1.5) continue;
        const p = P(i, j);
        neu(i + j, `<g transform="translate(${pt(p)}) scale(.55)">${baum(rnd() < 0.5 ? "baum" : "jung", g.zustand === "verwildert" ? 1 : 0, rnd)}</g>`);
      }
    }

    // Sehenswürdigkeiten auf dem Marktplatz
    const stellen = [[0.5, 0.5], [-1.2, -1.2], [2, -1.2], [-1.2, 2], [2, 2], [0.5, -1.6], [-1.6, 0.5], [2.4, 0.5], [0.5, 2.4],
      [-1.8, -0.4], [1.3, -1.8], [-0.4, 1.3]];
    (g.belohnungen || []).forEach((t, k) => {
      const [i, j] = stellen[k % stellen.length], p = P(i, j);
      neu(i + j, `<g transform="translate(${pt(p)}) scale(.62)">${STADT.belohnung(t)}</g>`);
    });

    // Ausbau nach Lerntagen: Laternen an den Hauptstraßen, Bänke am Platz, Mauer, Aquädukt
    const laternen = Math.min(16, Math.floor(tage / 7));
    for (let k = 0; k < laternen; k++) {
      const seite = k % 4, d = PLATZ + 1.5 + Math.floor(k / 4) * 2.2;
      const [i, j] = [[d, -0.1], [-d, 1.1], [1.1, d], [-0.1, -d]][seite];
      neu(i + j, `<g transform="translate(${pt(P(i, j))}) scale(.75)">${B.laterne()}</g>`);
    }
    const baenke = Math.min(6, Math.floor(tage / 30));
    for (let k = 0; k < baenke; k++) {
      const [i, j] = [[-2.3, 0.5], [3.3, 0.5], [0.5, -2.3], [0.5, 3.3], [-2.3, 2.5], [2.5, -2.3]][k];
      neu(i + j, `<g transform="translate(${pt(P(i, j))}) scale(.8)">${B.bank()}</g>`);
    }
    if (tage >= 100) {  // Stadtmauer im Quadrat, Tore an den Hauptstraßen, Türme an den Ecken
      for (let k = -RW; k < RW; k++) {
        if (k === 0) continue;  // Tore an den Hauptstraßen
        for (const j of [-RW, RW - 0.4]) neu(k + j + 1, quader(L, k, j, k + 1, j + 0.4, 10, "#c2b8a6"));  // entlang i
        for (const i of [-RW, RW - 0.4]) neu(i + k + 1, quader(L, i, k, i + 0.4, k + 1, 10, "#c2b8a6"));  // entlang j
      }
      for (const [i, j] of [[-RW, -RW], [RW - 0.7, -RW], [-RW, RW - 0.7], [RW - 0.7, RW - 0.7]]) {
        neu(i + j + 1.5, quader(L, i - 0.1, j - 0.1, i + 0.8, j + 0.8, 18, "#b9ae9a") + zeltdach(L, i - 0.15, j - 0.15, i + 0.85, j + 0.85, 18, 9, "#6b5f5a"));
      }
    }
    if (tage >= 200) {  // Aquädukt quer über das Land hinter der Stadt
      const j = -RW - 3;
      for (let i = -RV; i < RV; i += 1) {
        neu(i + j, quader(L, i, j, i + 0.25, j + 0.5, 16, "#d8cdb2") + quader(L, i, j - 0.05, i + 1, j + 0.55, 4, "#cbbf9f", 16));
      }
    }

    // Eisenbahn hinter der Stadt (ab Kleinstadt), Bahnhof ab Stadt, zweiter Zug ab Großstadt
    if (reif >= VERKEHR[1][0] && g.zustand !== "wiese") {
      const gleise = reif >= VERKEHR[3][0] ? [-RW - 5.5, -RW - 4.5] : [-RW - 5];
      gleise.forEach((j, z) => {
        grund += poly([P(-RV, j - 0.18), P(RV, j - 0.18), P(RV, j + 0.18), P(-RV, j + 0.18)], L("#8f8573"), FLACH);
        grund += `<path d="M${pt(P(-RV, j - 0.08))} L${pt(P(RV, j - 0.08))} M${pt(P(-RV, j + 0.08))} L${pt(P(RV, j + 0.08))}" stroke="${L("#5f574c")}" stroke-width=".6"/>`;
        const wagen = reif >= VERKEHR[2][0] ? 5 : 3, weg = 2 * RV + wagen * 1.1 + 2;
        const [dx, dy] = versatz("i", weg), zurueck = z === 1, vor = zurueck ? -1 : 1;
        const start = zurueck ? P(RV + 1, j) : P(-RV - 1, j);
        neu(-2 * RV + z, `<g transform="translate(${pt(start)})"><g class="lw-zug2" style="--dx:${f(dx * vor)}px;--dy:${f(dy * vor)}px;${dauer(30 + rnd() * 10, rnd)}">` +
          `${zug(L, wagen, rnd, fahrbahn("i", vor))}</g></g>`);
      });
      if (reif >= VERKEHR[2][0]) {
        const j = gleise[gleise.length - 1] + 0.5, i = -2;
        neu(i + j + 2, quader(L, i, j, i + 3, j + 1.2, 12, "#e8d5b0") + satteldach(L, i - 0.1, j - 0.1, i + 3.1, j + 1.3, 12, 8, "#6b5f5a", "#e8d5b0", false) +
          fenster(L, i, j, i + 3, j + 1.2, 1, 12, nacht || abend, rnd));
      }
    }

    // Einwohner: gehen auf den Straßen hin und her, je größer die Stadt, desto mehr
    const strassen = [];
    for (let i = -RS; i < RS; i++) {
      for (let j = -RS; j < RS; j++) {
        if ((istStrasse(i) || istStrasse(j)) && Math.hypot(i + 0.5, j + 0.5) <= RS - 0.5) strassen.push([i, j]);
      }
    }
    const leute = g.zustand === "wiese" ? 0 : B.einwohner(geo) + Math.min(30, c.heute || 0);
    for (let k = 0; k < leute && strassen.length; k++) {
      const [i0, j0] = wahl(rnd, strassen), achse = istStrasse(j0) ? "i" : "j";
      const i = i0 + 0.25 + rnd() * 0.5, j = j0 + 0.25 + rnd() * 0.5, [dx, dy] = versatz(achse, 1 + rnd() * 1.5);
      neu(i + j + 0.6, `<g transform="translate(${pt(P(i, j))}) scale(.8)"><g class="lw-pendeln" style="--dx:${f(dx / 0.8)}px;--dy:${f(dy / 0.8)}px;${dauer(12 + rnd() * 12, rnd)}">` +
        `<g class="lw-wippen" style="${dauer(0.5 + rnd() * 0.2, rnd)}">${figur(rnd)}</g></g></g>`);
    }

    // Verkehr auf den Hauptstraßen: Kutschen ab Dorf, Straßenbahn ab Stadt. Jedes Fahrzeug fährt einen
    // Abschnitt von zwei Blöcken, damit es richtig zwischen den Häusern einsortiert ist.
    if (reif >= VERKEHR[0][0] && g.zustand !== "wiese") {
      const abschnitte = [];
      for (let a = -RS; a + 6 <= RS; a += 3) {
        if (Math.abs(a + 3) <= PLATZ + 1) continue;  // nicht quer über den Marktplatz
        abschnitte.push(["i", a, 0], ["j", a, 0], ["i", a, 3], ["j", a, -3]);
      }
      const kutschen = reif >= VERKEHR[3][0] ? 12 : reif >= VERKEHR[2][0] ? 8 : reif >= VERKEHR[1][0] ? 5 : 3;
      // fährt von a nach a + 6 (vor = 1) oder zurück; in der Gegenrichtung auf der anderen Straßenseite
      const fahrzeug = (achse, a, b, zeichnen, sek) => {
        const vor = rnd() < 0.5 ? 1 : -1, quer = b + (vor === 1 ? 0.62 : 0.38);
        const u = vor === 1 ? a : a + 6;
        const [i, j] = achse === "i" ? [u, quer] : [quer, u];
        const [dx, dy] = versatz(achse, 6 * vor);
        neu(achse === "i" ? a + 3 + quer : quer + a + 3, `<g transform="translate(${pt(P(i, j))})"><g class="lw-fahrt" style="--dx:${f(dx)}px;--dy:${f(dy)}px;${dauer(sek, rnd)}">` +
          `${zeichnen(fahrbahn(achse, vor))}</g></g>`);
      };
      for (let k = 0; k < kutschen && abschnitte.length; k++) {
        const [achse, a, b] = wahl(rnd, abschnitte);
        fahrzeug(achse, a, b, (fb) => kutsche(L, rnd, fb), 9 + rnd() * 6);
      }
      if (reif >= VERKEHR[2][0]) {
        for (let k = 0; k < (reif >= VERKEHR[3][0] ? 4 : 2); k++) {
          const [achse, a] = wahl(rnd, abschnitte.filter((x) => x[2] === 0));
          fahrzeug(achse, a, 0, (fb) => tram(L, fb), 12 + rnd() * 4);
        }
      }
    }

    // Wimpel über dem Marktplatz ab 7 Tagen Serie
    if ((c.serie || 0) >= 7) {
      const a = P(-PLATZ, PLATZ + 1, 0), b = P(PLATZ + 1, -PLATZ, 0), hoch = 22, farben = ["#c8322b", "#f2d640", "#2f6fb3", "#3e8e41"];
      let s = `<path d="M${f(a[0])},${f(a[1])} l0,-${hoch} M${f(b[0])},${f(b[1])} l0,-${hoch}" stroke="${L("#6b4a2b")}" stroke-width="1.6"/>`;
      const punkte = [];
      for (let k = 0; k <= 24; k++) {
        const t = k / 24;
        punkte.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - hoch + Math.sin(Math.PI * t) * 14]);
      }
      s += `<path d="M${punkte.map((p) => p.map(f).join(",")).join(" L")}" stroke="#5a4a3a" stroke-width=".7" fill="none"/>`;
      punkte.slice(1, -1).forEach((p, k) => {
        s += `<path d="M${f(p[0] - 4)},${f(p[1])} L${f(p[0] + 4)},${f(p[1])} L${f(p[0])},${f(p[1] + 8)} Z" fill="${farben[k % 4]}" class="lw-wimpel" style="${dauer(1.6 + rnd(), rnd)}"/>`;
      });
      neu(PLATZ + 2, s);
    }

    // Himmel über der Stadt: Wolken (mit Schatten), Regen, Vögel
    const oben = P(-RV, -RV)[1], links = P(-RV, RV)[0], breite = 2 * RV * KW;
    let himmel = "";
    const wolkenZahl = wetter === "regen" ? 7 : wetter === "wolken" || g.zustand === "verwildert" ? 4 : 2;
    for (let k = 0; k < wolkenZahl; k++) {
      // am Rand, nicht über der Stadtmitte
      const seite = k % 2 ? 1 : -1, x = seite * (RS * KW * 0.55 + rnd() * RV * KW * 0.4), y = oben + RV * KH * (0.25 + rnd() * 1.1);
      const sc = 1 + rnd() * 1.2;
      const farbe = wetter === "regen" ? "#a9adb0" : "#f7f7f2";
      himmel += `<g class="lw-wolke" style="--weg:${f(60 + rnd() * 80)}px;${dauer(40 + rnd() * 30, rnd)}">` +
        `<ellipse cx="${f(x + 30)}" cy="${f(y + 70)}" rx="${f(40 * sc)}" ry="${f(13 * sc)}" fill="rgba(0,0,0,.08)"/>` +
        `<g transform="translate(${f(x)},${f(y)}) scale(${f(sc)})" opacity=".8"><ellipse rx="34" ry="12" fill="${farbe}"/>` +
        `<circle cx="-14" cy="-6" r="13" fill="${farbe}"/><circle cx="6" cy="-12" r="17" fill="${farbe}"/><circle cx="22" cy="-4" r="11" fill="${farbe}"/></g></g>`;
    }
    if (wetter === "regen") {
      let d = "";
      for (let k = 0; k < 500; k++) d += `M${f(links + rnd() * breite)},${f(oben + rnd() * RV * KH * 2)} l-3,10 `;
      himmel += `<path d="${d}" stroke="#7d93a8" stroke-width="1" opacity=".45" fill="none" class="lw-regen"/>`;
    }
    if (wetter !== "regen" && !nacht) himmel += voegel(links - 60, oben + RV * KH * 0.3, breite + 120, RV * KH, g.zustand === "gesund" ? 8 : 3, rnd);

    dinge.sort((a, b) => a.t - b.t);
    // Ausschnitt: die Stadt; herauszoomen (Mausrad) zeigt Mauer, Bahn und Land drumherum
    const R0 = RS + 1;
    const x0 = P(-R0, R0)[0], x1 = P(R0, -R0)[0], y0 = P(-R0, -R0)[1] - 50, y1 = P(R0, R0)[1];
    return {
      svg: grund + dinge.map((d) => d.s).join("") + himmel,
      viewBox: [x0, y0, x1 - x0, y1 - y0].map(f).join(" "),
      grund: L(boden[0]),
    };
  }

  STADT.szene = szene;
})();
