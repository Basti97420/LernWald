// Lernwald – Anki-Add-on
// Copyright (C) 2026 Basti97420
// Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
// Stil der Stadt für die Ansicht von oben (iso.js): Häuser bis Wolkenkratzer, Kutschen, Autos, Straßenbahn,
// Eisenbahn mit Bahnhof, Stadtmauer, Laternen, Bänke, Aquädukt, Felder und Bäume ringsum.
(function () {
  "use strict";
  const { f, wahl, zufall } = window.LW;
  const { P, pt, poly, ton, quader, satteldach, zeltdach, fenster, unkraut, vonHinten, FLACH, PLATZ } = window.LW.iso;
  const STADT = window.LW.themen.stadt, B = STADT.teile;
  const { WAND, DACH, WAND_W, DACH_W, GLAS, STEIN, GOLD } = B;

  // Hochhaus auf einer Parzelle: hoch = 1 Hochhaus, 2 hohes Hochhaus mit Absatz, 3 Wolkenkratzer aus Glas
  function hochhaus(ctx, hoch, i, j) {
    const { L, r, licht } = ctx;
    let s = "";
    if (hoch === 3) {
      const geschosse = 16 + Math.floor(r() * 7), h = geschosse * 6, glas = wahl(r, ["#7e9bb3", "#6a8aa6", "#8aa7b8"]);
      s += quader(L, i + 0.15, j + 0.15, i + 0.85, j + 0.85, h, glas);
      for (let k = 1; k < geschosse; k++) {  // Geschossbänder
        const z = k * 6;
        s += `<path d="M${pt(P(i + 0.15, j + 0.85, z))} L${pt(P(i + 0.85, j + 0.85, z))} L${pt(P(i + 0.85, j + 0.15, z))}" stroke="${L("#4d6478")}" stroke-width=".5" fill="none"/>`;
        if (licht && r() < 0.5) s += poly([P(i + 0.3, j + 0.85, z + 1.5), P(i + 0.7, j + 0.85, z + 1.5), P(i + 0.7, j + 0.85, z + 4), P(i + 0.3, j + 0.85, z + 4)], "#f6cf73");
      }
      s += quader(L, i + 0.35, j + 0.35, i + 0.65, j + 0.65, 5, "#9aa5ad", h);
      const top = P(i + 0.5, j + 0.5, h + 5);
      s += `<path d="M${pt(top)} l0,-14" stroke="${L("#4a4038")}" stroke-width="1"/>`;
      // das blinkende Licht als eigenes Teil, damit das Hochhaus selbst ruhig bleibt (ebenen.js)
      ctx.neu(i + j + 1.01, `<circle cx="${f(top[0])}" cy="${f(top[1] - 14)}" r="1.4" fill="#e0322b" class="lw-blinken"/>`);
      return s;
    }
    const fassade = wahl(r, ["#d9d2c4", "#c9b8a0", "#b8b0a6", "#e3dccf", "#c7a98a"]);
    if (hoch === 2) {  // breiter Sockel, darauf ein schlankerer Turm
      const unten = 4 * 6, oben = (7 + Math.floor(r() * 5)) * 6;
      return quader(L, i + 0.08, j + 0.08, i + 0.92, j + 0.92, unten, fassade) +
        fenster(L, i + 0.08, j + 0.08, i + 0.92, j + 0.92, 4, 6, licht, r) +
        quader(L, i + 0.22, j + 0.22, i + 0.78, j + 0.78, oben, fassade, unten) +
        fenster(L, i + 0.22, j + 0.22, i + 0.78, j + 0.78, oben / 6, 6, licht, r, unten) +
        quader(L, i + 0.4, j + 0.4, i + 0.6, j + 0.6, 4, "#8f8573", unten + oben);
    }
    const h = (6 + Math.floor(r() * 3)) * 6;  // Hochhaus, 6 bis 8 Geschosse, Flachdach
    return quader(L, i + 0.12, j + 0.12, i + 0.88, j + 0.88, h, fassade) +
      fenster(L, i + 0.12, j + 0.12, i + 0.88, j + 0.88, h / 6, 6, licht, r) +
      quader(L, i + 0.3, j + 0.3, i + 0.55, j + 0.5, 3, "#8f8573", h);
  }

  function haus(ctx, b, i, j) {
    const { L, r, licht } = ctx, [stufe, welk, hoch] = b;
    if (stufe === "alt" && hoch) return hochhaus(ctx, hoch, i, j) + (welk ? unkraut(i, j) : "");
    const wand = wahl(r, stufe === "krank" ? WAND_W : WAND), dach = wahl(r, stufe === "krank" ? DACH_W : DACH);
    const quer = r() < 0.5;
    let s = "";
    switch (stufe) {
      case "spross": {  // Bauplatz: Erde und Pflöcke
        s += poly([P(i + 0.15, j + 0.15), P(i + 0.85, j + 0.15), P(i + 0.85, j + 0.85), P(i + 0.15, j + 0.85)], L("#cdb88f"));
        for (const [a, c] of [[0.15, 0.15], [0.85, 0.15], [0.85, 0.85], [0.15, 0.85]]) {
          s += `<path d="M${pt(P(i + a, j + c))} l0,-5" stroke="${L("#6b4a2b")}" stroke-width="1.2"/>`;
        }
        break;
      }
      case "setzling": {  // Baustelle: Mauern halbhoch, Gerüst
        s += quader(L, i + 0.2, j + 0.2, i + 0.8, j + 0.8, 7, STEIN);
        for (const [a, c] of [[0.15, 0.85], [0.85, 0.85], [0.85, 0.15]]) {
          s += `<path d="M${pt(P(i + a, j + c))} l0,-17" stroke="${L("#8a6a45")}" stroke-width="1"/>`;
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

  // --- Fahrzeuge ---------------------------------------------------------------

  function kutsche(ctx, fb) {
    const { L, r } = ctx, farbe = wahl(r, ["#7a2e22", "#2f4f6b", "#3d5a3a", "#5a3b22"]);
    return vonHinten(fb, [
      [0.08, fb.teil(L, -0.05, -0.1, 0.22, 0.1, 4.5, "#7b5634", 1.5)],  // Pferd
      [-0.26, fb.teil(L, -0.45, -0.17, -0.08, 0.17, 7, farbe, 1.5) + fb.teil(L, -0.47, -0.19, -0.06, 0.19, 1.2, "#3d342b", 8.5)],
    ]);
  }

  function auto(ctx, fb) {
    const { L, r } = ctx, farbe = wahl(r, ["#c8322b", "#2f6fb3", "#e0b400", "#3e8e41", "#e8e2d4", "#2d2d2d"]);
    return fb.teil(L, -0.36, -0.16, 0.36, 0.16, 3.5, farbe, 1) + fb.teil(L, -0.2, -0.13, 0.14, 0.13, 2.6, GLAS, 4.5) +
      fb.teil(L, -0.21, -0.14, 0.15, 0.14, 0.7, farbe, 7.1);
  }

  function tram(ctx, fb) {
    const { L } = ctx;
    return fb.teil(L, -0.65, -0.2, 0.65, 0.2, 9, "#c8322b", 1) + fb.teil(L, -0.67, -0.22, 0.67, 0.22, 1.4, "#6b5f5a", 10) +
      `<path d="M${pt(fb.punkt(0, 0, 11.4))} L${pt(fb.punkt(0.15, 0, 17))}" stroke="#3d342b" stroke-width=".7"/>`;
  }

  function zug(ctx, wagen, fb) {  // Dampflok vorn, Personenwagen dahinter
    const { L, r } = ctx, teile = [];
    for (let k = 1; k <= wagen; k++) {
      const a = -k * 1.1;
      teile.push([a, fb.teil(L, a - 0.5, -0.22, a + 0.5, 0.22, 8, wahl(r, ["#2f5a46", "#7a2e22", "#2f4f6b"]), 1) +
        fb.teil(L, a - 0.52, -0.24, a + 0.52, 0.24, 1.2, "#3d342b", 9)]);
    }
    teile.push([0.1, fb.teil(L, -0.5, -0.22, -0.05, 0.22, 10, "#2d2d2d", 1) + fb.teil(L, -0.05, -0.17, 0.55, 0.17, 6, "#3a3a3a", 1) +
      fb.teil(L, 0.35, -0.07, 0.47, 0.07, 6, "#1e1e1e", 7)]);
    return vonHinten(fb, teile) + dampf(fb.punkt(0.41, 0, 14), r);
  }

  function dampf(kamin, r) {  // Dampfwolken steigen aus dem Schornstein
    let s = "";
    for (let i = 0; i < 4; i++) {
      s += `<circle cx="${f(kamin[0])}" cy="${f(kamin[1])}" r="2.2" fill="#f4f1ea" opacity=".9" class="lw-dampf" style="animation-delay:-${f(i * 0.4 + r() * 0.2)}s"/>`;
    }
    return s;
  }

  function bahnhof(ctx, i, j) {
    const { L, r, licht } = ctx;
    return quader(L, i, j, i + 3, j + 1.2, 12, "#e8d5b0") + satteldach(L, i - 0.1, j - 0.1, i + 3.1, j + 1.3, 12, 8, "#6b5f5a", "#e8d5b0", false) +
      fenster(L, i, j, i + 3, j + 1.2, 1, 12, licht, r);
  }

  // --- Ausbau, Umland ---------------------------------------------------------

  function ausbau(ctx) {  // Laternen an den Hauptstraßen (je 7 Lerntage), Bänke am Marktplatz (je 30)
    const { neu, tage, tint } = ctx;
    const laternen = Math.min(16, Math.floor(tage / 7));
    for (let k = 0; k < laternen; k++) {
      const d = PLATZ + 1.5 + Math.floor(k / 4) * 2.2;
      const [i, j] = [[d, -0.1], [-d, 1.1], [1.1, d], [-0.1, -d]][k % 4];
      neu(i + j, `<g transform="translate(${pt(P(i, j))}) scale(.75)">${tint(B.laterne())}</g>`);
    }
    const baenke = Math.min(6, Math.floor(tage / 30));
    for (let k = 0; k < baenke; k++) {
      const [i, j] = [[-2.3, 0.5], [3.3, 0.5], [0.5, -2.3], [0.5, 3.3], [-2.3, 2.5], [2.5, -2.3]][k];
      neu(i + j, `<g transform="translate(${pt(P(i, j))}) scale(.8)">${tint(B.bank())}</g>`);
    }
  }

  function fern(ctx) {  // ab 200 Lerntagen: Aquädukt quer über das Land links der Stadt
    const { L, neu, RB, RV } = ctx, i = -RB - 1;
    for (let j = -RV; j < RV; j += 1) {
      neu(i + j, quader(L, i, j, i + 0.5, j + 0.25, 16, "#d8cdb2") + quader(L, i - 0.05, j, i + 0.55, j + 1, 4, "#cbbf9f", 16));
    }
  }

  function umland(ctx) {  // Felder und Bäume rund um die Stadt
    const { L, r, neu, RV, RB, RW, RA, mauer, v, g, tint } = ctx, fr = zufall(17);
    for (let k = 0; k < 26; k++) {
      const i = Math.floor((fr() * 2 - 1) * (RV - 2)), j = Math.floor((fr() * 2 - 1) * (RV - 2));
      if (Math.max(Math.abs(i), Math.abs(j)) < RB + 1.5) continue;
      const w = 2 + Math.floor(fr() * 3), h = 1 + Math.floor(fr() * 3);
      const farbe = wahl(fr, ["#c9c06a", "#b5c26f", "#d4b26a", "#9fb35f"]);
      ctx.grund += poly([P(i, j), P(i + w, j), P(i + w, j + h), P(i, j + h)], L(farbe), ' opacity=".8"' + FLACH);
      for (let z = 0.5; z < h; z += 0.5) ctx.grund += `<path d="M${pt(P(i, j + z))} L${pt(P(i + w, j + z))}" stroke="${L(ton(farbe, 0.85))}" stroke-width=".6"/>`;
    }
    const baum = window.LW.themen.wald && window.LW.themen.wald.bild;
    if (!baum) return;
    for (let k = 0; k < 60; k++) {
      const i = (r() * 2 - 1) * RV, j = (r() * 2 - 1) * RV;
      if (Math.max(Math.abs(i), Math.abs(j)) < (mauer >= 5 ? RA : RW) + 1) continue;
      if (v.zuege && j < -RB + 1 && j > -RB - v.zuege - 0.5) continue;  // nicht auf die Gleise
      neu(i + j, `<g transform="translate(${pt(P(i, j))}) scale(.55)">${tint(baum(r() < 0.5 ? "baum" : "jung", g.zustand === "verwildert" ? 1 : 0, r))}</g>`);
    }
  }

  // Stadtmauer je Sicherheitsstufe (Wörter in thema-stadt.js)
  const MAUER = [
    { h: 6, d: 0.18, farbe: "#8a6a45" },                                          // Holzpalisade
    { h: 7, d: 0.35, farbe: "#c2b8a6" },                                          // niedrige Steinmauer
    { h: 11, d: 0.4, farbe: "#c2b8a6", zinnen: true, ecken: 20 },                 // Zinnen und Ecktürme
    { h: 16, d: 0.5, farbe: "#b9ae9a", zinnen: true, ecken: 27, tore: true, zwischen: true },
    { h: 18, d: 0.55, farbe: "#b0a48f", zinnen: true, ecken: 30, tore: true, zwischen: true },  // dazu Graben und Außenring
  ];

  const STIL = {
    boden: (zustand) => STADT.boden[zustand],
    wegFarbe: (v) => (v.fahrzeuge ? "#c3b79f" : "#d6cbaf"),
    platzFarbe: "#d9cfb8",
    schienen: true,
    haus,
    figur: (ctx) => ctx.hilfen.figur(ctx.r),
    langsam: kutsche,
    schnell: auto,
    gross: tram,
    zug,
    bahnhof,
    mauer: MAUER,
    graben: "#6f97b0",
    aussenRing: { h: 9, d: 0.4, farbe: "#c2b8a6", zinnen: true, ecken: 16 },
    belohnung: (t) => STADT.belohnung(t),
    belohnungSkala: 0.62,
    ausbau,
    fern,
    umland,
  };

  STADT.szene = (g, o) => window.LW.iso.szene(g, o, STIL);
})();
