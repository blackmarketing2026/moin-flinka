# Moin Flinka Designregeln

Diese Datei ist die Arbeitsgrundlage fuer die spaetere Landingpage-Erstellung. Ziel ist, den gelieferten Landingpage-Entwurf fuer **Moin Flinka - Express Kfz-Zulassung & Schilder in Hamburg** moeglichst exakt, sauber und konsistent nachzubauen.

## Markenbasis

- Marke: Moin Flinka
- Angebot: Express Kfz-Zulassung & Schilder in Hamburg
- Domain: www.moin-flinka.de
- Primaeres Logo: `logo.webp`
- Zentrales Markenelement: Moewe mit Kapitaensmuetze, rotem Schal, Kennzeichen, Hamburger Hafen, Wellen und Speedlines
- Das Logo darf nicht veraendert werden. Es soll prominent im Header und Footer eingesetzt werden.

## Farbpalette

Die Farben kommen aus dem Logo und muessen konsequent verwendet werden.

| Name | Hex | Einsatz |
| --- | --- | --- |
| Marineblau | `#092954` | Header-Banner, Footer, Headlines, Icons, Linien, Primaertext |
| Rot | `#F1070E` | Haupt-CTA, Akzente, Speedlines, Logo-Schriftzug Flinka |
| Tuerkis | `#42A4C8` | Eyebrows, Wellen, Prozesslinie, Checkmarks, dezente Akzente |
| Hellblau | `#ABCEE4` | Hintergruende, Kreise, Kartenlinien, maritime Dekoration |
| Weiss | `#FFFFFF` | Flaechen, Karten, Formulare, Negativraum |

Ergaenzende neutrale Farben:

- Text dunkel: `#092954`
- Fliesstext: `#33455F` bis `#40516B`
- Kartenrahmen: `#C7DDEB` bis `#D7E8F2`
- Hintergrund hell: `#EFF8FD`, `#F7FCFF`
- Erfolgsmeldung: Hintergrund `#EAF8EE`, Text `#2F7D3A`

## Gesamtwirkung

- Modern, hochwertig, schnell, hanseatisch, vertrauenswuerdig
- Nicht wie eine Behoerdenseite
- Viel Weissraum, klare visuelle Fuehrung, starke CTA-Farben
- Maritime Details nur dezent einsetzen: Wellen, Hafen-Silhouette, Moewe, Speedlines
- Keine erfundenen Bewertungen, Preise, Paketpreise, Countdown-Timer oder fremde Marken
- Keine ueberladene Gestaltung

## Layout-Grundregeln

- Maximale Inhaltsbreite Desktop: ca. `1180px`
- Seitenpadding Desktop: `24px` bis `32px`
- Seitenpadding Tablet: `20px`
- Seitenpadding Mobile: `14px` bis `18px`
- Hauptsektionen vertikal Desktop: `56px` bis `80px`
- Hauptsektionen vertikal Mobile: `42px` bis `58px`
- Kartenabstand Desktop: `20px` bis `24px`
- Kartenabstand Mobile: `14px` bis `18px`
- Kartenradius: `10px` bis `14px`
- Buttonradius: `7px` bis `9px`
- Keine stark pillenfoermigen Karten; Referenz arbeitet eher mit moderat abgerundeten Rechtecken.

## Projektstruktur nach Umsetzung

- Die komplette sichtbare Seitenstruktur steht in `index.html`.
- Kontaktdaten stehen zusaetzlich im JSON-Block `#site-config` in `index.html`.
- `src/main.js` bleibt bewusst klein und steuert nur Fonts/CSS, mobile Navigation, FAQ-Accordion und Formularvalidierung.
- `src/styles.css` enthaelt das Designsystem und alle Layoutregeln.
- Die Seite funktioniert dadurch weitgehend als echtes statisches HTML; JavaScript baut keine Sektionen mehr zusammen.

## Typografie

Empfohlene Schriftfamilie:

