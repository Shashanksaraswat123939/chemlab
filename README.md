# ChemLab — Qualitative Salt Analysis

**Live:** see the Vercel project for this repo

> The Vercel project was created with Deployment Protection on, so the link asks
> for a Vercel login. To open it to everyone:
> **Vercel → chemlab → Settings → Deployment Protection → Vercel Authentication → Disabled → Save.**

A drag-and-drop chemistry lab for the qualitative analysis of a simple salt,
following the CBSE Class XI practical scheme. Identify the anion and the cation
of an unknown salt by doing the tests, not by reading the answer.

**One file, no build step, no dependencies.** Open `index.html` in a browser.

## What it does

- **37 salts** across 12 cations and 5 anions, with the **SA1 practical three** —
  ammonium carbonate, lead nitrate and aluminium sulphate — as the default pool.
- **A rule engine, not a lookup table.** Reagents combine in the vessel, so the
  result depends on everything in it: order, excess, and whether it was heated.
- **The full procedure**: physical examination, flame and ash tests, preliminary
  and confirmatory anion tests, cation group separation, confirmatory cation tests.
- **Drag and drop**, mouse or touch — and every control also works from the
  keyboard (Tab to a reagent, Enter to add it to the active vessel).
- **Notebook** of experiment / observation / inference, printable as a lab record.

## The two modes

- **Learning** shows the inference for every observation, a *Why it works* note on
  each test, and a comparison of how all three SA1 salts behave — both inline under
  the selected test and, in the **Compare** tab, for every test at once.
- **Test** keeps the procedure but hides the inferences. A per-observation
  *Show inference* button is there when you want to check yourself, and reporting a
  result gives back the tests that actually decide the salt and which of them you did.

## Observation pop-up

The box beside the vessel shows the **result only**, in two or three bullets —
"Brisk effervescence / Colourless, odourless gas" — never the setup. Taking the
salt, dissolving it, or adding a reagent on its own shows nothing at all.
Every observation for the three SA1 salts is drawn from the practical records.

## Other

- **Dark mode** is a second hand-built palette, not an inversion: the chemistry
  keeps its own colours and only the room around it is re-lit. It follows the
  system setting until you choose, then stays chosen.
- **Sound** (off by default) for pouring, effervescence and the burner.
- Clicking the ChemLab mark parks a mole of cars outside the lab.

A fresh unknown is drawn on every page load, never repeating the previous one.
Only your settings persist.

## Checking the chemistry

`tools/test-engine.js` runs the page's own rule engine in Node against a stubbed
DOM and evaluates every salt against every test, hot and cold:

    node tools/test-engine.js

`tools/dump.js` prints the full three-salt comparison for eyeballing against the
practical records.

## How it is deployed

The Vercel token available here could deploy files but not link a git repo, so
the Vercel project builds by fetching `index.html` from this repository:

    curl -sfL <raw URL of index.html on main> -o public/index.html

The deployed artefact is therefore byte-identical to `index.html` on `main`, and a
redeploy picks up whatever is on `main`. To replace this with a normal git
integration — a deploy on every push — connect this repository to the project in
the Vercel dashboard (Project → Settings → Git).
