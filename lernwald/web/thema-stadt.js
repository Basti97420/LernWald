// Lernwald – Anki-Add-on
// Copyright (C) 2026 Basti97420
// Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
// Thema „Stadt“: jedes Gebiet ist ein Dorf, das zur Stadt wächst; Karten sind Häuser,
// gesunde Gebiete bekommen Sehenswürdigkeiten.
(function () {
  "use strict";
  const { f, wahl, schatten } = window.LW;

  const WAND = ["#efe3c8", "#e8d5b0", "#f3ead8", "#dcc7a4", "#eadbc8", "#d9c3b0"];
  const DACH = ["#b5462f", "#a33d2a", "#8c4a32", "#c0623a", "#6b5f5a"];
  const WAND_W = ["#cdc4b0", "#c2b8a4", "#bdb3a0"];
  const DACH_W = ["#8d7d6a", "#7d6f60", "#857565"];
  const GLAS = "#6c8aa3", GLAS_W = "#4d4a45", HOLZ = "#6b4a2b", BALKEN = "#5a3b22";
  const STEIN = "#b9b3a8", STEIN_D = "#9a948a", SCHIEFER = "#4f5d6b", GOLD = "#c9a640";

  // --- Bausteine ------------------------------------------------------------

  const rect = (x, y, w, h, fill, extra) =>
    `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}"${extra || ""}/>`;

  function fenster(x, y, w, h, glas) {  // x, y = obere linke Ecke
    return rect(x, y, w, h, glas, ` stroke="#5a4a3a" stroke-width=".4"`) +
      `<path d="M${f(x + w / 2)},${f(y)} L${f(x + w / 2)},${f(y + h)}" stroke="#f3eee2" stroke-width=".4"/>`;
  }

  function bogen(x, unten, w, h, farbe) {  // Rundbogen: x links, unten = y der Unterkante
    const r = w / 2;
    return `<path d="M${f(x)},${f(unten)} L${f(x)},${f(unten - h + r)} A${f(r)},${f(r)} 0 0 1 ${f(x + w)},${f(unten - h + r)} L${f(x + w)},${f(unten)} Z" fill="${farbe}"/>`;
  }

  function zinnen(x, y, w, farbe) {  // Zinnen auf einer Mauerkrone bei Höhe y
    let s = "";
    for (let i = x; i + 3 <= x + w + 0.01; i += 5) s += rect(i, y - 3, 3, 3, farbe);
    return s;
  }

  function spitze(x, y, w, h, farbe) {  // spitzes Dach über [x, x+w] ab Höhe y
    return `<path d="M${f(x)},${f(y)} L${f(x + w / 2)},${f(y - h)} L${f(x + w)},${f(y)} Z" fill="${farbe}"/>`;
  }

  function kreuz(x, y, farbe) {
    return `<path d="M${f(x)},${f(y)} L${f(x)},${f(y - 6)} M${f(x - 2)},${f(y - 4)} L${f(x + 2)},${f(y - 4)}" stroke="${farbe || GOLD}" stroke-width="1"/>`;
  }

  function uhr(x, y, r) {
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#f8f4ea" stroke="#3d342b" stroke-width=".6"/>` +
      `<path d="M${f(x)},${f(y)} L${f(x)},${f(y - r * 0.7)} M${f(x)},${f(y)} L${f(x + r * 0.5)},${f(y)}" stroke="#3d342b" stroke-width=".7"/>`;
  }

  function fahne(x, y, farbe) {
    return `<path d="M${f(x)},${f(y)} L${f(x)},${f(y - 12)}" stroke="#5a4a3a" stroke-width=".8"/>` +
      `<path d="M${f(x)},${f(y - 12)} L${f(x + 8)},${f(y - 10)} L${f(x)},${f(y - 8)} Z" fill="${farbe || "#c8322b"}"/>`;
  }

  function unkraut(xs) {
    return `<path d="${xs.map((x) => `M${x},0 l-1,-3 M${x},0 l0,-4 M${x},0 l1.2,-3`).join(" ")}" stroke="#7d8a4a" stroke-width=".7" fill="none"/>`;
  }

  function treppengiebel(x, y, w, stufen, farbe) {  // Stufengiebel über [x, x+w] ab Höhe y
    const sb = w / (2 * stufen + 1), sh = 4;
    let d = `M${f(x)},${f(y)}`;
    for (let i = 0; i < stufen; i++) d += ` L${f(x + i * sb)},${f(y - (i + 1) * sh)} L${f(x + (i + 1) * sb)},${f(y - (i + 1) * sh)}`;
    d += ` L${f(x + (stufen + 1) * sb)},${f(y - stufen * sh - sh)}`;
    for (let i = stufen; i > 0; i--) d += ` L${f(x + w - i * sb)},${f(y - i * sh)} L${f(x + w - (i - 1) * sb)},${f(y - i * sh)}`;
    return `<path d="${d} L${f(x + w)},${f(y)} Z" fill="${farbe}"/>`;
  }

  // Haus mit Wand, Fenstern, Tür und Dach; o: w, h, dachH, giebel, fachwerk, schornstein, welk
  function haus(r, o) {
    const w = o.w, h = o.h, dh = o.dachH;
    const wand = o.wand || wahl(r, o.welk ? WAND_W : WAND);
    const dach = wahl(r, o.welk ? DACH_W : DACH);
    const glas = o.welk ? GLAS_W : GLAS;
    let s = schatten(w * 0.62);
    if (o.schornstein) s += rect(w * 0.18, -h - dh * 0.9, 3, dh * 0.6, "#8a5a44");
    s += rect(-w / 2, -h, w, h, wand);
    const stock = Math.max(1, Math.round(h / 11)), sh = h / stock;
    if (o.fachwerk) {
      let d = "";
      for (let i = 0; i <= stock; i++) d += `M${f(-w / 2)},${f(-i * sh)} L${f(w / 2)},${f(-i * sh)} `;
      const felder = Math.max(2, Math.round(w / 7));
      for (let i = 0; i <= felder; i++) d += `M${f(-w / 2 + i * w / felder)},0 L${f(-w / 2 + i * w / felder)},${f(-h)} `;
      for (let i = 0; i < stock; i++) d += `M${f(-w / 2)},${f(-i * sh)} L${f(-w / 2 + w / felder)},${f(-(i + 1) * sh)} M${f(w / 2)},${f(-i * sh)} L${f(w / 2 - w / felder)},${f(-(i + 1) * sh)} `;
      s += `<path d="${d}" stroke="${BALKEN}" stroke-width="1" fill="none"/>`;
    }
    const spalten = Math.max(1, Math.floor(w / 8)), fw = 3.4, fh = Math.min(4.6, sh * 0.5);
    for (let i = 0; i < stock; i++) {
      for (let k = 0; k < spalten; k++) {
        const x = -w / 2 + (k + 0.5) * w / spalten;
        if (i === 0 && k === Math.floor(spalten / 2)) continue;  // Platz für die Tür
        s += fenster(x - fw / 2, -i * sh - sh / 2 - fh / 2, fw, fh, glas);
      }
    }
    const tx = -w / 2 + (Math.floor(spalten / 2) + 0.5) * w / spalten;
    s += rect(tx - 2.4, -Math.min(8, sh * 0.8), 4.8, Math.min(8, sh * 0.8), HOLZ);
    if (o.giebel) s += spitze(-w / 2 - 1.5, -h, w + 3, dh, dach);
    else s += `<path d="M${f(-w / 2 - 2.5)},${f(-h)} L${f(-w / 2 + dh * 0.6)},${f(-h - dh)} L${f(w / 2 - dh * 0.6)},${f(-h - dh)} L${f(w / 2 + 2.5)},${f(-h)} Z" fill="${dach}"/>`;
    if (o.welk) s += unkraut([f(-w / 2 + 1), f(w / 2 - 2)]);
    return s;
  }

  // --- Stufen einer Karte ---------------------------------------------------

  function hausSvg(stufe, welk, r) {
    switch (stufe) {
      case "spross":  // Bauplatz mit Pflöcken und Schnur
        return `<ellipse cx="0" cy="0" rx="10" ry="3" fill="${welk ? "#a79a82" : "#b08d5e"}"/>` +
          `<path d="M-8,0 L-8,-6 M8,0 L8,-6 M-5,-2.4 L-5,-8 M5,-2.4 L5,-8" stroke="#8a6a45" stroke-width="1.1"/>` +
          `<path d="M-8,-5 L-5,-7 L5,-7 L8,-5 Z" stroke="#f3eee2" stroke-width=".5" fill="none"/>` +
          (welk ? unkraut([-3, 2, 6]) : "");
      case "setzling":  // Baustelle: Fundament und Holzgerüst
        return schatten(12) + rect(-10, -2, 20, 2, STEIN) +
          `<path d="M-9,-2 L-9,-15 M0,-2 L0,-15 M9,-2 L9,-15 M-9,-15 L9,-15 M-9,-8.5 L9,-8.5 M-9,-15 L0,-23 L9,-15 M-9,-2 L0,-8.5 M0,-8.5 L9,-15"` +
          ` stroke="${welk ? "#8d7d6a" : "#b08a5a"}" stroke-width="1.3" fill="none"/>` +
          rect(11, -3, 4, 1.5, "#a8553a") + rect(12, -4.5, 4, 1.5, "#b5603f") + rect(11.5, -1.5, 4.5, 1.5, "#9c4c34") +
          (welk ? unkraut([-6, 5]) : "");
      case "jung": {  // Hütte
        const holz = r() < 0.45;
        return haus(r, { w: 14, h: 10, dachH: 8, giebel: true, welk, wand: holz ? (welk ? "#9c8a72" : "#b9925e") : null });
      }
      case "baum":  // Haus
        return haus(r, {
          w: 20 + r() * 8, h: 18 + r() * 5, dachH: 11, giebel: r() < 0.4, fachwerk: r() < 0.35,
          schornstein: r() < 0.5, welk,
        });
      case "alt": {
        const v = r();
        if (v < 0.4) {  // Bürgerhaus mit Stufengiebel
          const wand = wahl(r, welk ? WAND_W : WAND);
          return schatten(13) + rect(-10, -36, 20, 36, wand) + treppengiebel(-10, -36, 20, 3, wand) +
            `<circle cx="0" cy="-41" r="2" fill="${welk ? GLAS_W : GLAS}"/>` +
            [-5.5, 2].map((x) => [-31, -22, -13].map((y) => fenster(x, y, 3.6, 5, welk ? GLAS_W : GLAS)).join("")).join("") +
            rect(-2.6, -8, 5.2, 8, HOLZ) + (welk ? unkraut([-8, 8]) : "");
        }
        if (v < 0.7) {  // Turm mit spitzem Dach
          return schatten(10) + rect(-7, -52, 14, 52, welk ? "#bdb3a0" : "#ddd2bc") +
            [-44, -34, -24].map((y) => fenster(-1.8, y, 3.6, 5.5, welk ? GLAS_W : GLAS)).join("") +
            bogen(-2.6, 0, 5.2, 9, HOLZ) + spitze(-8.5, -52, 17, 24, welk ? DACH_W[0] : SCHIEFER) +
            `<circle cx="0" cy="-77" r="1.3" fill="${GOLD}"/>` + (welk ? unkraut([-5, 5]) : "");
        }
        return haus(r, { w: 32, h: 32, dachH: 16, fachwerk: true, schornstein: true, welk });  // großes Fachwerkhaus
      }
      case "krank":  // baufällig: schief, Loch im Dach, vernagelte Fenster
        return schatten(12) + `<g transform="rotate(-3)">` + rect(-10, -16, 20, 16, "#bdb3a0") +
          `<path d="M-11.5,-16 L0,-27 L11.5,-16 Z" fill="#7d6f60"/><path d="M-2,-21 L1.5,-24.5 L4.5,-20.5 L1,-18.5 Z" fill="#3b3128"/>` +
          rect(-7, -12, 4, 5, GLAS_W) + rect(3, -12, 4, 5, GLAS_W) +
          `<path d="M-7.5,-12.5 L-2.5,-6.5 M-2.5,-12.5 L-7.5,-6.5 M2.5,-11 L7.5,-8" stroke="#7a5a3a" stroke-width="1.1"/>` +
          rect(-2, -7, 4, 7, "#5a4632") + `<path d="M8,-15 L6,-11 L8,-8 L6,-4" stroke="#6b6358" stroke-width=".6" fill="none"/>` +
          `</g>` + unkraut([-9, -4, 9]);
      case "stumpf":  // Ruine
        return schatten(12) +
          `<path d="M-11,0 L-11,-13 L-9,-15 L-7,-11 L-5,-12 L-4,-7 L-1,-8 L1,-4 L4,-6 L6,-9 L8,-8 L9,-12 L11,-10 L11,0 Z" fill="#aaa397"/>` +
          `<path d="M-11,-4 L11,-4 M-11,-8 L-4,-8 M-6,-4 L-6,0 M2,-4 L2,0 M-9,-8 L-9,-4" stroke="#8d877c" stroke-width=".5"/>` +
          bogen(5, -1, 3, 4, "#5d574e") +
          `<circle cx="-13" cy="-1" r="1.5" fill="#9d968a"/><circle cx="13.5" cy="-1" r="1.2" fill="#9d968a"/>`;
    }
    return "";
  }

  // --- Sehenswürdigkeiten ---------------------------------------------------

  const BAU = {
    brunnen: () => schatten(18) + rect(-15, -9, 30, 9, STEIN) +
      `<path d="M-15,-4.5 L15,-4.5 M-8,-9 L-8,-4.5 M4,-9 L4,-4.5 M-2,-4.5 L-2,0 M10,-4.5 L10,0" stroke="${STEIN_D}" stroke-width=".5"/>` +
      `<ellipse cx="0" cy="-9" rx="15" ry="3.5" fill="#cfc9be"/><ellipse cx="0" cy="-9" rx="12.5" ry="2.5" fill="#7fb6d9"/>` +
      rect(-1.6, -24, 3.2, 15, "#a9a398") + `<path d="M-6,-22 Q0,-17 6,-22 Z" fill="${STEIN}"/>` +
      `<path d="M0,-26 Q-5,-31 -9,-11 M0,-26 Q5,-31 9,-11" stroke="#8cc3e6" stroke-width="1.2" fill="none"/>` +
      `<circle cx="0" cy="-25" r="1.6" fill="#a9a398"/>`,
    marktstand: () => {
      let markise = "";
      for (let i = 0; i < 6; i++) {
        const x = -17 + i * 34 / 6;
        markise += `<path d="M${f(x)},-19 L${f(x + 1)},-25 L${f(x + 6.67)},-25 L${f(x + 5.67)},-19 Z" fill="${i % 2 ? "#f4efe6" : "#c8322b"}"/>`;
        markise += `<path d="M${f(x)},-19 Q${f(x + 2.83)},-16 ${f(x + 5.67)},-19 Z" fill="${i % 2 ? "#f4efe6" : "#c8322b"}"/>`;
      }
      return schatten(18) + `<path d="M-14,0 L-14,-24 M14,0 L14,-24" stroke="${HOLZ}" stroke-width="1.6"/>` +
        rect(-14, -8, 28, 8, "#a8743f") + rect(-15, -11, 30, 3, "#8a5a34") +
        `<path d="M-14,-4 L14,-4" stroke="#8a5a34" stroke-width=".5"/>` +
        [[-11, "#d2232a"], [-8, "#c8322b"], [-5, "#e08a1e"], [-1, "#6aa84f"], [2, "#6aa84f"], [6, "#e8c547"], [9, "#e08a1e"], [12, "#d2232a"]]
          .map(([x, c]) => `<circle cx="${x}" cy="-12.6" r="1.7" fill="${c}"/>`).join("") + markise;
    },
    maibaum: () => {
      let streifen = "";
      for (let y = -4; y > -70; y -= 6) streifen += `<path d="M-1.3,${y} L1.3,${y - 4}" stroke="#2f6fb3" stroke-width="1.5"/>`;
      return schatten(9) + `<ellipse cx="0" cy="-1" rx="5" ry="1.6" fill="${STEIN}"/>` + rect(-1.3, -78, 2.6, 78, "#f4f1ea") + streifen +
        `<path d="M-9,-45 L9,-45 M-9,-30 L9,-30" stroke="#8a5a34" stroke-width=".8"/>` +
        [[-9, -44], [4, -44], [-9, -29], [4, -29]].map(([x, y]) => rect(x, y, 5, 4, "#e8d5b0", ` stroke="#8a5a34" stroke-width=".4"`)).join("") +
        `<path d="M-9,-66 q-1,8 1,14 M9,-66 q1,8 -1,14" stroke="#d2232a" stroke-width=".9" fill="none"/>` +
        `<path d="M-4,-64 q0,8 -2,12 M4,-64 q0,8 2,12" stroke="#2f6fb3" stroke-width=".9" fill="none"/>` +
        `<ellipse cx="0" cy="-66" rx="10" ry="2.6" fill="none" stroke="#3e8e41" stroke-width="2.2"/>` +
        `<circle cx="0" cy="-84" r="5" fill="#3e8e41"/><circle cx="-3" cy="-81" r="3.5" fill="#4f9d48"/><circle cx="3" cy="-81" r="3.5" fill="#2f7a36"/>`;
    },
    windmuehle: () => {
      let fluegel = "";
      for (let k = 0; k < 4; k++) {
        fluegel += `<g transform="rotate(${20 + k * 90} 0 -40)">` + rect(-1, -72, 2, 32, HOLZ) +
          rect(1, -70, 7, 26, "#f4efe6", ` stroke="${HOLZ}" stroke-width=".6"`) +
          `<path d="M1,-63 L8,-63 M1,-56 L8,-56 M1,-49 L8,-49" stroke="${HOLZ}" stroke-width=".5"/></g>`;
      }
      return schatten(16) + `<path d="M-11,0 L-7,-40 L7,-40 L11,0 Z" fill="#efe6d2"/>` +
        `<path d="M-9,-14 L9,-14" stroke="#cfc4ad" stroke-width=".8"/>` +
        bogen(-2.8, 0, 5.6, 9, HOLZ) + fenster(-1.6, -30, 3.2, 4.5, GLAS) +
        `<path d="M-8.5,-40 Q0,-50 8.5,-40 Z" fill="#7a4a32"/>` + fluegel + `<circle cx="0" cy="-40" r="2" fill="${BALKEN}"/>`;
    },
    kapelle: () => schatten(20) + rect(-8, -16, 22, 16, "#f1ead9") +
      `<path d="M-9,-16 L-4,-25 L13,-25 L15.5,-16 Z" fill="#a33d2a"/>` +
      [-2, 3, 8].map((x) => bogen(x, -5, 3, 7, GLAS)).join("") +
      rect(-15, -30, 9, 30, "#e8dfcc") + spitze(-16, -30, 11, 16, "#a33d2a") + kreuz(-10.5, -46) +
      bogen(-12.8, 0, 4.6, 9, HOLZ) + `<circle cx="-10.5" cy="-23" r="1.6" fill="${GLAS}"/>`,
    rathaus: () => schatten(32) + rect(-26, -28, 52, 28, "#e9d6b5") +
      `<path d="M-28,-28 L-22,-40 L22,-40 L28,-28 Z" fill="#a33d2a"/>` +
      treppengiebel(-10, -28, 20, 4, "#e2cda8") + uhr(0, -36, 3.6) +
      [-22, -15, -8, 4, 11, 18].map((x) => fenster(x, -24, 4, 5.5, GLAS)).join("") +
      [-22, -15, 11, 18].map((x) => bogen(x, -2, 4, 9, "#5a4632")).join("") +
      bogen(-4, 0, 8, 12, HOLZ) + rect(-7, -1, 14, 1.2, STEIN) + fahne(0, -48, "#d9b434"),
    uhrturm: () => schatten(11) + rect(-7, -60, 14, 60, "#d8cdb6") +
      `<path d="M-7,-15 L7,-15 M-7,-30 L7,-30 M-7,-42 L7,-42" stroke="#c2b69d" stroke-width=".6"/>` +
      fenster(-1.8, -38, 3.6, 6, GLAS) + fenster(-1.8, -26, 3.6, 6, GLAS) + bogen(-2.6, 0, 5.2, 9, HOLZ) +
      uhr(0, -51, 5) + `<path d="M-8.5,-60 Q-8,-66 0,-68 Q8,-66 8.5,-60 Z" fill="#4f7b6a"/>` +
      spitze(-3, -67, 6, 13, "#4f7b6a") + `<circle cx="0" cy="-81" r="1.3" fill="${GOLD}"/>`,
    stadttor: () => schatten(32) + rect(-14, -30, 28, 30, "#c2b8a6") + zinnen(-14, -30, 28, "#c2b8a6") +
      bogen(-7, 0, 14, 21, "#3d342b") +
      `<path d="M-5,0 L-5,-16 M-2,0 L-2,-19 M1,0 L1,-19 M4,0 L4,-17 M-7,-6 L7,-6 M-7,-12 L7,-12" stroke="#7a6a50" stroke-width=".8"/>` +
      [-28, 13].map((x) => rect(x, -46, 15, 46, "#b9ae9a") + zinnen(x, -46, 15, "#b9ae9a") +
        rect(x + 6.5, -38, 2, 6, "#3d342b") + rect(x + 6.5, -22, 2, 6, "#3d342b") +
        spitze(x - 1.5, -49, 18, 15, "#a33d2a")).join("") + fahne(-20.5, -64) + fahne(20.5, -64),
    kirche: () => schatten(36) + rect(-6, -28, 40, 28, "#eee5d2") +
      `<path d="M-7,-28 L-2,-40 L31,-40 L35.5,-28 Z" fill="${SCHIEFER}"/>` +
      [2, 12, 22].map((x) => bogen(x, -6, 5, 15, GLAS)).join("") +
      rect(-20, -60, 15, 60, "#e6dcc6") + spitze(-21.5, -60, 18, 34, SCHIEFER) + kreuz(-12.5, -94) +
      uhr(-12.5, -50, 3.6) + bogen(-15, -36, 5, 8, "#3d342b") + bogen(-16, 0, 7, 12, HOLZ),
    burg: () => `<path d="M-50,0 Q-32,-15 0,-17 Q32,-15 50,0 Z" fill="#7aa05a"/>` +
      rect(-34, -38, 68, 24, "#b5ab98") + zinnen(-34, -38, 68, "#b5ab98") +
      rect(-10, -68, 20, 54, "#a9a08d") + zinnen(-10, -68, 20, "#a9a08d") +
      rect(-1.5, -60, 3, 7, "#3d342b") + rect(-1.5, -46, 3, 7, "#3d342b") + fahne(0, -71) +
      [-42, 28].map((x) => rect(x, -52, 14, 38, "#bcb29f") + spitze(x - 2, -52, 18, 17, "#a33d2a") +
        rect(x + 6, -44, 2, 6, "#3d342b")).join("") +
      bogen(-5, -14, 10, 13, "#3d342b") +
      `<path d="M-34,-26 L-10,-26 M10,-26 L34,-26" stroke="#9f9584" stroke-width=".6"/>`,
    dom: () => {
      const turm = (x) => rect(x, -88, 15, 88, "#d4c29e") +
        [-78, -60, -42].map((y) => bogen(x + 5, y, 5, 13, "#5b6c7d")).join("") +
        `<path d="M${x},-88 L${x + 7.5},-130 L${x + 15},-88 Z" fill="#c9b690"/>` +
        `<path d="M${x + 2},-96 L${x + 13},-96 M${x + 3.5},-106 L${x + 11.5},-106" stroke="#a8956f" stroke-width=".7"/>` +
        spitze(x - 1, -88, 4, 8, "#c9b690") + spitze(x + 12, -88, 4, 8, "#c9b690") + kreuz(x + 7.5, -130);
      return schatten(42) + rect(-18, -52, 36, 52, "#dccbaa") + `<path d="M-18,-52 L0,-68 L18,-52 Z" fill="#cdbb96"/>` +
        `<circle cx="0" cy="-41" r="7" fill="#5b6c7d" stroke="#cdbb96" stroke-width="1.2"/>` +
        `<path d="M-7,-41 L7,-41 M0,-48 L0,-34 M-5,-46 L5,-36 M5,-46 L-5,-36" stroke="#cdbb96" stroke-width=".6"/>` +
        bogen(-7, 0, 14, 24, "#4a3a2c") + bogen(-5, -1, 10, 20, HOLZ) + turm(-33) + turm(18);
    },
    schloss: () => {
      const fluegel = (x) => rect(x, -28, 34, 28, "#e9dfcc") +
        `<path d="M${x - 1.5},-28 L${x + 3},-36 L${x + 31},-36 L${x + 35.5},-28 Z" fill="#5d7f9a"/>` +
        [-22, -12].map((y) => [4, 11, 18, 25].map((dx) => fenster(x + dx, y, 3.6, 5.5, GLAS)).join("")).join("");
      const pavillon = (x) => rect(x, -38, 12, 38, "#efe6d6") + spitze(x - 1, -38, 14, 14, "#5d7f9a") +
        `<circle cx="${x + 6}" cy="-53" r="1.2" fill="${GOLD}"/>` + fenster(x + 4, -30, 4, 6, GLAS) + fenster(x + 4, -18, 4, 6, GLAS);
      return schatten(62) + fluegel(-58) + fluegel(24) + pavillon(-66) + pavillon(54) +
        rect(-24, -42, 48, 42, "#f3ecdf") +
        [-34, -22, -10].map((y) => [-19, -11, -3, 5, 13].map((x) => fenster(x + 0.2, y, 3.6, 6, GLAS)).join("")).join("") +
        `<path d="M-14,-42 Q-15,-62 0,-65 Q15,-62 14,-42 Z" fill="#5d7f9a"/>` + rect(-2, -71, 4, 7, "#efe6d6") +
        spitze(-2.5, -71, 5, 6, "#5d7f9a") + `<circle cx="0" cy="-78" r="1.3" fill="${GOLD}"/>` +
        bogen(-4, 0, 8, 11, HOLZ) + rect(-10, -1, 20, 1.2, STEIN) + fahne(0, -79, "#2f6fb3");
    },
  };

  // --- Wachstum: Verkehr und Einwohner nach reifen Häusern, Mauer nach Sicherheit (gezeichnet in iso-stadt.js)

  // Meilensteine für den Text: ab so vielen reifen Häusern
  const VERKEHR = [
    [15, "Straßen mit Kutschen"], [60, "Eisenbahn"], [120, "erste Autos"], [150, "Straßenbahn und Bahnhof"],
    [180, "zweiter Zug"], [300, "dritter Zug"], [420, "vierter Zug"],
  ];

  // Wie viel unterwegs ist; alles wächst stufenlos mit der Zahl reifer Häuser
  function verkehr(g) {
    const r = g.reif || 0;
    if (g.zustand === "wiese") return { einwohner: 0, fahrzeuge: 0, autos: 0, trams: 0, zuege: 0, wagen: 0 };
    const einwohner = Math.min(160, Math.round(Math.sqrt(r) * 5));
    const fahrzeuge = r >= 15 ? Math.min(40, Math.round(r / 12)) : 0;
    return {
      einwohner: g.zustand === "verwildert" ? Math.round(einwohner / 3) : einwohner,
      fahrzeuge,                                                               // Kutschen und Autos zusammen
      autos: Math.round(fahrzeuge * Math.max(0, Math.min(0.9, (r - 120) / 300))),  // ab 120 erste Autos
      trams: r >= 150 ? Math.min(8, 1 + Math.floor((r - 150) / 80)) : 0,
      zuege: r >= 60 ? Math.min(4, 1 + Math.floor((r - 60) / 120)) : 0,
      wagen: Math.min(8, 3 + Math.floor(r / 120)),                             // Wagen je Zug
    };
  }

  // Stadtmauer nach der Sicherheit des Gebiets (Anteil reifer Karten, 0–100)
  const MAUER = [
    [15, "Holzpalisade"], [35, "niedrige Steinmauer"], [55, "Mauer mit Zinnen und Ecktürmen"],
    [75, "hohe Mauer mit Tortürmen"], [90, "doppelter Mauerring mit Wassergraben"],
  ];
  const mauerStufe = (sicher) => MAUER.filter((m) => (sicher || 0) >= m[0]).length;  // 0 = keine Mauer

  function lebenText(g) {
    if (g.zustand === "wiese") return "";
    const v = verkehr(g), teile = [`${v.einwohner} Einwohner`];
    const zahl = (n, eins, mehr) => `${n} ${n === 1 ? eins : mehr}`;
    if (v.fahrzeuge) teile.push(zahl(v.fahrzeuge - v.autos, "Kutsche", "Kutschen") + (v.autos ? ", " + zahl(v.autos, "Auto", "Autos") : ""));
    if (v.trams) teile.push(zahl(v.trams, "Straßenbahn", "Straßenbahnen"));
    if (v.zuege) teile.push(v.zuege === 1 ? `1 Zug mit ${v.wagen} Wagen` : `${v.zuege} Züge mit je ${v.wagen} Wagen`);
    const naechstes = VERKEHR.find((x) => g.reif < x[0]);
    const m = mauerStufe(g.sicherheit), mNaechste = MAUER[m];
    return teile.join(" · ") + (naechstes ? ` (${naechstes[1]} ab ${naechstes[0]} reifen Häusern)` : "") +
      `<br>Stadtmauer: ${m ? MAUER[m - 1][1] : "keine"} – ${g.sicherheit || 0} % der Karten sitzen sicher` +
      (mNaechste ? ` (${mNaechste[1]} ab ${mNaechste[0]} %)` : "") +
      (g.hoch && g.hoch.some((x) => x) ? `<br>Hochhäuser: ${g.hoch[0]} · hohe Hochhäuser: ${g.hoch[1]} · Wolkenkratzer: ${g.hoch[2]}` : "");
  }

  function kartenDeko(R) {  // Wege durch das Dorf auf der Gesamtkarte
    return `<path d="M${f(-R * 0.95)},${f(R * 0.12)} Q0,${f(-R * 0.12)} ${f(R * 0.95)},${f(-R * 0.02)} M${f(-R * 0.1)},${f(-R * 0.8)} Q${f(R * 0.12)},0 ${f(-R * 0.02)},${f(R * 0.8)}"` +
      ` stroke="#ddd2b4" stroke-width="${f(Math.max(4, R * 0.06))}" fill="none" stroke-linecap="round"/>`;
  }

  // --- Ausbau nach Lerntagen ------------------------------------------------
  // Jeder Lerntag im Gebiet baut mit: Laternen (je 7 Tage), Bänke (je 30), ab 200 ein Aquädukt
  // (gezeichnet in iso-stadt.js). Die Stadtmauer hängt an der Sicherheit, siehe oben.

  function laterne() {
    return `<path d="M0,0 L0,-26" stroke="#3d342b" stroke-width="1.4"/><path d="M-3,-26 L3,-26 L2,-32 L-2,-32 Z" fill="#f2d68a" class="lw-licht"/>` +
      `<path d="M-3.5,-32 L0,-35 L3.5,-32 Z" fill="#3d342b"/>`;
  }

  function bank() {
    return `<path d="M-8,0 L-8,-4 M8,0 L8,-4 M-8,-4 L-8,-9 M8,-4 L8,-9" stroke="${BALKEN}" stroke-width="1.1"/>` +
      rect(-9, -5, 18, 1.6, HOLZ) + rect(-9, -9.5, 18, 1.6, HOLZ);
  }

  function ausbauText(tage) {
    const teile = [];
    if (tage >= 7) teile.push(`${Math.min(16, Math.floor(tage / 7))} Laternen`);
    if (tage >= 30) teile.push(`${Math.min(6, Math.floor(tage / 30))} Bänke`);
    if (tage >= 200) teile.push("Aquädukt");
    const naechstes = tage < 7 ? "erste Laterne ab 7" : tage < 30 ? "erste Bank ab 30" : tage < 200 ? "Aquädukt ab 200" : "";
    return (teile.length ? "gebaut: " + teile.join(", ") : "noch nichts gebaut") + (naechstes ? ` (${naechstes} Lerntagen)` : "");
  }

  window.LW.themen.stadt = {
    titel: "Lernstadt",
    stufen: {
      spross: "Bauplatz – neu", setzling: "Baustelle – in der Lernphase", jung: "Hütte – unter 21 Tagen",
      baum: "Haus – reif, ab 21 Tagen", alt: "Stadthaus oder Turm – ab 90 Tagen, kaum vergessen",
      krank: "Baufälliges Haus – oft vergessen", stumpf: "Ruine – ausgesetzt",
    },
    welk: "Ungepflegt, Unkraut – fällig",
    zustand: { gesund: "lebendig", mittel: "wächst", verwildert: "verfällt", wiese: "noch Bauland" },
    boden: {
      gesund: ["#a9c47a", "#94b066"], mittel: ["#bcc283", "#a8ae70"],
      verwildert: ["#b8aa88", "#a39574"], wiese: ["#d8cfa4", "#c6bb8e"],
    },
    bild: hausSvg,
    belohnung: (id) => (BAU[id] ? BAU[id]() : ""),
    belohnungGroesse: 1.5,
    album: "Sehenswürdigkeiten",
    zaehler: (n, gesamt) => `${n} von ${gesamt} Sehenswürdigkeiten gebaut`,
    neu: "Neu gebaut",
    datum: "gebaut am",
    ab: (n) => `entsteht ab ${n} lebendige${n === 1 ? "m Gebiet" : "n Gebieten"}`,
    erklaerung: "Lebendige Gebiete bekommen Sehenswürdigkeiten: viele reife Häuser, wenig Fälliges. Je mehr Gebiete " +
      "lebendig sind, desto prächtiger wird gebaut – vom Dorfbrunnen bis zum Schloss. Verfällt ein Gebiet, " +
      "verschwinden sie dort wieder – in der Sammlung bleiben sie.",
    hier: (namen) => `Hier steht: ${namen}.`,
    nochKeine: (min) => `Noch keine Sehenswürdigkeiten – sie entstehen ab ${min} reifen Häusern.`,
    nurGesund: "Sehenswürdigkeiten entstehen nur in lebendigen Gebieten.",
    leer: "Noch keine Dörfer.",
    groesse: (g) => {
      if (g.zustand === "wiese") return "Bauland";
      const reif = g.zahlen.baum + g.zahlen.alt;
      return reif < 15 ? "Weiler" : reif < 60 ? "Dorf" : reif < 150 ? "Kleinstadt" : reif < 300 ? "Stadt" : "Großstadt";
    },
    lebenText,
    kartenDeko,
    zentriert: true,
    ausbauText,
    // für die Ansicht von oben (iso-stadt.js, setzt szene)
    teile: { WAND, DACH, WAND_W, DACH_W, GLAS, STEIN, GOLD, verkehr, mauerStufe, laterne, bank },
    leuteText: "Bewohner",
    pflasterTitel: "Pflasterstraße",
  };
})();
