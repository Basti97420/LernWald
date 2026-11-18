// Lernwald – Anki-Add-on
// Copyright (C) 2026 Basti97420
// Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
// Thema „Plantage“: Karten sind Hanfpflanzen, vom Samen bis zur blühenden Pflanze; darüber wachsen große
// Stauden, Gewächshäuser und Vertical Farms. Gesunde Gebiete bekommen Höfe mit Regentonne bis Forschungszentrum.
// Dieselben Regeln wie Stadt und Wald (grundlagen.js), Ansicht von oben in iso-plantage.js.
(function () {
  "use strict";
  const { f, wahl, schatten } = window.LW;

  const BLATT = ["#4f9a3a", "#3f8a34", "#5aa845", "#468f3c"];
  const BLATT_W = ["#c9b03a", "#b89a34", "#a8873a", "#cfb64a"];  // gelbe Blätter: fällig
  const STIEL = "#5b7f34", ERDE = "#6b4a2b", TOPF = "#c0623a", HOLZ = "#8a6a45", BALKEN = "#5a3b22";

  const rect = (x, y, w, h, fill, extra) =>
    `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}"${extra || ""}/>`;

  // Ein gefingertes Hanfblatt als ein einziger Pfad: Ansatz (x, y), Länge l, Richtung w (Grad, 0 = nach oben)
  function blatt(x, y, l, w, farbe, finger) {
    finger = finger || 7;
    let d = "";
    for (let k = 0; k < finger; k++) {
      const t = finger > 1 ? k / (finger - 1) - 0.5 : 0;     // -0,5 … 0,5
      const a = ((w + t * 150) * Math.PI) / 180;               // Finger fächern sich auf
      const lang = l * (1 - Math.abs(t) * 1.1);                // die mittleren sind am längsten
      const breit = lang * 0.16;
      const sx = Math.sin(a), sy = -Math.cos(a), qx = -sy, qy = sx;  // Richtung und quer dazu
      const tx = x + sx * lang, ty = y + sy * lang, mx = x + sx * lang * 0.45, my = y + sy * lang * 0.45;
      d += `M${f(x)},${f(y)} Q${f(mx + qx * breit)},${f(my + qy * breit)} ${f(tx)},${f(ty)} Q${f(mx - qx * breit)},${f(my - qy * breit)} ${f(x)},${f(y)} `;
    }
    return `<path d="${d}" fill="${farbe}"/>`;
  }

  function knospen(r, punkte) {  // Blüten: hellgrüne Knospen mit orangen Härchen
    return punkte.map(([x, y]) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="2.6" ry="3.6" fill="#b7d77a"/>` +
      `<circle cx="${f(x - 0.8)}" cy="${f(y - 1.2)}" r=".7" fill="#e08a3c"/><circle cx="${f(x + 0.9)}" cy="${f(y + 0.4)}" r=".6" fill="#d9703a"/>`).join("");
  }

  // Pflanze mit Stiel der Höhe h und Blättern in Etagen; Fußpunkt bei 0,0
  function pflanze(r, h, etagen, welk, bluete) {
    const farben = welk ? BLATT_W : BLATT;
    let s = schatten(h * 0.28) + `<path d="M0,0 Q${f(r() * 2 - 1)},${f(-h * 0.5)} 0,${f(-h)}" stroke="${welk ? "#8a7a3a" : STIEL}" stroke-width="${f(Math.max(1.2, h / 22))}" fill="none"/>`;
    for (let e = 0; e < etagen; e++) {
      const y = -h * (0.3 + 0.62 * e / Math.max(1, etagen - 1)), l = h * (0.42 - 0.22 * e / Math.max(1, etagen));
      s += blatt(0, y, l, -62 - r() * 10, wahl(r, farben)) + blatt(0, y - 1, l, 62 + r() * 10, wahl(r, farben));
    }
    s += blatt(0, -h, h * 0.22, 0, farben[0], 5);  // Spitze
    if (bluete) s += knospen(r, [[0, -h - 2], [-h * 0.18, -h * 0.7], [h * 0.2, -h * 0.62], [-h * 0.12, -h * 0.45]]);
    return s;
  }

  function pflanzeSvg(stufe, welk, r) {
    switch (stufe) {
      case "spross":  // Samen: Erdhügel mit zwei Keimblättern
        return `<ellipse cx="0" cy="0" rx="6" ry="2.2" fill="${ERDE}"/>` +
          `<path d="M0,-1 L0,-5" stroke="${STIEL}" stroke-width="1"/>` +
          `<ellipse cx="-2.4" cy="-5.5" rx="2.6" ry="1.2" fill="${welk ? BLATT_W[0] : "#7cc057"}"/><ellipse cx="2.4" cy="-5.5" rx="2.6" ry="1.2" fill="${welk ? BLATT_W[1] : "#8fd062"}"/>`;
      case "setzling":  // Steckling im Tontopf
        return schatten(6) + `<path d="M-5,0 L-6,-8 L6,-8 L5,0 Z" fill="${TOPF}"/>` + rect(-6.5, -9.5, 13, 2, "#a8502f") +
          `<g transform="translate(0,-9)">${pflanze(r, 12, 1, welk, false)}</g>`;
      case "jung":
        return pflanze(r, 22, 2, welk, false);
      case "baum":
        return pflanze(r, 36, 3, welk, false);
      case "alt":  // blühend
        return pflanze(r, 48, 4, welk, true);
      case "krank":  // vertrocknet, Blätter hängen
        return schatten(8) + `<path d="M0,0 Q2,-14 -1,-26" stroke="#8a7a3a" stroke-width="1.6" fill="none"/>` +
          blatt(0, -12, 9, -120, "#a8873a") + blatt(0, -20, 8, 125, "#b89a34") + blatt(-1, -26, 6, 160, "#8c6a3a", 5);
      case "stumpf":  // abgeerntet: kurzer Stängel
        return `<ellipse cx="0" cy="0" rx="5" ry="1.8" fill="${ERDE}"/><path d="M0,0 L0,-7 M0,-4 L2.5,-6" stroke="#8a7a3a" stroke-width="1.4"/>`;
    }
    return "";
  }

  // --- Belohnungen (Seitenansicht, Fußpunkt bei 0,0) ---------------------------------------

  const DACH = "#a33d2a";
  const HOF = {
    regentonne: () => schatten(7) + rect(-6, -13, 12, 13, "#3f6b8a", ' rx="1.5"') + rect(-6.5, -14, 13, 2, "#2f5068") +
      rect(-6, -9, 12, 1, "#2f5068") + rect(-6, -4, 12, 1, "#2f5068"),
    kompost: () => schatten(10) + `<path d="M-11,0 Q-10,-11 0,-12 Q10,-11 11,0 Z" fill="#6b4a2b"/>` +
      `<path d="M-6,-6 l3,-2 M2,-8 l3,1 M-2,-3 l2,-2" stroke="#7cc057" stroke-width="1.4"/>` + rect(-12, -6, 1.5, 6, HOLZ) + rect(10.5, -6, 1.5, 6, HOLZ),
    bienenstock: () => schatten(7) + rect(-1, -8, 2, 8, HOLZ) + rect(-7, -18, 14, 10, "#e0b400", ' rx="1"') +
      `<path d="M-8,-18 L0,-23 L8,-18 Z" fill="${DACH}"/>` + rect(-7, -14, 14, 0.8, "#b58f00") + rect(-1.5, -10, 3, 1.5, "#3d342b") +
      `<circle cx="9" cy="-20" r="1" fill="#3d342b"/><circle cx="11" cy="-16" r="1" fill="#3d342b"/>`,
    vogelscheuche: () => schatten(6) + `<path d="M0,0 L0,-26 M-10,-19 L10,-19" stroke="${HOLZ}" stroke-width="1.6"/>` +
      `<path d="M-6,-20 L6,-20 L5,-10 L-5,-10 Z" fill="#c8322b"/><circle cx="0" cy="-24" r="3.2" fill="#e9d29a"/>` +
      `<path d="M-5,-26 L5,-26 L3,-30 L-3,-30 Z" fill="#6b4a2b"/>`,
    gaertnerhaus: () => schatten(16) + rect(-14, -16, 28, 16, "#e8d5b0") + `<path d="M-16,-16 L0,-27 L16,-16 Z" fill="${DACH}"/>` +
      rect(-3, -9, 6, 9, BALKEN) + rect(-11, -12, 5, 4, "#6c8aa3") + rect(6, -12, 5, 4, "#6c8aa3"),
    windrad: () => schatten(8) + `<path d="M-2,0 L-1,-38 L1,-38 L2,0 Z" fill="#e8e2d4"/>` +
      `<g transform="translate(0,-38)"><path d="M0,0 L-2,-16 L2,-16 Z M0,0 L14,7 L12,10 Z M0,0 L-12,10 L-14,7 Z" fill="#f4f1ea"/><circle r="1.6" fill="#9aa5ad"/></g>`,
    wasserturm: () => schatten(12) + `<path d="M-8,0 L-5,-24 M8,0 L5,-24 M-6,-12 L6,-12" stroke="${BALKEN}" stroke-width="1.6"/>` +
      rect(-9, -36, 18, 12, "#9aa5ad", ' rx="2"') + `<path d="M-10,-36 L0,-42 L10,-36 Z" fill="#6b5f5a"/>`,
    trockenscheune: () => schatten(20) + rect(-18, -18, 36, 18, "#8a6a45") + `<path d="M-20,-18 L0,-30 L20,-18 Z" fill="#5a3b22"/>` +
      `<path d="M-14,-14 L-14,-4 M-8,-14 L-8,-4 M-2,-14 L-2,-4 M4,-14 L4,-4 M10,-14 L10,-4" stroke="#4f9a3a" stroke-width="2"/>` +
      rect(12, -11, 5, 11, BALKEN),
    hofladen: () => schatten(16) + rect(-14, -14, 28, 14, "#f3ead8") +
      `<path d="M-16,-14 L-14,-19 L14,-19 L16,-14 Z" fill="#4f9a3a"/>` + [-12, -6, 0, 6].map((x) => rect(x, -19, 3, 5, "#f3ead8")).join("") +
      rect(-11, -10, 8, 6, "#6c8aa3") + rect(2, -10, 8, 10, BALKEN) + rect(-13, -2, 10, 2, "#c0623a"),
    labor: () => schatten(16) + rect(-14, -20, 28, 20, "#e8e8e4") + rect(-14, -22, 28, 2, "#9aa5ad") +
      [-11, -4, 3, 10].map((x) => rect(x, -17, 4, 5, "#7e9bb3")).join("") + rect(-3, -9, 6, 9, "#7e9bb3") +
      `<path d="M8,-26 L8,-22 M6,-26 L10,-26" stroke="#3d342b" stroke-width="1"/>`,
    kuehlhaus: () => schatten(16) + rect(-15, -16, 30, 16, "#dfe8ee") + rect(-15, -18, 30, 2, "#9aa5ad") +
      rect(-10, -12, 9, 12, "#b8c8d4") + `<path d="M7,-12 l3,3 l-3,3 l-3,-3 Z M7,-12 l0,6" stroke="#5d7f9a" stroke-width=".8" fill="none"/>`,
    forschung: () => schatten(22) + rect(-20, -16, 40, 16, "#e8e8e4") + rect(-8, -34, 16, 18, "#cfe0d8") +
      `<path d="M-8,-34 Q0,-44 8,-34 Z" fill="#9fd0b0" opacity=".9"/>` + [-17, -11, 7, 13].map((x) => rect(x, -12, 4, 5, "#7e9bb3")).join("") +
      rect(-3, -10, 6, 10, "#5d7f9a") + `<path d="M0,-40 L0,-48" stroke="#3d342b" stroke-width="1"/><circle cx="0" cy="-49" r="1.3" fill="#4f9a3a"/>`,
  };

  // Ausbau nach Lerntagen: Wachstumslampen (je 7 Tage), Bänke (je 30), ab 200 ein Bewässerungsteich
  function lampe() {  // Mast mit violettem Pflanzenlicht
    return `<path d="M0,0 L0,-26" stroke="#4a4038" stroke-width="1.4"/><path d="M-4,-26 L4,-26 L3,-29 L-3,-29 Z" fill="#4a4038"/>` +
      `<rect x="-3.5" y="-26" width="7" height="1.6" fill="#c58cff" class="lw-licht"/>`;
  }

  function bank() {
    return `<path d="M-8,0 L-8,-4 M8,0 L8,-4 M-8,-4 L-8,-9 M8,-4 L8,-9" stroke="${BALKEN}" stroke-width="1.1"/>` +
      rect(-9, -5, 18, 1.6, HOLZ) + rect(-9, -9.5, 18, 1.6, HOLZ);
  }

  function ausbauText(tage) {
    const teile = [];
    if (tage >= 7) teile.push(`${Math.min(16, Math.floor(tage / 7))} Wachstumslampen`);
    if (tage >= 30) teile.push(`${Math.min(6, Math.floor(tage / 30))} Bänke`);
    if (tage >= 200) teile.push("Bewässerungsteich");
    const naechstes = tage < 7 ? "erste Lampe ab 7" : tage < 30 ? "erste Bank ab 30" : tage < 200 ? "Bewässerungsteich ab 200" : "";
    return (teile.length ? "gebaut: " + teile.join(", ") : "noch nichts gebaut") + (naechstes ? ` (${naechstes} Lerntagen)` : "");
  }

  // --- Wachstum: Regeln in grundlagen.js (LW.wachstum), hier nur die Wörter der Plantage -------------
  const WACHSTUM = window.LW.wachstum({
    wiese: "Brachland",
    groessen: ["Fensterbank", "Kleingarten", "Gärtnerei", "Plantage", "Großplantage", "Agrarkonzern"],
    einwohner: "Gärtner",
    verkehr: ["Wege mit Schubkarren", "Feldbahn", "erste Lieferwagen", "Traktoren und Packhaus", "zweite Feldbahn",
      "dritte Feldbahn", "vierte Feldbahn"],
    mauerName: "Zaun",
    keineMauer: "keiner",
    mauer: ["Schnurzaun", "Holzzaun", "Maschendrahtzaun mit Lampenmasten", "Sicherheitszaun mit Wachtürmen",
      "doppelter Zaun mit Bewässerungskanal"],
    unterwegs: { langsam: ["Schubkarre", "Schubkarren"], schnell: ["Lieferwagen", "Lieferwagen"], gross: ["Traktor", "Traktoren"],
      zug: ["Feldbahn", "Feldbahnen"] },
    hoch: ["große Stauden", "Gewächshäuser", "Vertical Farms"],
    bald: {
      haus: ["Jungpflanze wird eine Pflanze", "Jungpflanzen werden Pflanzen"],
      stadthaus: ["Pflanze beginnt zu blühen", "Pflanzen beginnen zu blühen"],
      hoch: [["blühende Pflanze wird eine große Staude", "blühende Pflanzen werden große Stauden"],
        ["Staude bekommt ein Gewächshaus", "Stauden bekommen Gewächshäuser"],
        ["Gewächshaus wächst zur Vertical Farm", "Gewächshäuser wachsen zu Vertical Farms"]],
    },
  });

  window.LW.themen.plantage = {
    titel: "Lernplantage",
    stufen: {
      spross: "Samen – neu", setzling: "Steckling – in der Lernphase", jung: "Jungpflanze – unter 21 Tagen",
      baum: "Pflanze – reif, ab 21 Tagen", alt: "blühende Pflanze – ab 90 Tagen, kaum vergessen",
      krank: "kranke Pflanze – oft vergessen", stumpf: "abgeerntet – ausgesetzt",
    },
    welk: "Gelbe Blätter – fällig",
    zustand: { gesund: "prächtig", mittel: "wächst", verwildert: "verwildert", wiese: "noch Brachland" },
    boden: {
      gesund: ["#8fb35a", "#7fa04c"], mittel: ["#a8b46a", "#94a05a"],
      verwildert: ["#b8aa78", "#a39568"], wiese: ["#cfc39a", "#bdb088"],
    },
    bild: pflanzeSvg,
    belohnung: (id) => (HOF[id] ? HOF[id]() : ""),
    belohnungGroesse: 1.5,
    album: "Hofalbum",
    zaehler: (n, gesamt) => `${n} von ${gesamt} Höfen gebaut`,
    neu: "Neu auf dem Hof",
    datum: "gebaut am",
    ab: (n) => `entsteht ab ${n} prächtige${n === 1 ? "m Gebiet" : "n Gebieten"}`,
    erklaerung: "Prächtige Gebiete bekommen etwas auf den Hof: viele reife Pflanzen, wenig Fälliges. Je mehr Gebiete " +
      "prächtig sind, desto größer wird gebaut – von der Regentonne bis zum Forschungszentrum. Verwildert ein Gebiet, " +
      "verschwindet es dort wieder – im Album bleibt es.",
    hier: (namen) => `Auf dem Hof: ${namen}.`,
    nochKeine: (min) => `Noch nichts auf dem Hof – das kommt ab ${min} reifen Pflanzen.`,
    nurGesund: "Auf den Hof kommt nur etwas in prächtigen Gebieten.",
    leer: "Noch keine Beete.",
    groesse: WACHSTUM.groesse,
    lebenText: WACHSTUM.lebenText,
    zentriert: true,
    ausbauText,
    leuteText: "Gärtner",
    pflasterTitel: "Feldweg",
    teile: { BLATT, BLATT_W, HOLZ, BALKEN, ERDE, pflanze, lampe, bank },  // für die Ansicht von oben (iso-plantage.js)
  };
})();
