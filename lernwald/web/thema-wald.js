// Lernwald – Anki-Add-on
// Copyright (C) 2026 Basti97420
// Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
// Thema „Wald“: Karten sind Bäume, gesunde Gebiete locken Tiere an.
(function () {
  "use strict";
  const { f, wahl, grenze, schatten, auge } = window.LW;

  // --- Bäume (Seitenansicht, Fußpunkt bei 0,0) ------------------------------

  const LAUB = ["#3e8e41", "#2f7a36", "#4f9d48", "#367f3a"];
  const NADEL = ["#2b6a3c", "#235c34", "#30754a"];
  const WELK = ["#c7892f", "#b5652b", "#d0a040", "#a9772f"];
  const RINDE = ["#6b4a2b", "#7a5532", "#5e4127"];

  function stamm(unten, oben, h, farbe) {
    return `<path d="M${f(-unten / 2)},0 L${f(-oben / 2)},${f(-h)} L${f(oben / 2)},${f(-h)} L${f(unten / 2)},0 Z" fill="${farbe}"/>`;
  }

  function krone(r, cx, cy, R, farben, breite) {
    breite = breite || 1;
    let s = "";
    const teile = 4 + Math.floor(r() * 3);
    for (let i = 0; i < teile; i++) {
      const w = (i / teile) * Math.PI * 2 + r() * 0.6;
      s += `<circle cx="${f(cx + Math.cos(w) * R * 0.55 * breite)}" cy="${f(cy + Math.sin(w) * R * 0.45)}" r="${f(R * (0.55 + r() * 0.2))}" fill="${farben[1 % farben.length]}"/>`;
    }
    s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R * 0.75)}" fill="${farben[0]}"/>`;
    s += `<circle cx="${f(cx - R * 0.3)}" cy="${f(cy - R * 0.3)}" r="${f(R * 0.38)}" fill="${farben[2 % farben.length]}"/>`;
    s += `<circle cx="${f(cx - R * 0.35)}" cy="${f(cy - R * 0.38)}" r="${f(R * 0.18)}" fill="#fff" opacity=".12"/>`;
    return s;
  }

  function nadelbaum(r, h, b, farben, rinde) {
    let s = schatten(b * 0.55) + stamm(b * 0.18, b * 0.14, h * 0.25, rinde);
    const stufen = 3 + Math.floor(r() * 2);
    for (let i = 0; i < stufen; i++) {
      const y0 = -h * 0.15 - i * (h * 0.75 / stufen);
      const bb = b * (1 - i / (stufen + 0.6));
      const spitze = y0 - h * 0.42;
      s += `<path d="M${f(-bb / 2)},${f(y0)} Q0,${f(y0 + 3)} ${f(bb / 2)},${f(y0)} L0,${f(spitze)} Z" fill="${farben[i % farben.length]}"/>`;
    }
    return s;
  }

  function baumSvg(stufe, welk, r) {
    const laub = welk ? WELK : LAUB;
    const rinde = wahl(r, RINDE);
    switch (stufe) {
      case "spross":
        return schatten(4) +
          `<path d="M0,0 Q1,-5 0,-9" stroke="#5b8f3a" stroke-width="1.4" fill="none"/>` +
          `<ellipse cx="-3.2" cy="-9" rx="3.6" ry="1.8" transform="rotate(-30 -3.2 -9)" fill="${welk ? WELK[2] : "#7cc057"}"/>` +
          `<ellipse cx="3.2" cy="-10" rx="3.6" ry="1.8" transform="rotate(30 3.2 -10)" fill="${welk ? WELK[0] : "#8fd062"}"/>`;
      case "setzling":
        return schatten(6) +
          `<path d="M0,0 L0,-17" stroke="${rinde}" stroke-width="2"/>` +
          `<path d="M0,-11 L-4,-15" stroke="${rinde}" stroke-width="1.2"/>` +
          krone(r, 0, -19, 6, welk ? WELK : ["#5fae4c", "#4c9a40", "#79c25e"]);
      case "jung":
        return schatten(10) + stamm(4.5, 3, 20, rinde) + krone(r, 0, -28, 11, laub);
      case "baum":
        if (r() < 0.35) return nadelbaum(r, 62, 30, welk ? WELK : NADEL, rinde);
        return schatten(16) + stamm(7, 5, 28, rinde) + krone(r, 0, -42, 17, laub);
      case "alt":
        if (r() < 0.25) return nadelbaum(r, 98, 48, welk ? WELK : NADEL, rinde);
        return schatten(28) +
          `<path d="M-11,0 Q-7,-4 -6,-12 L-5,-36 L5,-36 L6,-12 Q7,-4 11,0 Z" fill="${rinde}"/>` +
          `<path d="M-2,-20 L-2,-30 M2,-10 L3,-22" stroke="rgba(0,0,0,.25)" stroke-width="1"/>` +
          krone(r, 0, -60, 28, laub, 1.35) + krone(r, -14, -50, 14, laub) + krone(r, 15, -52, 15, laub);
      case "krank":
        return schatten(12) + stamm(6, 3.5, 44, "#7a6a58") +
          `<path d="M0,-24 L-13,-37 M-8,-32 L-11,-41 M0,-32 L12,-46 M7,-40 L13,-42 M0,-40 L-5,-55 M0,-44 L4,-56"` +
          ` stroke="#7a6a58" stroke-width="2" stroke-linecap="round" fill="none"/>` +
          `<circle cx="-12" cy="-40" r="2" fill="#a9772f"/><circle cx="12" cy="-46" r="1.8" fill="#8c6a3a"/>` +
          `<circle cx="-4" cy="2" r="1.5" fill="#a9772f"/><circle cx="6" cy="1" r="1.3" fill="#b5652b"/>`;
      case "stumpf":
        return schatten(9) +
          `<path d="M-8,0 L-6.5,-9 L6.5,-9 L8,0 Z" fill="#8a6a45"/>` +
          `<ellipse cx="0" cy="-9" rx="6.5" ry="2.4" fill="#d8b98a"/>` +
          `<ellipse cx="0" cy="-9" rx="3.5" ry="1.2" fill="none" stroke="#a9875a" stroke-width=".7"/>`;
    }
    return "";
  }

  // --- Tiere (Seitenansicht, Blick nach rechts, Fußpunkt bei 0,0) -----------

  function beine(xs, oben, h, farbe, dicke) {
    return xs.map((x) => `<path d="M${x},${f(oben)} L${x},0" stroke="${farbe}" stroke-width="${dicke}" stroke-linecap="round"/>`).join("");
  }

  const TIERBILD = {
    meise: () => schatten(6) + beine([-1, 1.5], -3, 3, "#555", 0.8) +
      `<path d="M-6,-6 L-12,-3 L-11,-1 L-5,-5 Z" fill="#4d6e7a"/>` +
      `<ellipse cx="0" cy="-6.5" rx="6.5" ry="4.6" fill="#f2d640"/>` +
      `<ellipse cx="-1.5" cy="-8" rx="5" ry="3" fill="#6f8f6a"/>` +
      `<circle cx="5" cy="-11" r="3.4" fill="#1d1d1d"/><circle cx="5.7" cy="-10.6" r="1.7" fill="#fff"/>` +
      `<path d="M8.2,-11.4 L10.4,-11 L8.2,-10.4 Z" fill="#333"/><path d="M3,-7 L3,-3" stroke="#1d1d1d" stroke-width="1.3"/>`,
    specht: () => schatten(5) + beine([-0.5, 1.5], -3, 3, "#555", 0.8) +
      `<path d="M-2,-4 L-6,2 L-3,1 Z" fill="#1d1d1d"/>` +
      `<ellipse cx="0" cy="-9" rx="4.4" ry="7.5" fill="#1d1d1d"/><ellipse cx="1.4" cy="-8" rx="2.4" ry="5" fill="#f2efe6"/>` +
      `<ellipse cx="-1.6" cy="-10" rx="1.6" ry="3" fill="#fff"/><path d="M-1,-2.5 Q0,-1 1.6,-2.5" stroke="#d2232a" stroke-width="2" fill="none"/>` +
      `<circle cx="1.5" cy="-17" r="3.4" fill="#f2efe6"/><path d="M-1.6,-18.5 A3.4,3.4 0 0 1 4,-19" fill="#d2232a"/>` +
      `<path d="M4.6,-17.4 L8.5,-17 L4.6,-16 Z" fill="#333"/>` + auge(2.6, -17.6, 0.7),
    eule: () => schatten(7) +
      `<ellipse cx="0" cy="-11" rx="7.2" ry="11" fill="#8b6a45"/>` +
      `<path d="M-6,-8 Q0,-2 6,-8" stroke="#6d5034" stroke-width="1" fill="none"/><path d="M-5,-4 Q0,1 5,-4" stroke="#6d5034" stroke-width="1" fill="none"/>` +
      `<ellipse cx="0" cy="-16" rx="6" ry="5" fill="#b89470"/>` +
      `<circle cx="-2.4" cy="-16.5" r="1.7" fill="#1b1b1b"/><circle cx="2.4" cy="-16.5" r="1.7" fill="#1b1b1b"/>` +
      `<path d="M-0.8,-14.6 L0,-12.6 L0.8,-14.6 Z" fill="#d9b34a"/>` +
      `<path d="M-3,0 L-3,1.5 M3,0 L3,1.5" stroke="#d9b34a" stroke-width="1.2"/>`,
    eichhoernchen: () => schatten(7) +
      `<path d="M-4,-5 C-16,-3 -19,-22 -9,-25 C-2,-27 -1,-17 -7,-15 C-9,-14 -8,-10 -4,-9 Z" fill="#b5541f"/>` +
      `<ellipse cx="0" cy="-6.5" rx="6" ry="5" fill="#c9622a"/><ellipse cx="2" cy="-5" rx="3" ry="3.4" fill="#f0d8b8"/>` +
      `<circle cx="5.5" cy="-12" r="3.6" fill="#c9622a"/><path d="M4,-15 L4.6,-19 L6.4,-15 Z" fill="#b5541f"/>` +
      auge(6.6, -12.6) + `<path d="M-3,0 L-1,-3 M3,0 L3,-4" stroke="#a24b1c" stroke-width="1.6"/>`,
    igel: () => {
      let z = "M-10,0";
      for (let i = 0; i <= 12; i++) {
        const w = Math.PI - (i / 12) * Math.PI;
        const rr = i % 2 ? 9.5 : 7.6;
        z += ` L${f(Math.cos(w) * rr)},${f(-Math.sin(w) * rr * 0.85)}`;
      }
      return schatten(10) + `<path d="${z} Z" fill="#6e5236"/>` +
        `<path d="M5,-1 Q7,-7 12,-2.5 Q11,0 5,0 Z" fill="#d1ab80"/>` + auge(8.4, -3.6, 0.8) +
        `<circle cx="12.2" cy="-2.4" r="1" fill="#1b1b1b"/>`;
    },
    hase: () => schatten(10) +
      `<ellipse cx="0" cy="-8" rx="9" ry="6" fill="#a8865e"/><circle cx="-4" cy="-7" r="6" fill="#9c7a53"/>` +
      `<circle cx="-9.5" cy="-8.5" r="2.3" fill="#fff"/>` +
      `<ellipse cx="6" cy="-22" rx="1.8" ry="6.5" transform="rotate(-15 6 -22)" fill="#a8865e"/>` +
      `<ellipse cx="8.5" cy="-21.5" rx="1.6" ry="6" transform="rotate(5 8.5 -21.5)" fill="#9c7a53"/>` +
      `<ellipse cx="9" cy="-14" rx="4.4" ry="3.6" fill="#a8865e"/>` + auge(10, -14.8) +
      `<path d="M6,-2 L8,0 M-6,-1 L-3,0" stroke="#8a6a45" stroke-width="2" stroke-linecap="round"/>`,
    fuchs: () => schatten(16) +
      `<path d="M-11,-14 C-22,-14 -28,-6 -26,-2 C-22,-4 -16,-7 -10,-10 Z" fill="#d9692a"/>` +
      `<path d="M-26,-2 C-27,-4 -25,-6 -23,-5 Z" fill="#fff"/>` +
      beine([-8, -5, 6, 9], -12, 12, "#4a2e1d", 2.2) +
      `<ellipse cx="0" cy="-15" rx="12.5" ry="5.8" fill="#d9692a"/><ellipse cx="9" cy="-13" rx="4" ry="3.6" fill="#f4eadc"/>` +
      `<path d="M9,-23 L12,-30 L14,-22 L16,-29 L18,-21 L25,-16 L20,-14 Q14,-13 10,-17 Z" fill="#d9692a"/>` +
      `<path d="M20,-14 L25,-16 L20,-16.5 Z" fill="#f4eadc"/><circle cx="25" cy="-16" r="1" fill="#1b1b1b"/>` + auge(17.5, -19.5),
    reh: () => schatten(14) + beine([-8, -6, 7, 9], -19, 19, "#7d5230", 1.8) +
      `<ellipse cx="0" cy="-23" rx="12" ry="6.5" fill="#a5703f"/><ellipse cx="-11" cy="-23" rx="2.6" ry="3.5" fill="#f4eadc"/>` +
      `<path d="M7,-27 L11,-38 L15,-37 L13,-24 Z" fill="#a5703f"/>` +
      `<path d="M10,-38 Q13,-42 17,-39 L21,-35 Q20,-33 17,-34 L13,-34 Z" fill="#a5703f"/>` +
      `<ellipse cx="11" cy="-41" rx="1.6" ry="3.6" transform="rotate(-25 11 -41)" fill="#93623a"/>` +
      `<circle cx="21" cy="-35" r=".9" fill="#1b1b1b"/>` + auge(15.5, -37.5),
    hirsch: () => schatten(18) + beine([-10, -7, 8, 11], -23, 23, "#5e3d23", 2.4) +
      `<ellipse cx="0" cy="-28" rx="15" ry="8" fill="#8a5a32"/><ellipse cx="-14" cy="-28" rx="3" ry="4" fill="#e9dcc4"/>` +
      `<path d="M9,-33 L13,-46 L19,-45 L16,-29 Z" fill="#7a4e2b"/>` +
      `<path d="M12,-46 Q16,-51 21,-47 L26,-42 Q25,-40 21,-41 L16,-41 Z" fill="#8a5a32"/>` +
      `<path d="M15,-49 L12,-60 L7,-66 M12,-60 L16,-66 M13,-55 L8,-57 M18,-49 L22,-59 L27,-64 M22,-59 L21,-66 M20,-55 L26,-56"` +
      ` stroke="#e8dcc0" stroke-width="1.6" stroke-linecap="round" fill="none"/>` +
      `<circle cx="26" cy="-42" r="1" fill="#1b1b1b"/>` + auge(20, -45),
    dachs: () => schatten(14) + beine([-8, -5, 6, 9], -5, 5, "#222", 2.6) +
      `<ellipse cx="0" cy="-8" rx="13" ry="6" fill="#8d8d8d"/><path d="M-13,-8 L-17,-6 L-13,-6 Z" fill="#8d8d8d"/>` +
      `<path d="M9,-12 Q14,-14 21,-6 L19,-4 Q13,-4 9,-5 Z" fill="#f2f2f2"/>` +
      `<path d="M10,-11 Q15,-11 20,-5.4" stroke="#1d1d1d" stroke-width="1.8" fill="none"/>` +
      `<circle cx="21" cy="-5.6" r="1.1" fill="#1b1b1b"/>`,
    luchs: () => schatten(15) + beine([-8, -5, 6, 9], -13, 13, "#a6804b", 2.6) +
      `<path d="M-11,-18 L-15,-17 L-14,-14 L-11,-15 Z" fill="#1d1d1d"/>` +
      `<ellipse cx="0" cy="-16" rx="12" ry="7" fill="#c9a26b"/>` +
      `<circle cx="-4" cy="-17" r="1" fill="#6d5034"/><circle cx="1" cy="-19" r="1" fill="#6d5034"/><circle cx="4" cy="-15" r="1" fill="#6d5034"/><circle cx="-7" cy="-14" r="1" fill="#6d5034"/>` +
      `<circle cx="13" cy="-23" r="5.6" fill="#c9a26b"/><path d="M8,-21 Q9,-16 13,-17 Q17,-16 18,-21" fill="#efe2c8"/>` +
      `<path d="M10,-27 L10.5,-33 M16,-27 L16.5,-33" stroke="#1d1d1d" stroke-width="1"/>` +
      `<path d="M9,-26 L10.5,-31 L12.5,-27 Z M14,-27 L16.3,-31 L17.5,-26 Z" fill="#c9a26b"/>` + auge(15.5, -23.5),
    wolf: () => schatten(17) +
      `<path d="M-12,-18 C-20,-16 -23,-8 -22,-4 C-19,-6 -16,-10 -12,-13 Z" fill="#77776f"/>` +
      beine([-9, -6, 7, 10], -14, 14, "#6e6e66", 2.4) +
      `<ellipse cx="0" cy="-18" rx="14" ry="7" fill="#8e8e86"/><ellipse cx="4" cy="-14" rx="8" ry="3" fill="#c9c9c0"/>` +
      `<path d="M10,-25 L12,-33 L15,-26 L17,-33 L19,-25 L27,-21 L26,-18 Q18,-16 11,-19 Z" fill="#8e8e86"/>` +
      `<path d="M19,-19 L26,-18 L19,-17.5 Z" fill="#c9c9c0"/><circle cx="27" cy="-21" r="1.1" fill="#1b1b1b"/>` + auge(18.5, -24),
  };

  // Plätze mit „bestem Kandidaten“ verteilen, damit es nach Wald und nicht nach Rauschen aussieht
  function plaetze(baeume, rnd, g) {
    const n = baeume.length, liste = [];
    const versuche = n > 800 ? 1 : 6;
    for (let k = 0; k < n; k++) {
      let best = null, bestD = -1;
      for (let v = 0; v < versuche; v++) {
        const x = 20 + rnd() * (g.W - 40), y = g.HORIZONT + 8 + Math.pow(rnd(), 0.8) * (g.H - g.HORIZONT - g.WIESE);
        let d = Infinity;
        for (const p of liste) d = Math.min(d, Math.hypot(p.x - x, (p.y - y) * 1.6));
        if (d > bestD) { bestD = d; best = { x, y }; }
      }
      liste.push(best);
    }
    const dichte = grenze(Math.sqrt((g.W * (g.H - g.HORIZONT)) / (Math.max(n, 1) * 1500)), 0.4, 1.5);
    const tiefe = (y) => 0.55 + ((y - g.HORIZONT) / (g.H - g.HORIZONT)) * 0.8;
    return liste.map((p) => ({ x: p.x, y: p.y, s: tiefe(p.y) * dichte }));
  }

  // Ausbau nach Lerntagen: je 3 Tage eine Blume auf der Lichtung, je 30 Tage eine Bank
  function ausbau(tage, rnd, g) {
    const farben = ["#f2d640", "#e86a8a", "#ffffff", "#9b7fd1", "#f08a3c"];
    let vorne = "";
    for (let i = 0; i < Math.min(60, Math.floor(tage / 3)); i++) {
      const x = 10 + rnd() * (g.W - 20), y = g.H - g.WIESE + 10 + rnd() * (g.WIESE - 14);
      vorne += `<g transform="translate(${f(x)},${f(y)})"><path d="M0,0 L0,-6" stroke="#4f8a3a" stroke-width=".9"/>` +
        `<circle cx="0" cy="-7" r="2.2" fill="${farben[i % farben.length]}"/><circle cx="0" cy="-7" r=".8" fill="#c9a640"/></g>`;
    }
    for (let i = 0; i < Math.min(4, Math.floor(tage / 30)); i++) {
      const x = (i + 0.5) * g.W / Math.min(4, Math.floor(tage / 30));
      vorne += `<g transform="translate(${f(x)},${f(g.H - g.WIESE + 14)}) scale(1.3)">` +
        `<path d="M-8,0 L-8,-5 M8,0 L8,-5" stroke="#5a3b22" stroke-width="1.2"/><rect x="-9" y="-6" width="18" height="2" fill="#7a5530"/></g>`;
    }
    return { vorne };
  }

  function ausbauText(tage) {
    const blumen = Math.min(60, Math.floor(tage / 3)), baenke = Math.min(4, Math.floor(tage / 30));
    return `${blumen} Blumen auf der Lichtung` + (baenke ? `, ${baenke} ${baenke === 1 ? "Bank" : "Bänke"}` : " (erste Bank ab 30 Lerntagen)");
  }

  window.LW.themen.wald = {
    titel: "Lernwald",
    stufen: {
      spross: "Sprössling – neu", setzling: "Setzling – in der Lernphase", jung: "Junger Baum – unter 21 Tagen",
      baum: "Baum – reif, ab 21 Tagen", alt: "Dicker alter Baum – ab 90 Tagen, kaum vergessen",
      krank: "Kranker Baum – oft vergessen", stumpf: "Baumstumpf – ausgesetzt",
    },
    welk: "Welkes Laub – fällig",
    zustand: { gesund: "gesund", mittel: "wächst", verwildert: "verwildert", wiese: "noch Wiese" },
    boden: {
      gesund: ["#6fa84f", "#5e9744"], mittel: ["#97ad55", "#869c4b"],
      verwildert: ["#b39a5c", "#a0874f"], wiese: ["#bcd27f", "#aac36f"],
    },
    bild: baumSvg,
    belohnung: (id) => (TIERBILD[id] ? TIERBILD[id]() : ""),
    belohnungGroesse: 1.6,
    album: "Tieralbum",
    zaehler: (n, gesamt) => `${n} von ${gesamt} Tieren gesichtet`,
    neu: "Neu im Wald",
    datum: "gesichtet am",
    ab: (n) => `erscheint ab ${n} gesunde${n === 1 ? "m Gebiet" : "n Gebieten"}`,
    erklaerung: "Gesunde Gebiete locken Tiere an: viele reife Bäume, wenig Fälliges. Je mehr Gebiete gesund sind, " +
      "desto seltenere Tiere tauchen auf. Wird ein Gebiet vernachlässigt, ziehen sie wieder ab – im Album bleiben sie.",
    hier: (namen) => `Hier leben: ${namen}.`,
    nochKeine: (min) => `Noch keine Tiere – sie kommen ab ${min} reifen Bäumen.`,
    nurGesund: "Tiere ziehen nur in gesunde Gebiete.",
    leer: "Noch keine Waldgebiete.",
    groesse: () => "",
    plaetze,
    zentriert: false,
    wiegen: true,  // Bäume wiegen sich im Wind (lernwald.js, bewegung.css)
    ausbau,
    ausbauText,
    leuteText: "Wanderer",
    pflasterTitel: "Waldweg",
  };
})();
