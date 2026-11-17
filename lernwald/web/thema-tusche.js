// Lernwald – Anki-Add-on
// Copyright (C) 2026 Basti97420
// Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
// Thema „Tusche-Stadt“: die Stadt, gezeichnet wie ein Kupferstich. Die Zeichnungen kommen aus thema-stadt.js;
// nachbearbeiten() ersetzt jede Füllfarbe nach ihrer Helligkeit durch Papier oder eine von vier Schraffuren,
// Linien werden Tusche. Das Zittern der Striche macht ein SVG-Filter (lernwald.css).
(function () {
  "use strict";
  const STADT = window.LW.themen.stadt;
  if (!STADT) return;

  const TINTE = "#2b2118", PAPIER = "#f4ecd8";

  // Schraffuren von hell nach dunkel; patternUnits=userSpaceOnUse, damit die Linien mit der Zeichnung skaliert werden
  function muster(id, abstand, breite, kreuz, winkel, ohnePapier) {
    const a = abstand;
    return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${a}" height="${a}" patternTransform="rotate(${winkel})">` +
      (ohnePapier ? "" : `<rect width="${a}" height="${a}" fill="${PAPIER}"/>`) +
      `<path d="M0,0 L0,${a}${kreuz ? ` M0,0 L${a},0` : ""}" stroke="${TINTE}" stroke-width="${breite}"/></pattern>`;
  }

  const DEFS =
    muster("lw-t1", 3.6, 0.45, false, 45) +
    muster("lw-t2", 2.4, 0.55, false, 45) +
    muster("lw-t3", 2.4, 0.5, true, 45) +
    muster("lw-t4", 1.6, 0.6, true, 45) +
    muster("lw-schatten", 1.8, 0.5, false, -30, true) +
    muster("lw-himmel", 7, 0.35, false, 90) +           // waagrechte Linien wie im Stich
    muster("lw-boden", 5, 0.4, false, 80) +
    `<filter id="lw-zittern" x="-2%" y="-2%" width="104%" height="104%">` +
    `<feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4" result="rauschen"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="rauschen" scale="2.2" xChannelSelector="R" yChannelSelector="G"/></filter>`;

  function helligkeit(farbe) {
    let h = farbe.slice(1);
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h, 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }

  function fuellung(farbe) {
    const l = helligkeit(farbe);
    return l >= 0.85 ? PAPIER : l >= 0.72 ? "url(#lw-t1)" : l >= 0.55 ? "url(#lw-t2)" : l >= 0.38 ? "url(#lw-t3)" : "url(#lw-t4)";
  }

  function nachbearbeiten(svg) {
    return svg
      .replace(/fill="(#[0-9a-fA-F]{3,6})"/g, (_, c) => `fill="${fuellung(c)}"`)
      .replace(/fill="rgba\([^)]*\)"/g, 'fill="url(#lw-schatten)"')
      .replace(/fill="url\(#himmel\)"/g, 'fill="url(#lw-himmel)"')
      .replace(/fill="url\(#boden\)"/g, 'fill="url(#lw-boden)"')
      .replace(/stroke="(#[0-9a-fA-F]{3,6})"/g, (_, c) => `stroke="${helligkeit(c) > 0.8 ? PAPIER : TINTE}"`);
  }

  window.LW.themen.tusche = Object.assign({}, STADT, {
    titel: "Tusche-Stadt",
    defs: DEFS,
    nachbearbeiten,
    erklaerung: STADT.erklaerung + " Gezeichnet wie ein alter Kupferstich: Je dunkler eine Fläche, desto dichter die Schraffur.",
  });
})();
