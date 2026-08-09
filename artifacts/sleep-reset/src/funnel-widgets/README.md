# Hotmart funnel widgets

One file per step of the Hotmart Funil de Vendas. `oto1.html` is the 3AM Relapse
Kit, sold on `/kit`. The files are empty until somebody pastes into them, and
empty is a working state: the page falls back to a normal checkout link.

## How to fill one

In the Hotmart panel, Produtos > Funil de Vendas > the step > the `</>` icon
(or "Codigo do Widget", top right of the step editor). Copy the HTML exactly as
given and paste it into the file, replacing everything. Then build and deploy.
Nothing else changes: `/kit` renders whatever is in the file in place of its own
buy button and puts back the line saying the card is not asked for again.

## Why the file cannot be written in advance

The widget is generated per funnel step and carries that step's own identifiers,
so there is no generic version of it and no way to derive one. The help centre
documents where to copy it from (articles `220402348` and `43101499107597`) and
never shows what it contains. It exists only once the step exists.

## What changes the day it is pasted

Today the Yes button on `/kit` is a normal checkout link: the buyer types the
card a second time, ninety seconds after typing it the first time, which is the
whole reason a one click upsell earns more than a link. The widget is Hotmart
charging the card already on file. Both buttons, Yes and No, come inside it, so
the page stops rendering its own.

## The two rules a widget file has to respect

- **Comments and whitespace do not count as content.** `widgetMarkup()` strips
  them, so a file holding only a note still reads as empty. Keep notes short:
  whatever is in the file ships inside the JavaScript bundle.
- **An embed that does not draw is treated as absent.** `/kit` measures the
  container and puts its own buttons back if nothing appeared within 2.5s, so a
  blocked or broken widget never leaves a buyer on a page with no way forward.
  It logs `kit_widget` or `kit_widget_dead` either way.
