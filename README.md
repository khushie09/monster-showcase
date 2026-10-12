# Monster Energy - Flavor Showcase (React)

Interactive flavor showcase built with React and Vite.

## Run locally

    npm install
    npm run dev

Then open the address Vite prints (usually http://localhost:5173).

## Build

    npm run build

The static site is written to `dist/`.

## Deploy on Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, click "Add New Project", import the repository, and deploy.
   Vercel detects Vite automatically: build command `npm run build`, output directory `dist`.

## Structure

- `src/App.jsx` - state, headline and description copy, keyboard controls
- `src/components/Showcase.jsx` - the can carousel, spotlight, smoke, light sweep, and splash effects
- `src/components/Dock.jsx` - bottom flavor bar
- `src/data.js` - flavors, colors, images, and copy (edit here to change products)
- `src/styles.css` - all styles
- `src/assets/` - the cut-out can images

## Notes

- ENERGY, STORY, and SHOP in the header are placeholders.
- Ultra Black is not included yet (no photo was provided).
