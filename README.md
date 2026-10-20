# Stormcalmer

Statyczna appka (HTML + Alpine.js) łącząca stoicyzm i CBT: poranna „pogoda w głowie”, ćwiczenia na burze, wieczorny przegląd Seneki i nawyki. Działa offline, dane zostają na urządzeniu, hosting na GitHub Pages.

## Stack

- **Front:** vanilla HTML/CSS + [Alpine.js](https://alpinejs.dev) (lokalna kopia w `assets/`), bez kroku budowania.
- **Design:** „Niebo i morze”: niebo zmienia barwę z pogodą dnia, fale rosną przy burzy. Fonty Cormorant Garamond + Jost (OFL) hostowane lokalnie w `assets/fonts/`.
- **Offline:** `sw.js` (najpierw sieć, cache gdy offline) + `manifest.webmanifest`. Instalacja jako aplikacja na ekranie głównym.
- **Dane:** `localStorage` (`storm.v1`), tylko na tym urządzeniu. Kopia: eksport/import JSON w zakładce „Więcej”.

## Deploy (GitHub Pages)

1. Utwórz repo `stormcalmer` na GitHubie i wypchnij `main`.
2. Settings → Pages → Source: **Deploy from a branch** → Branch: **main** / Folder: **/ (root)** → Save.
3. URL: `https://<username>.github.io/stormcalmer/`.

Po większej zmianie podbij `CACHE` w `sw.js` (np. `storm-v4` → `storm-v5`), żeby wyczyścić stary cache offline. Online aplikacja i tak zawsze pobiera świeże pliki.

## Instalacja na iPhone / iPad (Safari)

1. Otwórz URL w **Safari** (nie w Brave: aplikacja z ekranu głównego w Safari ma własny, trwały magazyn danych i działa offline).
2. Udostępnij → **Do ekranu początkowego**.
3. iPhone i iPad mają osobne dane. Przenosisz je przez Eksport → Pliki/iCloud → Wczytaj kopię.

**Przypomnienia:** Skróty → Automatyzacja → Pora dnia → czynność „Pokaż powiadomienie” (rano i wieczorem). Aplikacji z ekranu początkowego nie ma na liście „Otwórz aplikację”, a „Otwórz URL” otwiera kartę Safari z osobnymi danymi, więc po powiadomieniu otwiera się aplikację z ikony.

## Edycja treści

Wszystko w `assets/content.js`:
- `QUOTES`: cytaty (tekst, autor, źródło, pogody `w`, pytanie do refleksji `q`).
- `EXERCISES`: ćwiczenia jako listy kroków (`scale`, `text`, `textarea`, `lines`, `classify`, `choice`, `multi`, `timer`, `info`).
- `RITUALS`: poranek i wieczór, ten sam silnik kroków.
- `RECOMMEND`: które ćwiczenia polecać przy jakiej pogodzie.

## Lokalne uruchomienie

```bash
python3 -m http.server 8000
# → http://localhost:8000
```
