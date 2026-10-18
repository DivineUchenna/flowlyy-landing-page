# Flowlyy landing page

A single static page. All CSS and JavaScript live inside `index.html`, so there's no build step.

## Preview locally

```
python3 -m http.server 8765
```

Then open http://127.0.0.1:8765. Opening `index.html` straight from Finder also works.

## Structure

```
index.html          the whole page (markup, styles, scripts)
assets/
  logo/             Flowlyy logo
  tools/            tool logos for the scrolling strip under the hero
  footer/           moon-landscape footer image (webp + jpg fallback)
  founder/          founder photo (not used on the current page)
fit-check/          roofing qualification funnel (generated, see below)
vercel.json         trailingSlash: true
```

`docs/` and `design/` stay on your machine and are listed in `.gitignore`.

## Page sections

Hero (interactive agent demo), tool logo strip, what we build (client acquisition is the main service), "See what Flowlyy can do" interactive previews, how it works, pricing (no prices, scoped on a call), FAQ, closing call to action, footer.

The Meta Pixel (ID 1587701063397395) is in the `<head>` and fires a PageView.

## fit-check/ (generated, don't edit here)

Copied from `Desktop/AI/Projects/flowlyy-consultation-funnel` by `npm run sync` in that project. Not linked from the homepage.

## Before launch

- Numbers and names in the mockups and previews are illustrative.
- Tool logos (WhatsApp, Gmail, Calendar, Sheets, GoHighLevel and others) are hand-drawn stand-ins. Swap in official icon files.