```css
--font-display: "Barlow Condensed", "Arial Narrow", Arial, sans-serif;
--font-body: "Inter", Arial, Helvetica, sans-serif;
```

Typografische Hierarchie:

- Top-Banner: `12px` bis `14px`, fett
- Navigation: `13px` bis `15px`, fett
- Eyebrow im Hero: `14px` bis `18px`, uppercase, tuerkis, sehr fett
- H1 Desktop: ca. `46px` bis `58px`, sehr fett, Marineblau, enge Zeilenhoehe
- H1 Mobile: ca. `31px` bis `38px`, sehr fett, keine Textueberlaeufe
- H2 Desktop: ca. `30px` bis `38px`, sehr fett
- H2 Mobile: ca. `26px` bis `31px`
- H3 Karten: ca. `16px` bis `19px`, sehr fett
- Fliesstext Desktop: ca. `15px` bis `17px`
- Kartentext: ca. `12px` bis `14px`, gut lesbar

Wichtig:

- Keine negative Laufweite.
- Keine viewport-basierten Extremgroessen.
- Lange Woerter muessen auf Mobile sauber umbrechen.
- Hero-H1 soll im Desktop wie in der Referenz auf drei Zeilen wirken:
  - Heute zulassen.
  - Schilder bekommen.
  - Direkt losfahren.

## Sektionen

### 1. Telefon-Banner

- Ganz oben, Marineblau, schmal.
- Text mittig: `Schnelle Kfz-Zulassung in Hamburg? Jetzt anrufen: +49 1590 6808767`
- Roter Button rechts bzw. inline: `Jetzt anrufen`
- Link: `tel:+4915906808767`
- Hoehe: ca. `30px` bis `36px` Desktop, auf Mobile zweizeilig erlaubt.

### 2. Header

- Weisser Header unter dem Telefon-Banner.
- Logo links prominent.
- Navigation mittig: Leistungen, Ablauf, FAQ, Kontakt.
- Rechts: WhatsApp-Button als heller Outline-Button, daneben roter Button `Jetzt anfragen`.
- Desktop-Hoehe: ca. `78px` bis `92px`.
- Mobile: Logo links, Burger rechts, CTA-Buttons im Header ausblenden oder stark reduzieren.
- Header darf sticky sein, muss aber ruhig wirken.

### 3. Hero

- Zweispaltiges Layout Desktop.
- Links: Eyebrow, H1, Untertext, drei Vorteile, zwei CTAs.
- Rechts: grosse Moewe mit Kennzeichen, hellblauer Kreis, Hafen-Silhouette, Wellen, Speedlines.
- Hintergrund links weiss, rechts sehr hellblau.
- Hero-Hoehe Desktop: ca. `560px` bis `650px`; Servicebereich soll noch im ersten langen Screenshot sichtbar folgen.
- CTA 1: rot, WhatsApp, Link zu `https://wa.me/4915906808767?...`
- CTA 2: marineblau, Telefon, Link zu `tel:+4915906808767`
- Mobile: Text zuerst, danach Illustration kleiner und nicht abgeschnitten. Keine horizontalen Scrollbalken.

### 4. Service-Bereich

- H2: `Kfz-Zulassung und Kennzeichen in Hamburg`
- Einleitung zentriert.
- Sechs Karten im `3 x 2` Raster auf Desktop.
- Tablet: `2 x 3`.
- Mobile: einspaltig.
- Karten: weisse Flaeche, hellblauer Rahmen, dezenter Schatten, Icon oben, Titel, kurzer Text.
- Button darunter: rot, `Service jetzt anfragen`.

Service-Icons aus Referenz:

- Express-Zulassung: Stoppuhr mit Speedlines
- Kfz-Zulassung: Auto frontal
- Online-Zulassung i-Kfz: Monitor mit Globus
- Kfz-Schilder: Kennzeichen mit `HH`
- Schilder-Bringdienst: Lieferwagen mit Speedlines
- Wunschkennzeichen: Kennzeichen mit Stern

### 5. Warum Moin Flinka?

