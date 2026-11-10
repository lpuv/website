# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro (static generation), TypeScript, CSS. Dev server via `astro dev`.

## Users

- **Primary:** Recruiters and hiring managers evaluating a computer-engineering undergrad for infrastructure, security, or embedded internships.
- **Secondary:** Peers and potential collaborators who stumble across the site.
- **Tertiary (acknowledged):** Luna — it is also a fun personal website.

## Product Purpose

A portfolio that makes it easy for a visitor to understand what Luna has built, what she can do, and how to reach her. Success means a recruiter can scan credibility in under 30 seconds, then dig into systems records, log posts, or a printable resume if interested.

## Positioning

A broadly-capable systems/infra/security person with real, shipped work (Fedora packaging, McGill Orbital CubeSat C&DH, production internships) and a portfolio that does not take itself too seriously — evidence that she builds for the fun of it, too.

## Operating Context

- Home (`/`): a small walkable room with the red tree from DELTARUNE's Forgotten Man rooms. The man behind the tree talks to visitors (typewriter dialogue, choices) and hands out the resume as an EGG item. Everything in the room is also written out below it (Check / Work / Notes / Save point).
- Systems records (`/systems/*`) documenting infrastructure, security, and personal projects.
- Log/blog (`/log/*`) for longer-form writing.
- Printable resume page (`/resume`).
- Contact page (`/contact`) with email-open and channel list.
- Montréal local-time clock on the save point.
- Placeholder pixel art and synthesized sound are drawn in code; real assets can be dropped into `public/sprites/` and `public/sounds/` (see the READMEs there).
- Deployed at `https://craftcat.dev`.

## Capabilities and Constraints

- All content is real; testimonials, case studies, and social proof must not be fabricated.
- Projects, resume facts, and contact channels are all backed by actual accounts and experience.
- Current security/hacker UI aesthetic (simulated network, threat levels, patch debt) is **not binding**; it originated from an early prototype inspired by xkcd 350 and may be replaced or evolved in future visual work.
- Accessibility: `prefers-reduced-motion` respected; semantic HTML and ARIA in use.

## Brand Commitments

- Name: Luna Puvilland; site identity "craftcat.dev"
- Voice: direct, technically precise, occasionally self-aware (e.g., evil-tetris "really stupid" description)
- **Register: fun but functional, never over the top.** The site should be enjoyable to use and clearly made by a person with a sense of humour, without turning into a performance. Restraint is part of the brand, not a compromise on it.
- **No slop.** The site must not read as assembled from defaults: no template hero, no decorative filler, no effect that exists to look impressive. Every element has a job, and a visitor's first impression should be "well-made thing," not "impressive effect."
- The specific visual world is not binding — the current instrument-panel look is incumbent implementation, not a commitment. The register above is binding.

## Evidence on Hand

- Existing brand assets: `public/favicon.svg`, `public/og.png`
- Real project write-ups in `src/content/systems/` (nix-lab, evil-tetris, CVE-2012-2982, grimoire, infra-k8s, etc.)
- Log posts in `src/content/log/`
- Full resume with education, experience, skills
- Live GitHub activity via `api.github.com`
- No testimonials or client quotes exist

## Product Principles

1. **Show real work, not aspirational work.** Every project record describes something that was actually built and shipped or reasoned through.
2. **Let recruiters scan fast, then opt into depth.** The surface should surface credibility immediately; detailed records are one click away.
3. **Fun is a feature, not a bug — but it lives in the content, not in spectacle.** A portfolio that includes "really stupid" games alongside CubeSat firmware signals breadth and genuine curiosity. The humour belongs in what the work says and in small mechanical details; it never justifies an effect that exists only to be noticed.
4. **Never fake authority.** No invented companies, testimonials, or inflated titles.
5. **Performance is credibility.** The site should load fast and run smoothly, because a slow portfolio undermines the infra claims.

## Accessibility & Inclusion

- `prefers-reduced-motion` respected throughout.
- Canvas network map includes keyboard controls, ARIA labels, and screen-reader-only descriptions.
- No product-specific compliance requirement was established beyond WCAG 2.1 AA best-effort.
