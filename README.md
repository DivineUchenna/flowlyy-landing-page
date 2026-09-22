# Flowlyy landing page

Static HTML, CSS and a little JavaScript. No build step. Open `index.html` in a browser to preview.

## Structure

```
index.html            page markup
css/
  styles.css          all styles
js/
  script.js           product filters, ROI calculator, demo window tabs, email form handlers
assets/
  logo/               Flowlyy logo
  tools/              tool logos used in the hero marquee and footer socials
  founder/            founder photo
  patterns/           dithered divider tile
docs/                 internal notes (not in the repo): agent context, offer, ideal customer profile
design/               Stitch design exports (not in the repo): DESIGN.md, code.html, screen.png
```

`docs/` and `design/` stay on your machine and are listed in `.gitignore`.

## fit-check/ (generated, don't edit here)

`fit-check/` is the qualification funnel that the two "Let's chat" links open (flowly.org.uk/fit-check/). It's copied from `Desktop/AI/Projects/flowlyy-consultation-funnel` by `npm run sync` in that project. Edit the funnel there, then sync; changes made directly in this folder get overwritten.

`vercel.json` sets `trailingSlash: true`, so `/fit-check` redirects to `/fit-check/` and the funnel's relative paths (styles, script, logo) load correctly.

## To do before launch

- Point the email forms at a real endpoint (see the TODO comments in `index.html` and `js/script.js`).
- Replace the `#` social links in the footer with real profile URLs.