- H2: `Schnell. Persönlich. Norddeutsch unkompliziert.`
- Vier Vorteilsspalten Desktop.
- Dezente vertikale Trenner zwischen Spalten.
- Icons in hellblauen Kreisen.
- Mobile: einspaltig ohne Trenner.

Vorteil-Icons:

- Kein Behördendschungel: Labyrinth/Formularstruktur
- Direkter Kontakt: Sprechblasen
- Hamburg im Fokus: Hamburg-Symbol/Tor/Skyline
- Alles aus einer Hand: Handschlag

### 6. Ablauf

- H2: `So funktioniert Ihre Anfrage`
- Vier Schritte in horizontaler Timeline.
- Tuerkise Linie laeuft durch nummerierte Kreise.
- Darunter runde Outline-Icons.
- Mobile: vertikal stapeln, Linie optional weglassen.

Ablauf-Icons:

- Kontakt aufnehmen: Telefon + WhatsApp
- Anliegen schildern: Dokument
- Unterlagen abstimmen: Ordner
- Abwicklung starten: Checkmark

### 7. Unterlagen-Bereich

- Breite Karte mit zwei Bereichen.
- Links marineblauer Block mit weisser Checklistengrafik und rundem Check.
- Rechts hellblauer Verlauf mit H2, Text und Hinweis.
- Desktop: zweispaltig.
- Mobile: gestapelt.
- Radius: ca. `12px`.

### 8. FAQ

- H2: `Häufige Fragen`
- Accordion-Liste mit hellblauem Rahmen.
- Erste Frage offen.
- Chevron rechts.
- Links daneben/unterhalb dezenter Leuchtturm mit Wellen als Hintergrund-Deko.
- Keine grossen Karten um die ganze Sektion herum.

### 9. Kontaktbereich

- Hellblauer Hintergrund.
- Links: H2, Text, drei Kontaktkarten, Phone-Mockup darunter.
- Rechts: Formular in weisser Karte.
- Kontaktkarten: WhatsApp, Telefon, E-Mail.
- Kontaktkarten muessen **immer gleich hoch** sein: dazu jede Karte mit demselben Aufbau befuellen
  (Icon, Titel, kurze Unterzeile, Button) - fehlt bei einer Karte die Unterzeile, wirken die Karten
  im Grid unterschiedlich hoch. CSS-Loesung: `.contact-card` mit `grid-template-rows: auto auto 1fr auto`,
  sodass die Buttons in allen Karten buendig unten sitzen.
- Phone-Mockup: fertiges Foto-Mockup (`assets/img/phone-mockup.webp`), kein CSS-nachgebautes Handy mehr.
  Groesse ueber `.phone-mock { width: ... }` steuern, Bild selbst bekommt nur `filter: drop-shadow(...)`.
- Formularfelder:
  - Vor- und Nachname
  - Telefonnummer
  - E-Mail-Adresse
  - Bevorzugter Kontaktweg
  - Worum geht es?
  - Nachricht
  - Datenschutz-Checkbox
- Button: rot, volle Breite, `Kostenlos und unverbindlich anfragen`
- Erfolgsmeldung gruen/hellgruen.

### 10. Mobile Kontaktleiste

- Nur auf Smartphones sichtbar.
- Fixiert am unteren Rand.
- Marineblau mit drei gleich breiten Feldern:
  - Anrufen
  - WhatsApp
  - Anfrage
- Muss ueber Inhalt schweben, aber nichts Wichtiges dauerhaft verdecken.
- Body braucht auf Mobile extra Bottom-Padding.

### 11. Footer

- Marineblauer Footer.
- Logo links oder prominent.
- Kurzbeschreibung mittig.
- Kontaktinfos: Telefon, WhatsApp, E-Mail.
- Behoerden-Disclaimer: eigene Zeile oberhalb der Impressum-Zeile, durch duenne Linie abgetrennt
  (`.footer-disclaimer`), kleiner/gedaempfter Text (`11px`, Farbe `#a9c2d8`). Wortlaut:
  "Moin Flinka ist keine Behoerde, sondern ein privater Dienstleister fuer Kfz-Zulassungen in Hamburg
  und uebernimmt die Abwicklung im Auftrag seiner Kund*innen." Muss so oder sinngemaess erhalten bleiben,
  da es rechtlich/inhaltlich wichtig ist klarzustellen, dass es sich nicht um eine Behoerde handelt.
