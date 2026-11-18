// Lernwald – Anki-Add-on
// Copyright (C) 2026 Basti97420
// Lizenz: GNU AGPL-3.0-or-later, siehe LICENSE
// Ansicht von oben (isometrisch) für Stadt und Wald: Ein Gebiet wächst vom Platz in der Mitte aus in alle
// Richtungen. Häuser bzw. Bäume stehen auf Parzellen zwischen einem Wegegitter, die größten in der Mitte.
// Leute, Fahrzeuge, Bahn und Mauer bzw. Waldrand wachsen nach den Regeln in grundlagen.js (LW.verkehr,
// LW.mauerStufe). Was gezeichnet wird, liefert das Thema als Stil (iso-stadt.js, iso-wald.js).
// Die Bewegung steht in bewegung.css.
(function () {
  "use strict";
  const { f, wahl, RANG } = window.LW;

  const KW = 36, KH = 18;  // eine Kachel auf dem Bildschirm: Breite und Höhe
  const P = (i, j, z) => [(i - j) * KW / 2, (i + j) * KH / 2 - (z || 0)];
  const pt = (p) => f(p[0]) + "," + f(p[1]);
  const poly = (punkte, fill, extra) => `<path d="M${punkte.map(pt).join(" L")} Z" fill="${fill}"${extra || ""}/>`;
  const istWeg = (k) => ((k % 3) + 3) % 3 === 0;  // jede dritte Zeile und Spalte ist Straße bzw. Weg
  const PLATZ = 2;  // Platz in der Mitte: Kacheln -2 … 2 in beiden Richtungen
  const FLACH = ' stroke="none"';  // Boden ohne Umriss (die Tusche-Stadt zieht sonst um jede Fläche eine Linie)

  // Farbe abdunkeln (k < 1) oder aufhellen (k > 1)
  function ton(farbe, k) {
    let h = farbe.slice(1);
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h, 16);
    const kanal = (x) => Math.max(0, Math.min(255, Math.round(k < 1 ? x * k : x + (255 - x) * (k - 1))));
    return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((x) => kanal(x).toString(16).padStart(2, "0")).join("");
  }

  // --- Bausteine -----------------------------------------------------------------
  // Sichtbar sind der Deckel, die +j-Seite (links unten) und die +i-Seite (rechts unten). L ist das Licht der
  // Tageszeit (Farbe → Farbe).

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
  function fenster(L, i0, j0, i1, j1, geschosse, hoehe, licht, r, z0, glasFarbe) {
    let s = "";
    for (let k = 0; k < geschosse; k++) {
      const z = (z0 || 0) + hoehe * k + hoehe * 0.35, wh = hoehe * 0.38;
      for (const t of [0.3, 0.7]) {
        const glas = licht && r() < 0.55 ? "#f6cf73" : L(glasFarbe || "#6c8aa3");
        const a = i0 + (i1 - i0) * t - 0.07, b = j0 + (j1 - j0) * t - 0.07;
        s += poly([P(a, j1, z), P(a + 0.14, j1, z), P(a + 0.14, j1, z + wh), P(a, j1, z + wh)], glas);
        s += poly([P(i1, b, z), P(i1, b + 0.14, z), P(i1, b + 0.14, z + wh), P(i1, b, z + wh)], glas);
      }
    }
    return s;
  }

  function unkraut(i, j) {  // fällig: Unkraut bzw. welkes Laub rund um die Parzelle
    let s = "";
    for (const [a, b] of [[0.15, 0.85], [0.85, 0.2], [0.5, 0.92], [0.9, 0.6]]) {
      const p = P(i + a, j + b);
      s += `<path d="M${pt(p)} l-1.5,-3 M${pt(p)} l0,-4 M${pt(p)} l1.5,-3" stroke="#7d8a4a" stroke-width=".8" fill="none"/>`;
    }
    return s;
  }

  // Fahrzeuge werden in Fahrtrichtung u (längs) und v (quer) gezeichnet; achse "i" oder "j", vor = +1 oder -1.
  // Teile von hinten nach vorn (kleinere i + j zuerst).
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

  // Bewegung entlang einer Achse: dx, dy für n Kacheln in +i (achse "i") bzw. +j
  const versatz = (achse, n) => (achse === "i" ? [n * KW / 2, n * KH / 2] : [-n * KW / 2, n * KH / 2]);

  // Parzellen vom Platz aus nach außen
  function plan(n, rnd) {
    const lots = [];
    const R = Math.ceil(Math.sqrt((n + 40) * 9 / 4) / 2) + 3;
    for (let i = -R; i <= R; i++) {
      for (let j = -R; j <= R; j++) {
        if (istWeg(i) || istWeg(j)) continue;
        if (Math.abs(i) <= PLATZ && Math.abs(j) <= PLATZ) continue;
        lots.push({ i, j, d: Math.hypot(i + 0.5, j + 0.5) + rnd() * 1.4 });
      }
    }
    return lots.sort((a, b) => a.d - b.d).slice(0, n);
  }

  // Färbt eine fertige Zeichnung (z. B. einen Baum oder ein Tier) im Licht der Tageszeit um
  const umfaerben = (L, svg) => svg.replace(/(fill|stroke)="(#[0-9a-fA-F]{3,6})"/g, (_, a, c) => `${a}="${L(c)}"`);

  // --- Die Szene -------------------------------------------------------------------------
  // S: Stil des Themas mit boden, wegFarbe, platzFarbe, haus, figur, langsam, schnell, gross, zug, bahnhof,
  // mauer (5 Stufen), graben, aussenRing, belohnung, ausbau, fern, umland, nacht, schienen.

  function szene(g, o, S) {
    const { rnd, zeit, wetter, c, wachsen, hilfen } = o;
    const { dauer, voegel } = hilfen;
    const nacht = zeit === "nacht", abend = zeit === "abend";
    const L = nacht ? (x) => ton(x, 0.55) : abend ? (x) => ton(x, 0.88) : (x) => x;
    const tage = c.lerntage || 0;
    const n = g.baeume.length;
    const lots = plan(n, rnd);
    // große Häuser bzw. Bäume in die Mitte
    const ordnung = g.baeume.map((b, k) => ({ b, rang: RANG[b[0]] - (b[2] || 0) + rnd() * 0.9, k })).sort((a, b) => a.rang - b.rang);
    const rMax = lots.length ? Math.max(...lots.map((l) => Math.hypot(l.i + 0.5, l.j + 0.5))) : PLATZ + 1;
    const RS = Math.ceil(rMax) + 1;          // so weit reichen die Wege
    const RW = RS + 1;                       // Mauer bzw. Waldrand (innerer Ring)
    const RA = RW + 2.5;                     // äußerer Ring bei sehr sicheren Gebieten
    const RB = RW + 5.5;                     // Bahn dahinter
    const RV = RW + 11;                      // sichtbares Land
    const v = window.LW.verkehr(g), mauer = window.LW.mauerStufe(g.sicherheit);
    const boden = S.boden(g.zustand);
    const dinge = [];  // { t: Tiefe, s: svg } – hinten zuerst
    const neu = (t, s) => dinge.push({ t, s });
    const ctx = { L, r: rnd, licht: nacht || abend, nacht, g, v, mauer, tage, neu, RS, RW, RA, RB, RV, hilfen,
      grund: "", tint: (svg) => umfaerben(L, svg) };

    // Land, Wege, Platz
    ctx.grund += poly([P(-RV, -RV), P(RV, -RV), P(RV, RV), P(-RV, RV)], L(boden[0]), FLACH);
    S.umland(ctx);
    for (let i = -RS; i < RS; i++) {
      for (let j = -RS; j < RS; j++) {
        const platz = Math.abs(i + 0.5) <= PLATZ + 0.5 && Math.abs(j + 0.5) <= PLATZ + 0.5;
        if (platz) ctx.grund += poly([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], L(S.platzFarbe), FLACH);
        else if ((istWeg(i) || istWeg(j)) && Math.hypot(i + 0.5, j + 0.5) <= RS) {
          ctx.grund += poly([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], L(S.wegFarbe(v)), FLACH);
        }
      }
    }
    if (v.trams && S.schienen) {  // Schienen auf den Hauptwegen
      ctx.grund += `<path d="M${pt(P(-RS, 0.4))} L${pt(P(RS, 0.4))} M${pt(P(-RS, 0.6))} L${pt(P(RS, 0.6))}` +
        ` M${pt(P(0.4, -RS))} L${pt(P(0.4, RS))} M${pt(P(0.6, -RS))} L${pt(P(0.6, RS))}" stroke="${L("#6f665a")}" stroke-width=".7"/>`;
    }

    // Häuser bzw. Bäume; wer wo wohnt, merken wir uns für die Leute auf den Wegen
    const wohnorte = [];
    ordnung.forEach((o2, k) => {
      const l = lots[k];
      if (!l) return;
      const w = window.LW.hausBewohner(o2.b);
      if (w) wohnorte.push({ i: l.i, j: l.j, w });
      let s = S.haus(ctx, o2.b, l.i, l.j);
      if (wachsen) s = `<g class="lw-wachsen" style="animation-delay:${f(0.1 + 1.6 * k / Math.max(1, n))}s">${s}</g>`;
      neu(l.i + l.j + 1, s);
    });

    // Belohnungen (Sehenswürdigkeiten bzw. Tiere) auf dem Platz
    const stellen = [[0.5, 0.5], [-1.2, -1.2], [2, -1.2], [-1.2, 2], [2, 2], [0.5, -1.6], [-1.6, 0.5], [2.4, 0.5], [0.5, 2.4],
      [-1.8, -0.4], [1.3, -1.8], [-0.4, 1.3]];
    (g.belohnungen || []).forEach((t, k) => {
      const [i, j] = stellen[k % stellen.length];
      neu(i + j, `<g transform="translate(${pt(P(i, j))}) scale(${S.belohnungSkala})">${ctx.tint(S.belohnung(t))}</g>`);
    });

    // Ausbau nach Lerntagen (Laternen, Blumen, Bänke …) und das Bauwerk draußen (Aquädukt, See)
    S.ausbau(ctx);
    if (tage >= 200) S.fern(ctx);

    // Mauer bzw. Waldrand: je sicherer das Gebiet sitzt, desto massiver
    if (mauer) {
      ring(RW, S.mauer[mauer - 1]);
      if (mauer >= 5) {  // Graben und äußerer, niedrigerer Ring
        const a = RW + 0.7, b = RW + 1.9;
        for (const sg of [1, -1]) {
          ctx.grund += poly([P(-b, sg * a), P(b, sg * a), P(b, sg * b), P(-b, sg * b)], L(S.graben), FLACH);
          ctx.grund += poly([P(sg * a, -b), P(sg * b, -b), P(sg * b, b), P(sg * a, b)], L(S.graben), FLACH);
        }
        for (const [i, j] of [[0, RW + 0.5], [0, -RW - 2], [RW + 0.5, 0], [-RW - 2, 0]]) {  // Brücken an den Toren
          const lang = Math.abs(j) > Math.abs(i);
          ctx.grund += poly(lang ? [P(i, j), P(i + 1, j), P(i + 1, j + 1.5), P(i, j + 1.5)] : [P(i, j), P(i + 1.5, j), P(i + 1.5, j + 1), P(i, j + 1)], L("#a8987a"), FLACH);
        }
        ring(RA, S.aussenRing);
      }
    }

    function ring(R, a) {  // quadratischer Ring mit Toren an den Hauptwegen
      const stueck = (i0, j0, i1, j1) => {
        let s = quader(L, i0, j0, i1, j1, a.h, a.farbe);
        if (a.zinnen) {
          const lang = i1 - i0 > j1 - j0;
          s += [0.1, 0.6].map((t) => (lang ? quader(L, i0 + t, j0, i0 + t + 0.25, j1, 2.5, a.farbe, a.h) :
            quader(L, i0, j0 + t, i1, j0 + t + 0.25, 2.5, a.farbe, a.h))).join("");
        }
        return s;
      };
      const turm = (i, j, w, h) => (a.turm ? a.turm(ctx, i, j, w, h) : quader(L, i, j, i + w, j + w, h, ton(a.farbe, 0.95)) +
        (h > 22 ? zeltdach(L, i - 0.05, j - 0.05, i + w + 0.05, j + w + 0.05, h, 9, "#6b5f5a") : ""));
      for (let k = -Math.floor(R); k < Math.ceil(R); k++) {
        if (k === 0) continue;  // Tor
        for (const j of [-R, R - a.d]) neu(k + j + 1, stueck(k, j, k + 1, j + a.d));
        for (const i of [-R, R - a.d]) neu(i + k + 1, stueck(i, k, i + a.d, k + 1));
        if (a.zwischen && k % 5 === 0) {
          for (const [i, j] of [[k, -R - 0.15], [k, R - 0.75], [-R - 0.15, k], [R - 0.75, k]]) neu(i + j + 1.5, turm(i, j, 0.9, a.h + 6));
        }
      }
      if (a.ecken) {
        for (const [i, j] of [[-R - 0.2, -R - 0.2], [R - 0.8, -R - 0.2], [-R - 0.2, R - 0.8], [R - 0.8, R - 0.8]]) neu(i + j + 1.5, turm(i, j, 1, a.ecken));
      }
      if (a.tore) {  // Türme links und rechts jedes Tores
        for (const [i, j] of [[-1, -R - 0.2], [1, -R - 0.2], [-1, R - 0.8], [1, R - 0.8], [-R - 0.2, -1], [-R - 0.2, 1], [R - 0.8, -1], [R - 0.8, 1]]) {
          neu(i + j + 1.5, turm(i, j, 1, a.h + 10));
        }
      }
    }

    // Bahn hinter dem Gebiet: mehr und längere Züge, je mehr Einwohner; Bahnhof ab den großen Fahrzeugen
    if (v.zuege) {
      const gleise = Array.from({ length: v.zuege }, (_, z) => -RB - z);
      gleise.forEach((j, z) => {
        ctx.grund += poly([P(-RV, j - 0.18), P(RV, j - 0.18), P(RV, j + 0.18), P(-RV, j + 0.18)], L(S.gleisBett || "#8f8573"), FLACH);
        ctx.grund += `<path d="M${pt(P(-RV, j - 0.08))} L${pt(P(RV, j - 0.08))} M${pt(P(-RV, j + 0.08))} L${pt(P(RV, j + 0.08))}" stroke="${L("#5f574c")}" stroke-width=".6"/>`;
        const weg = 2 * RV + v.wagen * 1.1 + 2;
        const [dx, dy] = versatz("i", weg), vor = z % 2 ? -1 : 1;  // abwechselnd in beide Richtungen
        const start = vor === -1 ? P(RV + 1, j) : P(-RV - 1, j);
        neu(j - RV, `<g transform="translate(${pt(start)})"><g class="lw-zug2" style="--dx:${f(dx * vor)}px;--dy:${f(dy * vor)}px;${dauer(26 + rnd() * 14, rnd)}">` +
          `${S.zug(ctx, v.wagen, fahrbahn("i", vor))}</g></g>`);
      });
      if (v.trams) neu(-RB + 0.4, S.bahnhof(ctx, -2, -RB + 0.4));
    }

    // Leute gehen auf den Wegen neben ihren Häusern: große, gepflegte bringen mehr Leben
    const wege = [];
    for (let i = -RS; i < RS; i++) {
      for (let j = -RS; j < RS; j++) {
        if ((istWeg(i) || istWeg(j)) && Math.hypot(i + 0.5, j + 0.5) <= RS - 0.5) wege.push([i, j]);
      }
    }
    const summe = wohnorte.reduce((a, x) => a + x.w, 0);
    const nebenan = () => {  // ein Wegstück neben einem Haus, gewichtet nach seinen Einwohnern
      let x = rnd() * summe;
      const h = wohnorte.find((o3) => (x -= o3.w) <= 0) || wohnorte[wohnorte.length - 1];
      const moeglich = [];
      for (const d of [-1, 1]) {
        if (istWeg(h.i + d)) moeglich.push([h.i + d, h.j, "j"]);  // Weg quer zu i, läuft entlang j
        if (istWeg(h.j + d)) moeglich.push([h.i, h.j + d, "i"]);
      }
      return moeglich.length ? wahl(rnd, moeglich) : null;
    };
    const leute = g.zustand === "wiese" ? 0 : v.leute + Math.min(30, c.heute || 0);
    for (let k = 0; k < leute && wege.length; k++) {
      let ort = summe ? nebenan() : null;
      if (!ort) {
        const [i0, j0] = wahl(rnd, wege);
        ort = [i0, j0, istWeg(j0) ? "i" : "j"];
      }
      const [i0, j0, achse] = ort;
      const i = i0 + 0.25 + rnd() * 0.5, j = j0 + 0.25 + rnd() * 0.5, [dx, dy] = versatz(achse, 0.6 + rnd() * 1.2);
      neu(i + j + 0.6, `<g transform="translate(${pt(P(i, j))}) scale(.8)"><g class="lw-pendeln" style="--dx:${f(dx / 0.8)}px;--dy:${f(dy / 0.8)}px;${dauer(10 + rnd() * 12, rnd)}">` +
        `<g class="lw-wippen" style="${dauer(0.5 + rnd() * 0.2, rnd)}">${ctx.tint(S.figur(ctx))}</g></g></g>`);
    }

    // Fahrzeuge: langsame, ab 600 Einwohnern immer mehr schnelle, große auf den Hauptwegen. Jedes fährt einen
    // Abschnitt von zwei Blöcken, damit es richtig zwischen den Häusern einsortiert ist.
    if (v.fahrzeuge) {
      const abschnitte = [];
      for (let a = -RS; a + 6 <= RS; a += 3) {
        for (let b = -Math.floor(RS / 3) * 3; b <= RS - 1; b += 3) {
          if (Math.abs(b) <= PLATZ + 1 && Math.abs(a + 3) <= PLATZ + 1) continue;  // nicht quer über den Platz
          abschnitte.push(["i", a, b], ["j", a, b]);
        }
      }
      // fährt von a nach a + 6 (vor = 1) oder zurück; in der Gegenrichtung auf der anderen Wegseite
      const fahrzeug = (achse, a, b, zeichnen, sek) => {
        const vor = rnd() < 0.5 ? 1 : -1, quer = b + (vor === 1 ? 0.62 : 0.38);
        const u = vor === 1 ? a : a + 6;
        const [i, j] = achse === "i" ? [u, quer] : [quer, u];
        const [dx, dy] = versatz(achse, 6 * vor);
        neu(a + 3 + quer, `<g transform="translate(${pt(P(i, j))})"><g class="lw-fahrt" style="--dx:${f(dx)}px;--dy:${f(dy)}px;${dauer(sek, rnd)}">` +
          `${zeichnen(fahrbahn(achse, vor))}</g></g>`);
      };
      for (let k = 0; k < v.fahrzeuge && abschnitte.length; k++) {
        const [achse, a, b] = wahl(rnd, abschnitte);
        if (k < v.autos) fahrzeug(achse, a, b, (fb) => S.schnell(ctx, fb), 5 + rnd() * 3);
        else fahrzeug(achse, a, b, (fb) => S.langsam(ctx, fb), 9 + rnd() * 6);
      }
      const haupt = abschnitte.filter((x) => x[2] === 0);
      for (let k = 0; k < v.trams && haupt.length; k++) {
        const [achse, a] = wahl(rnd, haupt);
        fahrzeug(achse, a, 0, (fb) => S.gross(ctx, fb), 12 + rnd() * 4);
      }
    }

    // Wimpel über dem Platz ab 7 Tagen Serie
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

    if (ctx.licht && S.nacht) S.nacht(ctx);

    // Himmel: Wolken mit Schatten (am Rand, nicht über der Mitte), Regen, Vögel
    const oben = P(-RV, -RV)[1], links = P(-RV, RV)[0], breite = 2 * RV * KW;
    let himmel = "";
    const wolkenZahl = wetter === "regen" ? 7 : wetter === "wolken" || g.zustand === "verwildert" ? 4 : 2;
    for (let k = 0; k < wolkenZahl; k++) {
      const seite = k % 2 ? 1 : -1, x = seite * (RS * KW * 0.55 + rnd() * RV * KW * 0.4), y = oben + RV * KH * (0.25 + rnd() * 1.1);
      const sc = 1 + rnd() * 1.2, farbe = wetter === "regen" ? "#a9adb0" : "#f7f7f2";
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
    // Ausschnitt: das Gebiet; herauszoomen (Mausrad) zeigt Mauer, Bahn und Land drumherum
    const R0 = RS + 1;
    const x0 = P(-R0, R0)[0], x1 = P(R0, -R0)[0], y0 = P(-R0, -R0)[1] - 50, y1 = P(R0, R0)[1];
    return {
      svg: ctx.grund + dinge.map((d) => d.s).join("") + himmel,
      viewBox: [x0, y0, x1 - x0, y1 - y0].map(f).join(" "),
      grund: L(boden[0]),
    };
  }

  window.LW.iso = { KW, KH, P, pt, poly, ton, quader, satteldach, zeltdach, fenster, unkraut, vonHinten, istWeg, PLATZ, FLACH, szene };
})();
