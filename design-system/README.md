# Nord Ledger Design System · v1.0

**Purpose:** a reusable design foundation for a banking interface, with a separate browsable specimen gallery. The system is source-controlled with the Angular 21 application so product code and design decisions evolve together.

## Live explorer

When the application is running, visit `/design-system` for the interactive style guide. The same `src/design-system/tokens.css` and `components.css` are compiled into Angular and copied as public assets for the explorer.

## Layers

| Layer | Source | Responsibility |
| --- | --- | --- |
| Foundations | `src/design-system/tokens.css` | Colors, type scale, space, radius, elevation, motion, focus, card finishes |
| Primitives | `src/design-system/components.css` | Buttons, text fields, switches, badges, surfaces, avatar, rows, segmented controls, navigation, skeleton |
| Product patterns | `src/app.html` + `src/app.css` | Account cards, transfers, profile, payment controls, card-selection journey |
| Explorer | `design-system/index.html` + `studio.css` + `studio.js` | Live examples, variants, state previews, guidance |

## Token taxonomy

- **Brand** (`--nl-forest`, `--nl-lime`): primary actions and selection, with accessible focus using `--nl-focus`.
- **Surface** (`--nl-canvas`, `--nl-surface`, `--nl-surface-muted`): depth via adjacent surfaces, not gratuitous shadows.
- **Text** (`--nl-text`, `--nl-text-strong`, `--nl-text-muted`): a clear hierarchy for numeric information and secondary guidance.
- **Feedback** (`--nl-success`, `--nl-warning`, `--nl-danger`): never communicate status with color alone.
- **Card finishes** (`--nl-card-*`): design freedom separated from card content and behavior.
- **Geometry** (`--nl-space-*`, `--nl-radius-*`, `--nl-shadow-*`): a 4px base rhythm and consistent elevation.
- **Motion** (`--nl-duration-*`, `--nl-ease-standard`): restrained transitions with reduced-motion support.

## Component contracts

Use semantic HTML and apply CSS classes; these are framework-neutral primitives.

```html
<button class="nl-button nl-button--primary">Confirm transfer</button>
<button class="nl-button nl-button--secondary">Cancel</button>

<label class="nl-label" for="reference">Reference</label>
<input class="nl-field" id="reference" aria-describedby="reference-help">
<p class="nl-field-help" id="reference-help">Optional, visible to you.</p>

<button class="nl-toggle" aria-pressed="false">
  <span class="nl-toggle-track" aria-hidden="true"></span>
  <span>Notifications</span>
</button>
```

**Variants:** primary, accent, secondary, quiet. **States:** default, hover, focus, disabled, loading, invalid, selected, success, warning, danger.

## Interaction principles

1. Lead with **the task**: amount, account, recipient, action.
2. Show **system feedback**: progress, success, errors, and reversible controls.
3. Separate **decorative personalization** from operational status and data.
4. Use **one primary action** per decision context; keep irreversible decisions explicit.
5. Start with **keyboard and accessibility semantics**, then add polish.
6. Prefer **tabular numerals** in balances and ledgers, and use masked card references.

## Quality target and verification

- Target WCAG 2.2 AA. This is **not a claim of certification**: complete automated, manual contrast and assistive technology audits would be needed for production.
- Both the app and explorer use accessible labels, visible keyboard focus, readable responsive layouts and `prefers-reduced-motion` handling.
- The explorer uses only local static assets. No accounts, credentials or personal information are collected.
- Card and banking product UI is explicitly fictitious; the app is not a regulated financial service.

## Why one repository?

The design system can be extracted later when several products consume it. At this stage a separate repository/package would add release coordination without clear consumers. A browsable subpath and source-separated tokens demonstrate maturity while keeping code and UX in sync.

© 2026 Sandeep Pariyar. All rights reserved.
