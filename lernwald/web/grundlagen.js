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

  // --- Wachstum: gemeinsame Regeln für Stadt und Wald -------------------------
  // Einwohner kommen aus daten.py (je Haus bzw. Baum nach Größe, fällige halb). Daran hängen Größe, Leute und
  // Verkehr; die Mauer bzw. der Waldrand an der Sicherheit (Anteil reifer Karten). Die Themen geben nur Wörter.

  const BEWOHNER = { spross: 0, setzling: 0, jung: 1, baum: 3, alt: 6, krank: 1, stumpf: 0 }, BEWOHNER_HOCH = [12, 25, 50];
  const hausBewohner = (b) => (b[2] ? BEWOHNER_HOCH[b[2] - 1] : BEWOHNER[b[0]] || 0) / (b[1] ? 2 : 1);  // wie daten.bewohner
  const GROESSE_AB = [0, 50, 300, 1000, 3000, 8000];
  const VERKEHR_AB = [50, 300, 600, 1000, 1500, 2700, 3900];  // Wege, Bahn, Schnelle, Große + Bahnhof, 2./3./4. Bahn
  const MAUER_AB = [15, 35, 55, 75, 90];

  // Wie viel unterwegs ist; alles wächst stufenlos mit den Einwohnern
  function verkehr(g) {
    const e = g.einwohner || 0;
    if (g.zustand === "wiese") return { leute: 0, fahrzeuge: 0, autos: 0, trams: 0, zuege: 0, wagen: 0 };
    const fahrzeuge = e >= 50 ? Math.min(40, Math.round(e / 70)) : 0;
    return {
      leute: Math.min(160, Math.round(e / 20)),                                 // gezeichnete Figuren
      fahrzeuge,                                                               // langsame und schnelle zusammen
      autos: Math.round(fahrzeuge * Math.max(0, Math.min(0.9, (e - 600) / 3000))),  // davon schnelle, ab 600
      trams: e >= 1000 ? Math.min(8, 1 + Math.floor((e - 1000) / 600)) : 0,    // große Fahrzeuge
      zuege: e >= 300 ? Math.min(4, 1 + Math.floor((e - 300) / 1200)) : 0,
      wagen: Math.min(8, 3 + Math.floor(e / 1000)),                            // Wagen je Zug
    };
  }
  const mauerStufe = (sicher) => MAUER_AB.filter((ab) => (sicher || 0) >= ab).length;  // 0 = keine

  // Größe und Fortschrittstext eines Themas; w: seine Wörter (siehe thema-stadt.js, thema-wald.js)
  function wachstum(w) {
    const zahl = (n) => Number(n).toLocaleString("de-DE");
    const anzahl = (n, [eins, mehr]) => `${zahl(n)} ${n === 1 ? eins : mehr}`;
    const stufe = (e) => GROESSE_AB.filter((ab) => e >= ab).length - 1;
    return {
      groesse: (g) => (g.zustand === "wiese" ? w.wiese : w.groessen[stufe(g.einwohner || 0)]),
      // Fortschritt und was als Nächstes kommt; nur im Lernwald-Fenster (nicht im Hintergrund)
      lebenText(g) {
        if (g.zustand === "wiese") return "";
        const e = g.einwohner || 0, k = stufe(e), ab = GROESSE_AB[k + 1];
        let s = `<div class="fortschritt">`;
        if (ab) {
          s += `<div class="balken"><span style="width:${Math.round(100 * (e - GROESSE_AB[k]) / (ab - GROESSE_AB[k]))}%"></span></div>` +
            `<b>${zahl(e)} ${w.einwohner}</b> · ${w.groessen[k]} → <b>${w.groessen[k + 1]} ab ${zahl(ab)}</b> (noch ${zahl(ab - e)})`;
        } else {
          s += `<div class="balken"><span style="width:100%"></span></div><b>${zahl(e)} ${w.einwohner}</b> · ${w.groessen[k]}`;
        }
        s += "</div>";
        const v = verkehr(g), u = w.unterwegs, teile = [];
        if (v.fahrzeuge) teile.push(anzahl(v.fahrzeuge - v.autos, u.langsam) + (v.autos ? ", " + anzahl(v.autos, u.schnell) : ""));
        if (v.trams) teile.push(anzahl(v.trams, u.gross));
        if (v.zuege) teile.push(v.zuege === 1 ? `1 ${u.zug[0]} mit ${v.wagen} Wagen` : `${v.zuege} ${u.zug[1]} mit je ${v.wagen} Wagen`);
        if (teile.length) s += `<p>Unterwegs: ${teile.join(" · ")}</p>`;
        const kommt = VERKEHR_AB.map((x, i) => [x, w.verkehr[i]]).filter((x) => e < x[0]).slice(0, 2).map((x) => `${x[1]} ab ${zahl(x[0])}`);
        if (kommt.length) s += `<p>Nächstes: ${kommt.join(" · ")} ${w.einwohner}n</p>`;
        const m = mauerStufe(g.sicherheit);
        s += `<p>${w.mauerName}: ${m ? w.mauer[m - 1] : w.keineMauer} – ${g.sicherheit || 0} % der Karten sitzen sicher` +
          (m < MAUER_AB.length ? ` (${w.mauer[m]} ab ${MAUER_AB[m]} %)` : "") + "</p>";
        if (g.hoch && g.hoch.some((x) => x)) s += `<p>${w.hoch.map((name, i) => `${name}: ${zahl(g.hoch[i])}`).join(" · ")}</p>`;
        const b = g.bald;
        if (b) {
          const bald = [];
          if (b.haus) bald.push(anzahl(b.haus, w.bald.haus));
          if (b.stadthaus) bald.push(anzahl(b.stadthaus, w.bald.stadthaus));
          w.bald.hoch.forEach((woerter, i) => { if (b.hochhaus[i]) bald.push(anzahl(b.hochhaus[i], woerter)); });
          if (bald.length) s += `<p class="bald">Beim nächsten richtigen Wiederholen (geschätzt): ${bald.join(", ")}.</p>`;
        }
        return s;
      },
    };
  }

  window.LW = {
    wachstum,
    verkehr,
    mauerStufe,
    hausBewohner,
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
