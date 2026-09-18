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

## To do before launch

- Point the email forms at a real endpoint (see the TODO comments in `index.html` and `js/script.js`).
- Replace the `#` social links in the footer with real profile URLs.
