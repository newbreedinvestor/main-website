# New Breed site — Deploy Guide

## The one thing you must know: TWO repos serve newbreedinvestor.io

| Path | Served from | Deploy method |
|---|---|---|
| `/ws-webinar/*` (registration + thankyou) | `newbreedinvestor/webinar-ws-landing-funnel` (private) | push to its main branch → Cloudflare |
| Everything else — homepage, `/scale-session/`, `/start/`, `/onboarding/`, `/webinar-replay/`, `/images/`, `/privacy.html`, `/terms.html` | `newbreedinvestor/main-website` (this repo) | push to `main` → Cloudflare Pages auto-deploys |

A Cloudflare route claims `/ws-webinar/*` and serves the funnel project there.
Consequences:

- The `ws-webinar/` folder **in this repo is dead code** — it is shadowed by the
  route and never served. Editing it does nothing. (This is why the June
  "registered" page pushed here never went live.)
- Redirects for `/ws-webinar/...` URLs must live in the **funnel repo's**
  `_redirects`, not this one.
- Never create new pages under a `ws-webinar*` path prefix in this repo
  (see Phil's 2026-06-30 webinar-replay commit — routing collision).

## Asset layout

- Root `styles.css`, `animations.js`, `images/` (this repo) are shared by the
  scale-session pages via absolute paths (`/styles.css`).
- The funnel repo is self-contained: its pages use relative paths, resolving to
  `/ws-webinar/styles.css` etc. from its own copies.
- Legal pages `/privacy.html` and `/terms.html` live in this repo; funnel pages
  link to them absolutely.

## Funnel flow

`/ws-webinar/` → form POST to GHL webhook → `/ws-webinar/thankyou.html`
(Meta Lead fires once via sessionStorage flag) → `/scale-session/` (Calendly
inline widget) → `/scale-session/booked/` (Meta Schedule fires).

## Pre-deploy checklist

Tracking parity — every funnel/booking page must have ALL of:
- [ ] Google Tag Manager (GTM-KGTLBKV6) — head script + body noscript
- [ ] Microsoft Clarity (x556suj2xr)
- [ ] Meta Pixel (734895069233033) with correct events:
      registration = PageView | thankyou = PageView + gated Lead |
      scale-session = PageView | booked = PageView + Schedule

Content:
- [ ] Serve the repo locally and click through the full funnel; all links resolve
- [ ] Webinar duration says 60 minutes everywhere
- [ ] Consent checkbox with STOP/opt-out language, linking /terms.html + /privacy.html
- [ ] Earnings disclaimer in every footer
- [ ] No page promises a deliverable the next page doesn't fulfill

## Post-deploy verification

The site serves the homepage with HTTP 200 for ANY unknown URL, so a 200 means
nothing — check page titles:

```bash
for u in ws-webinar/ ws-webinar/thankyou.html scale-session/ scale-session/booked/ privacy.html terms.html styles.css; do
  echo "== $u"; curl -s "https://newbreedinvestor.io/$u" | head -c 400 | grep -o "<title>[^<]*" || echo "(asset)"
done
```

- [ ] Each page shows its own title (NOT "Scale to 3-5 Deals a Month" = homepage fallback)
- [ ] `/styles.css` returns CSS, not HTML
- [ ] Submit a test registration; confirm the contact lands in GHL and Lead fires
      once in Meta Events Manager (Test Events tab)
- [ ] Book a test Calendly slot; confirm redirect to `/scale-session/booked/` and Schedule fires

## Standing rules

- Ads and emails always point at full `/ws-webinar/...` URLs, never root shortcuts.
- Never rename a live URL; add a redirect instead (in the repo that owns the path).
- One variable at a time on A/B tests, and variant tracking must match the control exactly.
- After every deploy, log it in `context/cmo-learnings.md` (Tim's EA repo) and
  check Meta Events Manager 7 days later.

## Manual settings that live outside these repos

- Calendly event `newbreed-strategy-session-clone`: rename the slug (remove
  "clone"), set post-booking redirect to `https://newbreedinvestor.io/scale-session/booked/`.
- GHL workflows: nothing should link to `/ws-webinar/registered/` (removed; the
  funnel repo redirects it to the thankyou page).
- `support@newbreedinvestor.io` (contact on privacy/terms) must be a monitored inbox.