- Links: Impressum, Datenschutzerklärung.
- Rechts/Hinten dezente Hafenkran- und Wellen-Grafik.
- Domain sichtbar: `www.moin-flinka.de`

## Komponentenregeln

### Buttons

- Primaerbutton: Rot `#F1070E`, weisser Text, starker aber weicher Schatten.
- Sekundaerbutton: Marineblau `#092954`, weisser Text.
- WhatsApp-Headerbutton: weiss, gruener Akzent, hellblauer Rahmen.
- Mindesthoehe: `42px` bis `54px`.
- Desktop: Inhalt darf in einer Zeile bleiben.
- Mobile: Text darf umbrechen, Button darf nicht aus dem Viewport laufen.

### Karten

- Hintergrund: weiss.
- Rahmen: hellblau.
- Schatten: sehr dezent.
- Radius: `10px` bis `14px`.
- Kein verschachteltes Karten-in-Karten-Layout.
- Karten sollen stabil gleich hoch wirken.

### Icons

- Stil: einfache, fette Line-Icons in Marineblau.
- Akzentfarbe: Tuerkis, selten Rot.
- Keine neuen Symbolideen erfinden, nur die Motive aus dem Referenzentwurf nutzen.
- SVG bevorzugt fuer skalierbare Icons.
- Logo und Moewe bevorzugt aus Originaldatei bzw. sauber daraus abgeleiteten Assets.

## Responsives Verhalten

Breakpoints:

```css
/* Desktop: ab ca. 1024px */
/* Tablet: 761px bis 1023px */
/* Mobile: bis 760px */
/* Kleine Mobile: bis 420px */
```

Mobile-Pflichten:

- Kein horizontaler Scrollbalken.
- H1 und CTA-Buttons muessen voll sichtbar sein.
- Hero-Illustration darf nicht hart abgeschnitten wirken.
- Kontaktleiste unten dauerhaft sichtbar.
- Formularfelder volle Breite.
- Servicekarten einspaltig.

## Asset-Struktur (aktueller Stand)

Tatsaechlich genutzte Struktur im Projekt:

```text
assets/
  img/
    moin-flinka-logo.png     - finales horizontales Logo (Moewe + Schriftzug), echter Alphakanal
    moin-flinka-moewe.png    - grosse Moewen-Illustration fuer den Hero-Bereich
    phone-mockup.webp        - fertiges Handy-Mockup-Foto fuer den Kontaktbereich (verlustfrei)
_reference/
  landingpage-desktop.png    - Referenz-Screenshot der Ziel-Landingpage (nur zur Orientierung, nicht einbinden)
```

Aeltere `assets/brand/`- und `assets/icons/`-Unterordner mit einzelnen SVG-Icons wurden im Zuge des Vite-Umbaus
durch die genannten fertigen Bilddateien plus inline-SVGs direkt in `index.html` ersetzt.

### Dateinamen-Regel

Alle neuen Bilddateien (egal ob von mir, Codex oder manuell hinzugefuegt) muessen **kurze, technische Namen ohne
Leerzeichen, Umlaute oder Datums-/Zeitstempel** bekommen, z. B. `moin-flinka-logo.png` statt
`ChatGPT Image 28. Aug. 2026, 07_33_41.png`. Grund: Tools wie Codex koennen Dateien mit Leerzeichen/Sonderzeichen
im Pfad teils nicht lesen ("Codex could not read the local image"). Rohdateien mit generierten Zufalls-/Datumsnamen
direkt nach der Verarbeitung (Umbenennen, Konvertieren, Einbinden) aus dem Projektordner loeschen, damit keine
ungenutzten Dateien liegen bleiben.

