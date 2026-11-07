# Pour log

A small web app for tracking daily coffee pours: which beans, which recipe, which gear, and how it tasted.

Live site (once GitHub Pages is on): https://isaaclim98.github.io/pour-log/

## Features

- **Log a pour**: pick beans from your pantry, a recipe from your recipe book, and your grinder, dripper, filter paper and kettle. Add a grind setting, a 1-5 rating and tasting notes.
- **Calendar**: month view with the number of pours per day. Click a day to see its pours or log a new one for that date. Several pours per day are fine.
- **Pantry**: the beans you have on hand (name, roaster, origin or process, roast date).
- **Recipe book**: coffee and water weights, temperature, time and method.
- **Equipment**: grinders, drippers, filter papers and kettles.
- **Backup**: export and import everything as a JSON file.

## Run it locally

No build step and no dependencies. Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

then visit http://localhost:8000.

## Where your data lives

Everything is stored in your browser's localStorage (key `pour-log-v1`). It stays on that browser and device, so use **Export backup** now and then, and **Import backup** to move your data elsewhere.

## Project layout

```
index.html       page structure
css/styles.css   styles (light and dark mode via CSS variables)
js/app.js        app logic and storage
.nojekyll        tells GitHub Pages to serve the files as-is
```

## Deploy on GitHub Pages

Repo Settings > Pages > Deploy from a branch > `main` / `(root)`.
