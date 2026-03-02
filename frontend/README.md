# Cinematic Landing Page (Next.js)

A user-friendly, premium-style landing page inspired by your reference image and `vid2 (1).gif`.

## Stack Decision

- Framework: `Next.js` (App Router)
- Styling: `Tailwind CSS`
- Why not switch to Vite: this project already had a Next.js scaffold, and Next.js gives production-ready routing, image optimization, and a cleaner path for future backend/auth features.

## Assets Used

- Hero background animation: `public/hero-background.gif`
- Inspiration panel image: `public/inspo-reference.png`

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Additional route:

- `http://localhost:3000/confidence` for the futuristic confidence/permissions layout.
- Governance mapping utilities: `src/lib/governance.ts` (`getMode`, `getGovernanceConfig`).
- Global confidence state store: `src/lib/store.ts` (Zustand + localStorage persist).
- Governance helper hook: `src/lib/use-governance.ts`.
- Mock agent run generator: `src/lib/mockRun.ts` (timeline feed for workspace panel).
- Diff viewer highlights risky lines and links to finding popover details in workspace.
- Confidence slider uses smooth drag with discrete band snapping (`0`, `50`, `100`) mapped to Assist/Pair/Autopilot.
- Confidence is stored per selected project from the confidence page project selector.
- Workspace save flow supports in-app project persistence and optional `.zip` download export.

## Tests

Unit tests are included for ledger schemas/utilities:

```bash
npm run test
```

Watch mode:

```bash
npm run test:watch
```

## Evidence Logging (Demo-Grade)

Typed ledger event schemas are in `src/lib/evidence-ledger.ts`.
The CTA click appends an event to local storage using:

- `timestamp`
- `actor`
- `agentRole`
- `actionType`
- `resourcesTouched`
- `diffHash`
- `testHashes`
- `approvals`

This implementation is append-only in behavior (new events are appended to prior history).

## Design System (Landing Page)

Reusable tokens are defined in `src/lib/design-system.ts`:

- Typography: hero, h2, body, eyebrow
- Spacing: container, hero section, content section
- Buttons: pill primary + outline variants
- Cards: glass card + hover glow

Reusable UI primitives:

- `src/components/ui/Container.tsx`
- `src/components/ui/Section.tsx`
- `src/components/ui/PillButton.tsx`
- `src/components/ui/GlassCard.tsx`

## Motion + Scrolling UX

- Hero entrance animations use `framer-motion` for eyebrow/headline/subtext sequencing.
- Reduced-motion preferences are respected via `useReducedMotion` and zero-motion fallbacks.
- Scroll behavior uses CSS smooth scrolling with JS fallback for anchor navigation.
- Scroll snap is tuned for comfort (`proximity` on mobile/Safari, `mandatory` on desktop).

## Performance + Accessibility

- Reduced expensive glows/blur usage to lower repaint/compositing cost.
- Improved text contrast on body/supporting copy for readability on dark backgrounds.
- Added keyboard-visible focus rings on navbar controls.
- FAQ section uses semantic `details/summary` for keyboard-friendly disclosure behavior.
- Maintained heading hierarchy (`h1` hero, `h2` section titles, `h3` card/FAQ items).

## Dependency Review

Added dependencies:

- `vitest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `jsdom`
- `framer-motion`
- `zustand`
- `jszip`

Reason:

- Needed a lightweight unit test setup for feature coverage and regression checks.
- Needed subtle entrance animations with reduced-motion accessibility controls.
- Needed global persisted app state for confidence mode selection.
- Needed client-side ZIP export for project files when users download to device.

License note:

- These packages are commonly distributed under permissive licenses (MIT-style); confirm exact license text during production legal review.

Minimal alternative considered:

- Node built-in test runner without additional packages. Rejected because it adds friction for React/DOM-oriented tests and weaker ergonomics for frontend unit coverage.
- CSS-only keyframe transitions for hero content. Rejected because it is harder to orchestrate staggered entrance timing while cleanly honoring reduced-motion preferences.
- Manual blob export as plain JSON. Rejected because requirement is archive export with project file paths preserved.