## SEO-Regeln

Seitentitel:

```text
Kfz-Zulassung Hamburg | Express-Zulassung & Schilder | Moin Flinka
```

Meta-Beschreibung:

```text
Kfz-Zulassung, Online-Zulassung und Kfz-Kennzeichen in Hamburg. Jetzt unkompliziert per WhatsApp, Telefon oder Kontaktformular bei Moin Flinka anfragen.
```

SEO-Begriffe natuerlich im Text verwenden:

- Kfz-Zulassung Hamburg
- Express-Zulassung Hamburg
- Zulassungsdienst Hamburg
- Online-Zulassung Hamburg
- i-Kfz Hamburg
- Kfz-Schilder Hamburg
- Autoschilder Hamburg
- Wunschkennzeichen Hamburg
- Kennzeichen liefern lassen

## Inhaltliche Grenzen

Nicht einfuegen:

- Preise
- Paketpreise
- erfundene Bewertungen
- erfundene Kontaktdaten
- Allianz-Erwaehnung
- Countdown-Timer
- zusaetzliche Leistungen, die nicht im Briefing stehen

Bekannte echte Telefonnummer:

```text
+49 1590 6808767
tel:+4915906808767
WhatsApp: https://wa.me/4915906808767
```

Verbindliche Nutzung fuer spaetere Buttons:

- Alle Anrufbuttons verwenden `tel:+4915906808767`.
- Alle WhatsApp-Buttons verwenden `https://wa.me/4915906808767`.
- Sichtbare Telefonnummer auf der Website: `+49 1590 6808767`.

E-Mail bleibt Platzhalter, bis eine echte Adresse vorliegt:

```text
{{E-MAIL-ADRESSE}}
```

Formular-Endpunkt:

- Primaere Stelle: `FORM_ENDPOINT` im JSON-Block `#site-config` in `index.html`.
- Alternative direkt am Formular: Attribut `data-form-endpoint=""` auf `.contact-form`.
- Solange kein Endpunkt eingetragen ist, zeigt das Formular nur den vorbereiteten Hinweis und keine erfundene Erfolgsmeldung.

## Technik & Workflow

- Das Projekt ist ein Vite-Projekt (`package.json`, `src/main.js`, `src/styles.css`), kein reines
  statisches HTML mehr. Build-Kommandos:
  - `npm run dev` - lokaler Dev-Server (`http://127.0.0.1:5173/`)
  - `npm run build` - Produktions-Build nach `dist/` (vor jedem Push testweise ausfuehren)
  - `npm run preview` - Vorschau des Builds
- `node_modules/`, `dist/`, `.qa/` und `.vite/` sind in `.gitignore` und werden nicht committed.
- An diesem Projekt arbeiten sowohl Codex als auch Claude Code parallel im selben lokalen Ordner und
  Git-Repo. Vor eigenen Aenderungen immer `git status` pruefen, da der andere Assistent zwischenzeitlich
  Dateien geaendert/geloescht/committed haben kann. Nach dem eigenen Commit lokal bauen (`npm run build`),
  um sicherzugehen, dass nichts kaputt ist, bevor gepusht wird.
- GitHub-Repo: `https://github.com/blackmarketing2026/moin-flinka.git`, Branch `main`. Aenderungen werden
  nach Nutzerwunsch jeweils direkt dorthin gepusht (kein separater Feature-Branch-Workflow bisher).

## Qualitaetscheck vor Abschluss

Vor Abschluss einer Landingpage-Version pruefen:

- Desktop-Screenshot gegen Referenz: Header, Hero, Servicebereich, Footer-Proportionen.
- Mobile-Screenshot: keine Ueberlaeufe, Sticky-Kontaktleiste sichtbar.
- Alle CTAs fuehren zu korrekten Links.
- Keine Lorem-Ipsum-Texte.
- Keine verbotenen Inhalte.
- Logo wird unverzerrt dargestellt.
- Farben entsprechen der Palette.
- Sektionen folgen der Referenzreihenfolge.
