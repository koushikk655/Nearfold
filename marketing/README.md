# Nearfold — Marketing &amp; Brand Assets

Pre-launch marketing and brand artifacts. All static HTML with inline CSS — no framework, no build step.

## Files

| File | Purpose | Public? |
|---|---|---|
| `landing.html` | Canonical landing page (deploy as `/`) | Public |
| `brand-site.html` | Multi-page brand site with hash routes (`/sellers`, `/about`, `/journal`, `/faq`, `/cities`) | Public |
| `social-kit.html` | 9 Instagram posts, 4 stories, captions, 4-week content calendar | Internal team |
| `brand-book.html` | Brand identity book — logo construction, colors, voice, typography, photography | Internal team |

## Local preview

Just open any file in a browser. They're self-contained.

```bash
open landing.html
# or
python3 -m http.server 8000
# then visit http://localhost:8000/
```

## Deployment to nearfold.in

Recommended structure when deploying:

- `landing.html` → rename to `index.html` → served at `/`
- `brand-site.html` → either rename to `sellers.html` (root entry for the multi-page section) **or** split each `<div class="view">` block into its own HTML file (`sellers.html`, `about.html`, `journal.html`, `faq.html`, `cities.html`) with shared nav/footer
- `social-kit.html` and `brand-book.html` → keep behind auth at `/internal/*` or don't deploy publicly

**Static hosts that work out of the box:** Vercel, Netlify, Cloudflare Pages, GitHub Pages.

```bash
# Vercel (from repo root)
vercel deploy

# Or drag-drop the marketing/ folder into Netlify dashboard
```

## Brand rules (pre-launch posture)

- **No public pricing claims.** Specific fees disclosed only at launch. No "₹X per order" anywhere public.
- **Seller CTAs say "Join the seller waitlist"** — onboarding functionality is not yet live.
- **Launch cities not named** — "Your city, soon" is the brand vocabulary.
- **"Locality" — not "neighbourhood"** — Indian vernacular.

## Source

Designs from the Nearfold Design System v1.2 (see the Hyperagent Library). Master index links to component-level specs, motion language, performance principles, and the React Native engineering readme.

— Generated from design artifacts, committed to a feature branch for review before merging to `main`.
