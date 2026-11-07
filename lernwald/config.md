Am einfachsten über **Werkzeuge → Add-ons → Lernwald → Einstellungen**: dort öffnet sich eine Tabelle.

- `thema`: `"wald"` (Bäume und Tiere) oder `"stadt"` (Häuser, Dörfer wachsen zur Stadt, Sehenswürdigkeiten).
- `gebiete`: Liste der Waldgebiete, je `{"name": "…", "art": "stapel" | "schlagwort" | "suche", "wert": "…"}`.
  `stapel` nimmt den Stapel samt Unterstapeln, `schlagwort` alle Karten mit dem Schlagwort samt Unter-Schlagwörtern (`Arbeit` umfasst `Arbeit::SEW`, Groß/klein egal), `suche` eine Anki-Suche.
- `hauptstapel_automatisch`: Ist die Liste leer, wird jeder Hauptstapel ein Gebiet.
- `max_baeume`: höchstens so viele Bäume bzw. Häuser je Gebiet zeichnen (größere Stapel werden gleichmäßig ausgedünnt).
