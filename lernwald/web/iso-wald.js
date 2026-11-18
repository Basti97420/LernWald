// Lernwald – Anki-Add-on
// Copyright (C) 2026 Basti97420
// Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
// Stil des Waldes für die Ansicht von oben (iso.js): dieselben Regeln wie die Stadt, nur als Wald. Bäume bis
// Urwaldriese, Wanderer und Tiere auf den Waldwegen, Reiter, Radfahrer, Holzfuhrwerke, Waldbahn mit Försterei,
// Waldrand von Weidenzaun bis doppelter Hecke mit Bach, Blumen, Bänke, Waldsee, Glühwürmchen in der Nacht.
(function () {
  "use strict";
  const { f, wahl, zufall } = window.LW;
  const { P, pt, poly, quader, satteldach, zeltdach, fenster, vonHinten, FLACH, PLATZ } = window.LW.iso;
  const WALD = window.LW.themen.wald, B = WALD.teile;

  const sprite = (x, y, skala, svg, extra) => `<g transform="translate(${pt(P(x, y))}) scale(${f(skala)})"${extra || ""}>${svg}</g>`;

  // --- Riesenbäume: hoch = 1 Riesenbaum, 2 Mammutbaum, 3 Urwaldriese ---------------------

  function riesenbaum(hoch, welk, r) {
    if (hoch === 1) return WALD.bild("alt", welk, r);  // ein besonders großer alter Baum (größer gezeichnet)
    if (hoch === 2) {  // Mammutbaum: rotbrauner, sehr hoher Stamm, schmale Nadelkrone
      return B.nadelbaum(r, 150, 44, welk ? B.WELK : B.NADEL, "#8a4a2b") +
        `<path d="M-6,0 L-4,-40 L4,-40 L6,0 Z" fill="#8a4a2b"/><path d="M-1,-8 L-1,-34 M2,-4 L2,-30" stroke="rgba(0,0,0,.25)" stroke-width="1"/>`;
    }
    // Urwaldriese: Brettwurzeln, langer Stamm, weit ausladende Krone in mehreren Stockwerken
    const laub = welk ? B.WELK : B.LAUB;
    return `<ellipse cx="0" cy="0" rx="40" ry="9" fill="rgba(0,0,0,.18)"/>` +
      `<path d="M-22,0 Q-12,-4 -9,-14 L-7,-120 L7,-120 L9,-14 Q12,-4 22,0 Z" fill="#6b4a2b"/>` +
      `<path d="M-3,-30 L-3,-100 M3,-20 L4,-90" stroke="rgba(0,0,0,.25)" stroke-width="1.4"/>` +
      `<path d="M-6,-80 L-30,-100 M6,-95 L32,-112" stroke="#6b4a2b" stroke-width="4" stroke-linecap="round"/>` +
      B.krone(r, -32, -104, 20, laub, 1.3) + B.krone(r, 34, -116, 22, laub, 1.3) + B.krone(r, 0, -140, 34, laub, 1.4) +
      `<path d="M-5,-160 Q0,-166 5,-160 Z" fill="#5a3b22"/>`;  // Nest ganz oben
  }

  function haus(ctx, b, i, j) {  // ein Baum auf seiner Parzelle, leicht versetzt, damit es nach Wald aussieht
    const { r, tint } = ctx, [stufe, welk, hoch] = b;
    const x = i + 0.5 + (r() - 0.5) * 0.35, y = j + 0.5 + (r() - 0.5) * 0.35;
    const svg = stufe === "alt" && hoch ? riesenbaum(hoch, welk, r) : WALD.bild(stufe, welk, r);
    const skala = stufe === "alt" && hoch ? [0, 0.8, 0.72, 0.78][hoch] : 0.55;
    // jeder dritte Baum wiegt sich im Wind
    const wiegen = r() < 0.33 ? ` class="lw-wiegen" style="animation-duration:${f(4 + r() * 3)}s;animation-delay:-${f(r() * 5)}s"` : "";
    return sprite(x, y, skala, `<g${wiegen}>${tint(svg)}</g>`);
  }

  // Auf den Wegen: Wanderer, dazwischen Hasen, Rehe, Igel, Füchse und Eichhörnchen
  function figur(ctx) {
    const { r, hilfen } = ctx;
    if (r() < 0.65) return hilfen.figur(r);
    return `<g transform="scale(.33)">${WALD.belohnung(wahl(r, ["hase", "reh", "igel", "fuchs", "eichhoernchen"]))}</g>`;
  }

  // --- Fahrzeuge: Reiter, Radfahrer, Holzfuhrwerk, Waldbahn -------------------------------

  const KLEIDUNG = ["#c8322b", "#2f6fb3", "#3e8e41", "#8a5a34", "#6b4a8a", "#d9b434"];

  function reiter(ctx, fb) {
    const { L, r } = ctx, pferd = wahl(r, ["#7b5634", "#5a3b22", "#a07a50", "#3d342b"]);
    return vonHinten(fb, [
      [-0.2, fb.teil(L, -0.25, -0.07, 0.2, 0.07, 4, pferd, 3) + fb.teil(L, -0.2, -0.05, -0.12, 0.05, 3, pferd, 0) +
        fb.teil(L, 0.1, -0.05, 0.18, 0.05, 3, pferd, 0)],
      [0.25, fb.teil(L, 0.18, -0.05, 0.32, 0.05, 3, pferd, 6)],                     // Kopf
      [0, fb.teil(L, -0.08, -0.06, 0.05, 0.06, 6, wahl(r, KLEIDUNG), 7) + fb.teil(L, -0.05, -0.04, 0.03, 0.04, 2.4, "#e9c9a8", 13)],
    ]);
  }

  function radfahrer(ctx, fb) {
    const { L, r } = ctx;
    return fb.teil(L, -0.2, -0.02, 0.2, 0.02, 1, "#3d342b", 2.5) + fb.teil(L, -0.2, -0.02, -0.16, 0.02, 3, "#3d342b", 0) +
      fb.teil(L, 0.16, -0.02, 0.2, 0.02, 3, "#3d342b", 0) +
      fb.teil(L, -0.07, -0.05, 0.05, 0.05, 5.5, wahl(r, KLEIDUNG), 3.5) + fb.teil(L, -0.04, -0.035, 0.03, 0.035, 2.2, "#e9c9a8", 9);
  }

  function fuhrwerk(ctx, fb) {  // Pferd vorn, Wagen mit Baumstämmen
    const { L } = ctx, holz = "#8a5a34";
    return vonHinten(fb, [
      [-0.2, fb.teil(L, -0.6, -0.2, 0.15, 0.2, 2, "#6b4a2b", 1.5) +
        fb.teil(L, -0.62, -0.17, 0.2, -0.04, 2.4, holz, 3.5) + fb.teil(L, -0.62, 0.04, 0.2, 0.17, 2.4, holz, 3.5) +
        fb.teil(L, -0.6, -0.07, 0.18, 0.07, 2.4, "#a0703f", 5.9)],
      [0.4, fb.teil(L, 0.25, -0.08, 0.6, 0.08, 4.5, "#7b5634", 2) + fb.teil(L, 0.55, -0.05, 0.68, 0.05, 3, "#7b5634", 5)],
    ]);
  }

  function waldbahn(ctx, wagen, fb) {  // kleine grüne Dampflok, Wagen mit Baumstämmen bzw. offenen Bänken
    const { L, r } = ctx, teile = [];
    for (let k = 1; k <= wagen; k++) {
      const a = -k * 0.95;
      const ladung = k % 2 ? fb.teil(L, a - 0.38, -0.15, a + 0.38, 0.15, 3, "#a0703f", 4) :
        fb.teil(L, a - 0.38, -0.16, a + 0.38, 0.16, 4, wahl(r, ["#c8322b", "#2f6fb3", "#d9b434"]), 4) + fb.teil(L, a - 0.4, -0.18, a + 0.4, 0.18, 1, "#5a3b22", 9);
      teile.push([a, fb.teil(L, a - 0.42, -0.17, a + 0.42, 0.17, 3, "#5a3b22", 1) + ladung]);
    }
    teile.push([0.1, fb.teil(L, -0.42, -0.17, -0.05, 0.17, 8, "#2f5a3a", 1) + fb.teil(L, -0.05, -0.13, 0.42, 0.13, 5, "#3e6e46", 1) +
      fb.teil(L, 0.28, -0.05, 0.38, 0.05, 5, "#1e1e1e", 6)]);
    let s = vonHinten(fb, teile);
    const kamin = fb.punkt(0.33, 0, 12);
    for (let i = 0; i < 4; i++) {
      s += `<circle cx="${f(kamin[0])}" cy="${f(kamin[1])}" r="2" fill="#f4f1ea" opacity=".9" class="lw-dampf" style="animation-delay:-${f(i * 0.4 + r() * 0.2)}s"/>`;
    }
    return s;
  }

  function foersterei(ctx, i, j) {  // Holzhaus mit Moosdach an der Waldbahn
    const { L, r, licht } = ctx;
    return quader(L, i, j, i + 2.6, j + 1.2, 11, "#a07a50") + satteldach(L, i - 0.1, j - 0.1, i + 2.7, j + 1.3, 11, 8, "#4f6b3a", "#a07a50", false) +
      fenster(L, i, j, i + 2.6, j + 1.2, 1, 11, licht, r, 0, "#55705a") + quader(L, i + 2.8, j + 0.2, i + 3.6, j + 1, 4, "#8a5a34");  // Holzstapel
  }

  // --- Waldrand: Hochsitze und Aussichtstürme statt Mauertürmen -------------------------

  function hochsitz(ctx, i, j, w, h) {
    const { L } = ctx, a = i + w * 0.2, b = j + w * 0.2, e = i + w * 0.8, d = j + w * 0.8, oben = Math.max(8, h - 7);
    let s = "";
    for (const [x, y] of [[a, b], [e, b], [a, d], [e, d]]) s += quader(L, x - 0.04, y - 0.04, x + 0.04, y + 0.04, oben, "#6b4a2b");
    if (h > 24) {  // Aussichtsturm: zwei Plattformen und ein spitzes Dach
      s += quader(L, a - 0.05, b - 0.05, e + 0.05, d + 0.05, 1.2, "#8a6a45", oben * 0.5);
      return s + quader(L, a - 0.08, b - 0.08, e + 0.08, d + 0.08, 4, "#8a6a45", oben) + zeltdach(L, a - 0.12, b - 0.12, e + 0.12, d + 0.12, oben + 6, 8, "#5a4a3a");
    }
    return s + quader(L, a - 0.05, b - 0.05, e + 0.05, d + 0.05, 5, "#8a6a45", oben) +
      satteldach(L, a - 0.1, b - 0.1, e + 0.1, d + 0.1, oben + 5, 4, "#5a4a3a", "#8a6a45", false);
  }

  const RAND = [
    { h: 5, d: 0.15, farbe: "#8a6a45" },                                                // Weidenzaun
    { h: 6, d: 0.35, farbe: "#a8a294" },                                                // Trockenmauer
    { h: 10, d: 0.5, farbe: "#4f7a3a", ecken: 22, turm: hochsitz },                     // Hecke mit Hochsitzen
    { h: 14, d: 0.6, farbe: "#3f6b30", ecken: 30, tore: true, zwischen: true, turm: hochsitz },  // mit Aussichtstürmen
    { h: 16, d: 0.65, farbe: "#3a6230", ecken: 32, tore: true, zwischen: true, turm: hochsitz },  // dazu Bach und Außenhecke
  ];

  // --- Ausbau, Umland, Nacht ----------------------------------------------------

  const BLUMEN = ["#f2d640", "#e86a8a", "#ffffff", "#9b7fd1", "#f08a3c"];

  function ausbau(ctx) {  // Blumen auf der Lichtung (je 3 Lerntage), Bänke (je 30)
    const { neu, tage, tint } = ctx, r = zufall(23);
    for (let k = 0; k < Math.min(60, Math.floor(tage / 3)); k++) {
      const i = -PLATZ + r() * (2 * PLATZ + 1), j = -PLATZ + r() * (2 * PLATZ + 1);
      neu(i + j, sprite(i, j, 0.8, tint(`<path d="M0,0 L0,-6" stroke="#4f8a3a" stroke-width=".9"/>` +
        `<circle cx="0" cy="-7" r="2.2" fill="${BLUMEN[k % BLUMEN.length]}"/><circle cx="0" cy="-7" r=".8" fill="#c9a640"/>`)));
    }
    for (let k = 0; k < Math.min(4, Math.floor(tage / 30)); k++) {
      const [i, j] = [[-2.3, 0.5], [3.3, 0.5], [0.5, -2.3], [0.5, 3.3]][k];
      neu(i + j, sprite(i, j, 0.9, tint(`<path d="M-8,0 L-8,-5 M8,0 L8,-5" stroke="#5a3b22" stroke-width="1.2"/><rect x="-9" y="-6" width="18" height="2" fill="#7a5530"/>`)));
    }
  }

  function fern(ctx) {  // ab 200 Lerntagen: ein Waldsee links mit Schilf und Steg
    const { L, neu, RB } = ctx, i0 = -RB - 5, i1 = -RB - 0.5;
    const rand = [P(i0 + 1, -4), P(i1 - 0.5, -4.5), P(i1, -1), P(i1 - 0.3, 3), P(i0 + 1.5, 4.5), P(i0, 1), P(i0 + 0.2, -2)];
    ctx.grund += `<path d="M${rand.map(pt).join(" L")} Z" fill="${L("#6f9fc0")}" stroke="${L("#4f7f9a")}" stroke-width="1.2"/>`;
    ctx.grund += `<path d="M${pt(P(i0 + 1.5, -2))} l30,4 M${pt(P(i0 + 2, 1))} l24,3" stroke="#ffffff" stroke-width=".8" opacity=".4"/>`;
    for (let k = 0; k < 14; k++) {
      const p = rand[k % rand.length];
      ctx.grund += `<path d="M${f(p[0] + (k % 3) * 3)},${f(p[1])} l-1,-7 M${f(p[0] + (k % 3) * 3 + 2)},${f(p[1])} l1,-6" stroke="${L("#5b7f3a")}" stroke-width=".9"/>`;
    }
    neu(i1 - 1, quader(L, i1 - 1.6, -0.2, i1 - 0.1, 0.2, 1.5, "#8a6a45", 1));  // Steg
  }

  function umland(ctx) {  // Wiesen, Felsen und viel Wald rund um das Gebiet
    const { L, r, neu, RV, RB, RW, RA, mauer, v, g, tint } = ctx, fr = zufall(29);
    for (let k = 0; k < 18; k++) {  // hellere Wiesen
      const i = Math.floor((fr() * 2 - 1) * (RV - 2)), j = Math.floor((fr() * 2 - 1) * (RV - 2));
      if (Math.max(Math.abs(i), Math.abs(j)) < RB + 1.5) continue;
      const w = 2 + Math.floor(fr() * 3), h = 2 + Math.floor(fr() * 2);
      ctx.grund += poly([P(i, j), P(i + w, j), P(i + w, j + h), P(i, j + h)], L(wahl(fr, ["#a9c47a", "#b8cf86", "#9fbb6c"])), ' opacity=".7"' + FLACH);
    }
    for (let k = 0; k < 140; k++) {
      const i = (r() * 2 - 1) * RV, j = (r() * 2 - 1) * RV;
      if (Math.max(Math.abs(i), Math.abs(j)) < (mauer >= 5 ? RA : RW) + 1) continue;
      if (v.zuege && j < -RB + 1 && j > -RB - v.zuege - 0.5) continue;  // nicht auf die Gleise
      if (r() < 0.06) {
        neu(i + j, quader(L, i, j, i + 0.4, j + 0.3, 3, "#9a948a"));  // Felsen
        continue;
      }
      neu(i + j, sprite(i, j, 0.5, tint(WALD.bild(r() < 0.6 ? "baum" : "jung", g.zustand === "verwildert" ? 1 : 0, r))));
    }
  }

  function nacht(ctx) {  // Glühwürmchen zwischen den Bäumen
    const { r, neu, RS } = ctx;
    for (let k = 0; k < 70; k++) {
      const i = (r() * 2 - 1) * RS, j = (r() * 2 - 1) * RS, p = P(i, j, 4 + r() * 14);
      neu(i + j + 0.5, `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="1.2" fill="#f6f08a" class="lw-blinken" ` +
        `style="animation-duration:${f(0.8 + r() * 1.6)}s;animation-delay:-${f(r() * 2)}s"/>`);
    }
  }

  const STIL = {
    boden: (zustand) => WALD.boden[zustand],
    wegFarbe: (v) => (v.fahrzeuge ? "#b9a27a" : "#c9b892"),
    platzFarbe: "#b9d08a",  // Lichtung
    schienen: false,
    haus,
    figur,
    langsam: reiter,
    schnell: radfahrer,
    gross: fuhrwerk,
    zug: waldbahn,
    bahnhof: foersterei,
    gleisBett: "#9a8a6a",
    mauer: RAND,
    graben: "#6f9fc0",  // Bach
    aussenRing: { h: 8, d: 0.45, farbe: "#5a8a44", ecken: 18, turm: hochsitz },
    belohnung: (t) => WALD.belohnung(t),
    belohnungSkala: 0.55,
    ausbau,
    fern,
    umland,
    nacht,
  };

  WALD.szene = (g, o) => window.LW.iso.szene(g, o, STIL);
})();
