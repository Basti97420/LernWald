// Lernwald – Anki-Add-on
// Copyright (C) 2026 Basti97420
// Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
// Gemeinsame Hilfen für Themen und Ansichten. Themen tragen sich in LW.themen ein.
(function () {
  "use strict";

  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  function zufall(seed) {  // mulberry32: gleiche Saat, gleiches Bild
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const f = (x) => Math.round(x * 10) / 10;

  // Reihenfolge der Stufen von groß nach klein, z. B. damit Türme in die Stadtmitte kommen
  const RANG = { alt: 0, baum: 1, jung: 2, krank: 3, setzling: 4, spross: 5, stumpf: 6 };

  window.LW = {
    themen: {},
    hash,
    zufall,
    f,
    RANG,
    wahl: (r, liste) => liste[Math.floor(r() * liste.length)],
    grenze: (x, a, b) => Math.max(a, Math.min(b, x)),
    esc: (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])),
    schatten: (rx) => `<ellipse cx="0" cy="0" rx="${f(rx)}" ry="${f(rx * 0.22)}" fill="rgba(0,0,0,.18)"/>`,
    auge: (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r || 0.9}" fill="#1b1b1b"/>`,
  };
})();
