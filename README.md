# Nord Ledger

**Angular 21 + TypeScript + RESTful API digital banking sandbox**

Nord Ledger is an original portfolio demonstration of a fictional Nordic digital banking experience. It connects a production Angular 21 single-page application to a real HTTP/JSON API running in a JavaScript Worker. No bank accounts, actual cards, private customer data, real payments, or external banking services are involved.

**Design system:** Open [`/design-system`](./design-system/) alongside the running application to explore the shared semantic tokens, reusable controls, card finishes, interactive states, typography and accessibility guidance. The [design-system source guide](design-system/README.md) explains the architecture and component contracts.

## What works

- Five responsive sections: Overview, Accounts, Payments, Insights and Cards, plus a Profile & Settings drawer.
- Account data and transaction history fetched from the REST API.
- Account-to-account transfers with funds checks and idempotency keys.
- New transfer records visible immediately, with both debit and credit entries.
- Card freeze/unfreeze, online/contactless/international payment switches, and daily spending limits through PATCH endpoints.
- A Card Design Studio with Nordic, Aurora and Carbon finishes, live preview, tilt and front/back flip. Only fictional, masked card information is shown.
- A Card Collection flow with five product concepts (Everyday, Travel, Virtual, Premium and Credit Concept), product comparison, linked demo account selection, finish customization and review.
- Issue optional fictional cards from the REST API, view card-management event history, close optional cards and reissue them later. Original Everyday and Travel cards cannot be removed.
- Editable demo profile name, email, interface language and notification preferences through the REST API; cardholder labels update when the profile name changes.
- A Security tab to explore fictional security preferences. Its switches are **illustrative only** and do not provide authentication, device enrollment or a real security guarantee.
- Transaction search, account filtering, CSV export and demo reset.
- Spending distribution, weekly illustration and budget comparison.
- Loading, success, empty and error states, plus keyboard-friendly controls.
- A standalone Nord Ledger Design System explorer with live component states and source-shared tokens.

## Stack

- Angular 21 standalone components and signals
- TypeScript, RxJS and Angular `HttpClient`
- Native CSS design system (tokens, component states, responsive layout)
- Framework-neutral design primitives shared between the Angular product and a dedicated `/design-system` showcase
- JavaScript REST API bundled as Cloudflare Worker ESM
- No third-party UI kits or charting dependencies

## Start locally

Requires Node.js compatible with Angular 21 and npm.

```bash
npm install
npm run build
npm run dev
```

Open `http://localhost:3000` to use the fully functional frontend + API together. To develop Angular UI only, `npm start` runs the Angular dev server but does **not** proxy API requests. Rebuild before starting the full-stack local server to include the latest UI code.

Run API smoke tests after building:

```bash
npm test
```

Design-system source is under `src/design-system/`, with the browsable explorer under `design-system/`. The build copies the shared CSS to the explorer and bundles everything into the same Worker. Visit `http://localhost:3000/design-system` after `npm run dev`.

## REST endpoints

| Method | Route | Behavior |
| --- | --- | --- |
| `GET` | `/api/health` | API health and version |
| `GET` | `/api/overview` | Create or resume demo session and return overview |
| `GET` | `/api/accounts` | Read account balances |
| `GET` | `/api/transactions?account=everyday` | Search account transactions by account ID |
| `GET` | `/api/cards` | Read fictional cards |
| `GET` | `/api/card-products` | Read the available card collection and eligibility options |
| `POST` | `/api/cards` | Add a new optional fictional card to the demo wallet |
| `GET` | `/api/cards/:id/activity` | Read demo card-management events, not purchase transactions |
| `DELETE` | `/api/cards/:id` | Close an optional card; original cards remain protected |
| `GET` | `/api/profile` | Read the fictional customer profile and preferences |
| `PATCH` | `/api/profile` | Update name, email, language, notifications and security-preview preferences |
| `PATCH` | `/api/cards/:id` | Freeze, change finish, set daily limit or configure payment switches |
| `GET` | `/api/insights` | Spending and budget illustration |
| `POST` | `/api/transfers` | Validate and transfer between own demo accounts |
| `POST` | `/api/reset` | Restore original fictional data, even after a demo session expires |

`GET /api/overview` returns `X-Demo-Session`, which must be sent to other endpoints. Transfers additionally require an `Idempotency-Key` header and JSON body:

```json
{
  "fromAccountId": "everyday",
  "toAccountId": "savings",
  "amount": 25.50
}
```

Card changes use `PATCH /api/cards/:id` with fields such as `{"designId":"carbon","dailyLimitCents":150000,"controls":{"online":false}}`. The API validates requested changes before applying them. These are simulated switches: they never authorize or block real-world payments.

Card collection checkout uses `POST /api/cards` with `{ "productId": "virtual-debit", "accountId": "everyday", "designId": "carbon" }`. Valid product IDs are `virtual-debit`, `premium-debit` and `credit-concept` for optional cards. An optional product can appear only once at a time in a session. The Credit Concept is strictly an interface demonstration: **there is no lending, credit application, approval, debt, interest or real credit limit**.

## Safety and scope

**Not a bank or banking-grade reference architecture.** The backend uses temporary, per-session in-memory demo data, which can reset when a Worker instance restarts. It has no persistent database, user authentication, account ownership verification, card-issuing processor, payment rails, compliance controls, encryption-at-rest claims, or audit-grade ledger. Card activity is management-event history, not a purchase ledger. The Profile Security controls are UI demonstrations, not implemented protections. All names, balances and card details are invented. To make this production-capable, you would need regulated financial infrastructure, database-backed double-entry accounting, strong auth, authorization, audit logging, rate limits, reconciliation, secrets management, and dedicated security review.

## Deployment structure

`npm run build` compiles Angular into `dist/angular/browser`, then embeds those assets in `dist/server/index.js`, alongside same-origin REST routes. The generated Worker is what the Site deploys; source is under `src/` and `worker/`.

Designed and engineered as an original fintech interface demo.

© 2026 Sandeep Pariyar. All rights reserved. See [Copyright and use](COPYRIGHT.md). Public source visibility does not grant an open-source license.
