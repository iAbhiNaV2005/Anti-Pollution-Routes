# Anti Pollution Routes

A single-page React portfolio app that helps you plan routes with better air quality. Define your weekly schedule, visualize routes on an interactive map with AQI overlays, and get suggested alternative routes ranked by lower pollution.

## Features

- **Weekly schedule** – Add home, work, and other places with days and times
- **Interactive map** – Leaflet map with OpenStreetMap tiles, route polylines, and AQI overlays
- **AQI overlay** – Toggle between heat-style and station markers showing air quality
- **Suggest best route** – Computes average AQI for alternative routes and highlights the lowest-AQI option
- **Notifications** – Browser notifications when a saved route’s AQI drops below your threshold (client polling)
- **Persistent storage** – Routes and settings saved locally (IndexedDB/localStorage)

## Screenshots

Open the app to see the demo route (Bangalore Home → Office) with the map and AQI visualization.

## API Keys

### OpenAQ (required for AQI data)

1. Sign up at [explore.openaq.org/register](https://explore.openaq.org/register)
2. Get your API key from [explore.openaq.org/account](https://explore.openaq.org/account)
3. Create a `.env` file in the project root:

```
VITE_OPENAQ_API_KEY=your-openaq-api-key
```

### OpenRouteService (optional, for routing)

- Default routing uses OSRM (no key required, ~1 req/sec limit)
- For higher limits, get a free key at [openrouteservice.org/dev](https://openrouteservice.org/dev)
- Add to `.env`:

```
VITE_ORS_API_KEY=your-ors-api-key
```

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build & Deploy

```bash
npm run build
```

Output is in `dist/`.

### GitHub Pages

- Set `base: '/your-repo-name/'` in `vite.config.ts` if needed
- Deploy the `dist/` folder to the `gh-pages` branch or use the `gh-pages` package:

```bash
npm install -D gh-pages
# Add to package.json scripts: "deploy": "vite build && gh-pages -d dist"
npm run deploy
```

### Netlify

- Connect the repo
- Build command: `npm run build`
- Publish directory: `dist`

## Best Route Method

The "Suggest best route" feature:

1. Fetches 2–3 alternative routes from OSRM (`alternatives=true`)
2. Samples points along each route
3. Finds nearest OpenAQ stations within 5 km
4. Computes average AQI (weighted by inverse distance to stations)
5. Highlights the route with the lowest average AQI

## Notification Limits

- Uses the Browser Notification API with **client-side polling**
- Polling runs only while the app tab is open
- For true push when the browser is closed, you’d need an optional VAPID server (not included)

## Tech Stack

- React 18 + Vite + TypeScript
- Leaflet + react-leaflet (OpenStreetMap tiles)
- Framer Motion (animations)
- localforage (IndexedDB/localStorage)
- OpenAQ (AQI data)
- OSRM / OpenRouteService (routing)
- Nominatim (geocoding)

## Project Structure

```
src/
├── components/   # MapView, RouteList, ScheduleForm, etc.
├── pages/        # HomePage
├── lib/          # aqi, routing, storage, geocode, notifications
├── hooks/        # useRoutes, useSchedule, useAQIPolling
└── styles/       # global.css
```

## License

MIT
