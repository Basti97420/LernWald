// Lernwald – Anki-Add-on
// Copyright (C) 2026 Basti97420
// Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
// Stil der Plantage für die Ansicht von oben (iso.js): Pflanzen in Beeten (in Reihen, nicht versetzt), große
// Stauden, Gewächshäuser und Vertical Farms (nachts violettes Pflanzenlicht), Gärtner, Schubkarren, Lieferwagen,
// Traktoren mit Anhänger, Feldbahn mit Kisten und Packhaus, Zäune bis zum doppelten Zaun mit Bewässerungskanal,
// Wachstumslampen, Bänke, Bewässerungsteich, Hanffelder ringsum.
(function () {
  "use strict";
  const { f, wahl, zufall } = window.LW;
  const { P, pt, poly, quader, satteldach, fenster, unkraut, vonHinten, FLACH, PLATZ } = window.LW.iso;
  const PL = window.LW.themen.plantage, B = PL.teile;

  const sprite = (x, y, skala, svg) => `<g transform="translate(${pt(P(x, y))}) scale(${f(skala)})">${svg}</g>`;
  const PFLANZENLICHT = "#c58cff";

  // Gewächshaus (hoch = 2) und Vertical Farm (hoch = 3) auf einer Parzelle
  function gewaechshaus(ctx, i, j) {
    const { L, licht } = ctx, glas = licht ? PFLANZENLICHT : "#cfe6d6", h = 12;
    let s = quader(L, i + 0.06, j + 0.06, i + 0.94, j + 0.94, 1.5, "#9aa5ad");  // Sockel
    s += poly([P(i + 0.08, j + 0.92, 1.5), P(i + 0.92, j + 0.92, 1.5), P(i + 0.92, j + 0.92, h), P(i + 0.08, j + 0.92, h)], licht ? glas : L(glas), ' opacity=".85"');
    s += poly([P(i + 0.92, j + 0.08, 1.5), P(i + 0.92, j + 0.92, 1.5), P(i + 0.92, j + 0.92, h), P(i + 0.92, j + 0.08, h)], licht ? glas : L("#b8d6c2"), ' opacity=".85"');
    // Pflanzenreihen durchs Glas und Sprossen
    for (const t of [0.3, 0.5, 0.7]) {
      s += `<path d="M${pt(P(i + t, j + 0.92, 1.5))} L${pt(P(i + t, j + 0.92, h))} M${pt(P(i + 0.92, j + t, 1.5))} L${pt(P(i + 0.92, j + t, h))}" stroke="#e8eef0" stroke-width=".7"/>`;
      s += `<path d="M${pt(P(i + t - 0.05, j + 0.92, 3))} l2,-4 l2,4 M${pt(P(i + 0.92, j + t - 0.05, 3))} l2,-4 l2,4" stroke="${L("#3f8a34")}" stroke-width="1.6" fill="none"/>`;
    }
    return s + satteldach(L, i + 0.04, j + 0.04, i + 0.96, j + 0.96, h, 8, licht ? PFLANZENLICHT : "#d8ece0", "#e8eef0", ctx.r() < 0.5);
  }

  function verticalFarm(ctx, i, j) {
    const { L, r, licht } = ctx, etagen = 12 + Math.floor(r() * 6), h = etagen * 6;
    let s = quader(L, i + 0.15, j + 0.15, i + 0.85, j + 0.85, h, "#9fb8c4");
    for (let k = 0; k < etagen; k++) {  // jede Etage ein grünes bzw. nachts violett leuchtendes Pflanzenband
      const z = k * 6 + 2, farbe = licht ? PFLANZENLICHT : L("#5aa845");
      s += poly([P(i + 0.2, j + 0.85, z), P(i + 0.8, j + 0.85, z), P(i + 0.8, j + 0.85, z + 2.5), P(i + 0.2, j + 0.85, z + 2.5)], farbe);
      s += poly([P(i + 0.85, j + 0.2, z), P(i + 0.85, j + 0.8, z), P(i + 0.85, j + 0.8, z + 2.5), P(i + 0.85, j + 0.2, z + 2.5)], farbe);
    }
    s += quader(L, i + 0.12, j + 0.12, i + 0.88, j + 0.88, 2, "#e8eef0", h) + quader(L, i + 0.3, j + 0.3, i + 0.7, j + 0.7, 6, "#cfe6d6", h + 2);
    s += blattDach(L, i + 0.5, j + 0.5, h + 8);
    return s;
  }

  function blattDach(L, i, j, z) {  // Dachgarten
    const p = P(i, j, z);
    return `<g transform="translate(${pt(p)}) scale(.35)">${B.pflanze(zufall(7), 30, 2, false, false).replace(/fill="(#[0-9a-f]{6})"/g, (_, c) => `fill="${L(c)}"`)}</g>`;
  }

  function haus(ctx, b, i, j) {
    const { L, r, tint } = ctx, [stufe, welk, hoch] = b;
    // jedes Beet: dunkle Erde in Reihen
    let s = poly([P(i + 0.12, j + 0.12), P(i + 0.88, j + 0.12), P(i + 0.88, j + 0.88), P(i + 0.12, j + 0.88)], L(B.ERDE), ' opacity=".55"' + FLACH);
    if (stufe === "alt" && hoch >= 2) return s + (hoch === 2 ? gewaechshaus(ctx, i, j) : verticalFarm(ctx, i, j)) + (welk ? unkraut(i, j) : "");
    const svg = PL.bild(stufe, welk, r), skala = stufe === "alt" && hoch === 1 ? 0.95 : 0.6;  // große Staude
    // jede dritte Pflanze wiegt sich im Wind
    const wiegen = r() < 0.33 ? ` class="lw-wiegen" style="animation-duration:${f(3 + r() * 2.5)}s;animation-delay:-${f(r() * 5)}s"` : "";
    return s + sprite(i + 0.5, j + 0.5, skala, `<g${wiegen}>${tint(svg)}</g>`);
  }

  // --- Fahrzeuge: Schubkarre (mit Gärtner), Lieferwagen, Traktor mit Anhänger, Feldbahn ------------------

  function schubkarre(ctx, fb) {
    const { L, r } = ctx;
    return vonHinten(fb, [
      [-0.1, fb.teil(L, -0.22, -0.05, -0.14, 0.05, 5.5, wahl(r, ["#c8322b", "#2f6fb3", "#3e8e41"]), 0) +
        fb.teil(L, -0.21, -0.035, -0.15, 0.035, 2.4, "#e9c9a8", 5.5)],  // Gärtner schiebt
      [0.1, fb.teil(L, -0.08, -0.1, 0.18, 0.1, 2.5, "#7a8a8f", 1.5) + fb.teil(L, -0.06, -0.08, 0.16, 0.08, 1, "#4f9a3a", 4)],
    ]);
  }

  function lieferwagen(ctx, fb) {
    const { L, r } = ctx, farbe = wahl(r, ["#f4f1ea", "#4f9a3a", "#e0b400"]);
    return fb.teil(L, -0.38, -0.17, 0.18, 0.17, 7, farbe, 1) + fb.teil(L, 0.18, -0.15, 0.4, 0.15, 4.5, farbe, 1) +
      fb.teil(L, 0.22, -0.13, 0.36, 0.13, 2.2, "#6c8aa3", 5.5);
  }

  function traktor(ctx, fb) {  // grüner Traktor vorn, Anhänger mit Kisten
    const { L } = ctx;
    return vonHinten(fb, [
      [-0.35, fb.teil(L, -0.75, -0.2, -0.15, 0.2, 2.5, "#8a6a45", 2) + fb.teil(L, -0.7, -0.15, -0.45, 0.15, 3, "#c9a26a", 4.5) +
        fb.teil(L, -0.42, -0.15, -0.2, 0.15, 3, "#4f9a3a", 4.5)],
      [0.25, fb.teil(L, 0, -0.15, 0.5, 0.15, 5, "#3e8e41", 2) + fb.teil(L, 0, -0.13, 0.2, 0.13, 6, "#3e8e41", 7) +
        fb.teil(L, 0.02, -0.11, 0.18, 0.11, 3, "#6c8aa3", 9) + fb.teil(L, 0.05, -0.22, 0.25, -0.15, 6, "#2d2d2d", 0) +
        fb.teil(L, 0.05, 0.15, 0.25, 0.22, 6, "#2d2d2d", 0) + fb.teil(L, 0.42, -0.04, 0.46, 0.04, 4, "#2d2d2d", 7)],
    ]);
  }

  function feldbahn(ctx, wagen, fb) {  // gelbe Feldbahnlok, Loren mit Kisten und Pflanzen
    const { L, r } = ctx, teile = [];
    for (let k = 1; k <= wagen; k++) {
      const a = -k * 0.9;
      teile.push([a, fb.teil(L, a - 0.38, -0.15, a + 0.38, 0.15, 3, "#7a8a8f", 1) +
        (k % 2 ? fb.teil(L, a - 0.3, -0.12, a + 0.3, 0.12, 3, "#c9a26a", 4) : fb.teil(L, a - 0.3, -0.12, a + 0.3, 0.12, 2.5, "#4f9a3a", 4))]);
    }
    teile.push([0.1, fb.teil(L, -0.38, -0.16, 0.38, 0.16, 5, "#e0b400", 1) + fb.teil(L, -0.38, -0.14, -0.05, 0.14, 4, "#e0b400", 6) +
      fb.teil(L, 0.22, -0.05, 0.3, 0.05, 4, "#2d2d2d", 6)]);
    let s = vonHinten(fb, teile);
    const kamin = fb.punkt(0.26, 0, 11);
    for (let i = 0; i < 3; i++) {
      s += `<circle cx="${f(kamin[0])}" cy="${f(kamin[1])}" r="1.8" fill="#e8e8e4" opacity=".8" class="lw-dampf" style="animation-delay:-${f(i * 0.5 + r() * 0.2)}s"/>`;
    }
    return s;
  }

  function packhaus(ctx, i, j) {  // Packhaus und Trockenscheune an der Feldbahn
    const { L, r, licht } = ctx;
    return quader(L, i, j, i + 3, j + 1.2, 10, "#8a6a45") + satteldach(L, i - 0.1, j - 0.1, i + 3.1, j + 1.3, 10, 7, "#5a3b22", "#8a6a45", false) +
      fenster(L, i, j, i + 3, j + 1.2, 1, 10, licht, r, 0, "#55705a") + quader(L, i + 3.2, j + 0.2, i + 3.9, j + 1, 3, "#c9a26a");  // Kisten
  }

  // --- Zaun: Lampenmasten und Wachtürme statt Mauertürmen ---------------------------------------

  function mast(ctx, i, j, w, h) {
    const { L, licht } = ctx, m = i + w / 2, n = j + w / 2;
    if (h > 24) {  // Wachturm: vier Beine, Kanzel, Flachdach, Scheinwerfer
      const a = i + w * 0.2, b = j + w * 0.2, e = i + w * 0.8, d = j + w * 0.8, oben = h - 7;
      let s = "";
      for (const [x, y] of [[a, b], [e, b], [a, d], [e, d]]) s += quader(L, x - 0.04, y - 0.04, x + 0.04, y + 0.04, oben, "#7f8a92");
      return s + quader(L, a - 0.05, b - 0.05, e + 0.05, d + 0.05, 5, "#9aa5ad", oben) + quader(L, a - 0.1, b - 0.1, e + 0.1, d + 0.1, 1, "#5f6b73", oben + 5) +
        quader(L, e - 0.02, d - 0.15, e + 0.1, d - 0.05, 1.5, licht ? "#fff3b0" : "#d8d8d0", oben + 3);
    }
    return quader(L, m - 0.05, n - 0.05, m + 0.05, n + 0.05, h, "#4a4038") + quader(L, m - 0.15, n - 0.15, m + 0.15, n + 0.15, 1.2, licht ? PFLANZENLICHT : "#d8d0e8", h);
  }

  const ZAUN = [
    { h: 3, d: 0.08, farbe: "#e8dcc0" },                                               // Schnurzaun
    { h: 6, d: 0.14, farbe: "#a07a50" },                                               // Holzzaun
    { h: 10, d: 0.1, farbe: "#b8c0c4", ecken: 22, turm: mast },                        // Maschendraht mit Lampenmasten
    { h: 13, d: 0.12, farbe: "#9aa5ad", ecken: 30, tore: true, zwischen: true, turm: mast },  // Sicherheitszaun mit Wachtürmen
    { h: 14, d: 0.14, farbe: "#8f9aa2", ecken: 32, tore: true, zwischen: true, turm: mast },  // dazu Kanal und Außenzaun
  ];

  // --- Ausbau, Umland -----------------------------------------------------------------

  function ausbau(ctx) {  // Wachstumslampen an den Hauptwegen (je 7 Lerntage), Bänke am Hof (je 30)
    const { neu, tage, tint } = ctx;
    for (let k = 0; k < Math.min(16, Math.floor(tage / 7)); k++) {
      const d = PLATZ + 1.5 + Math.floor(k / 4) * 2.2;
      const [i, j] = [[d, -0.1], [-d, 1.1], [1.1, d], [-0.1, -d]][k % 4];
      neu(i + j, sprite(i, j, 0.75, tint(B.lampe())));
    }
    for (let k = 0; k < Math.min(6, Math.floor(tage / 30)); k++) {
      const [i, j] = [[-2.3, 0.5], [3.3, 0.5], [0.5, -2.3], [0.5, 3.3], [-2.3, 2.5], [2.5, -2.3]][k];
      neu(i + j, sprite(i, j, 0.8, tint(B.bank())));
    }
  }

  function fern(ctx) {  // ab 200 Lerntagen: Bewässerungsteich links mit Pumpenhaus
    const { L, neu, RB } = ctx, i0 = -RB - 5, i1 = -RB - 0.5;
    ctx.grund += poly([P(i0, -3), P(i1, -3), P(i1, 3), P(i0, 3)], L("#6f9fc0"), ` stroke="${L("#8a7a5a")}" stroke-width="2"`);
    ctx.grund += `<path d="M${pt(P(i0 + 1, -1))} l30,4 M${pt(P(i0 + 1.5, 1))} l24,3" stroke="#ffffff" stroke-width=".8" opacity=".4"/>`;
    neu(i1 + 3.5, quader(L, i1 + 0.2, 2.2, i1 + 1.2, 3.2, 7, "#9aa5ad") + satteldach(L, i1 + 0.15, 2.15, i1 + 1.25, 3.25, 7, 4, "#6b5f5a", "#9aa5ad", false));
  }

  function umland(ctx) {  // Hanffelder in Reihen und ein paar Bäume
    const { L, r, neu, RV, RB, RW, RA, mauer, v, g, tint } = ctx, fr = zufall(31);
    for (let k = 0; k < 24; k++) {
      const i = Math.floor((fr() * 2 - 1) * (RV - 2)), j = Math.floor((fr() * 2 - 1) * (RV - 2));
      if (Math.max(Math.abs(i), Math.abs(j)) < RB + 1.5) continue;
      const w = 2 + Math.floor(fr() * 3), h = 2 + Math.floor(fr() * 2);
      ctx.grund += poly([P(i, j), P(i + w, j), P(i + w, j + h), P(i, j + h)], L("#8a6a45"), ' opacity=".45"' + FLACH);
      for (let z = 0.25; z < h; z += 0.5) {
        ctx.grund += `<path d="M${pt(P(i + 0.1, j + z))} L${pt(P(i + w - 0.1, j + z))}" stroke="${L(wahl(fr, ["#4f9a3a", "#5aa845"]))}" stroke-width="2.6" stroke-dasharray="2 2"/>`;
      }
    }
    const baum = window.LW.themen.wald && window.LW.themen.wald.bild;
    if (!baum) return;
    for (let k = 0; k < 30; k++) {
      const i = (r() * 2 - 1) * RV, j = (r() * 2 - 1) * RV;
      if (Math.max(Math.abs(i), Math.abs(j)) < (mauer >= 5 ? RA : RW) + 1) continue;
      if (v.zuege && j < -RB + 1 && j > -RB - v.zuege - 0.5) continue;  // nicht auf die Gleise
      neu(i + j, sprite(i, j, 0.5, tint(baum(r() < 0.5 ? "baum" : "jung", g.zustand === "verwildert" ? 1 : 0, r))));
    }
  }

  const STIL = {
    boden: (zustand) => PL.boden[zustand],
    wegFarbe: (v) => (v.fahrzeuge ? "#c3b38f" : "#cfc39a"),
    platzFarbe: "#d6c9a8",  // Hof
    schienen: false,
    haus,
    figur: (ctx) => ctx.hilfen.figur(ctx.r),
    langsam: schubkarre,
    schnell: lieferwagen,
    gross: traktor,
    zug: feldbahn,
    bahnhof: packhaus,
    gleisBett: "#9a8a6a",
    mauer: ZAUN,
    graben: "#6f9fc0",  // Bewässerungskanal
    aussenRing: { h: 8, d: 0.1, farbe: "#b8c0c4", ecken: 20, turm: mast },
    belohnung: (t) => PL.belohnung(t),
    belohnungSkala: 0.62,
    ausbau,
    fern,
    umland,
  };

  PL.szene = (g, o) => window.LW.iso.szene(g, o, STIL);
})();
