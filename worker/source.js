/*
 * Nord Ledger demo API. All records are invented, isolated by a browser-held
 * demo session ID, and deliberately ephemeral. This is NOT a banking backend.
 * The build embeds the compiled Angular assets in __SITE_ASSETS__.
 */
const ASSETS = __SITE_ASSETS__;
const sessions = new Map();
const maxSessions = 250;
const cardProducts = [
  {id: 'everyday-debit', name: 'Everyday debit', category: 'Debit', format: 'Physical', subtitle: 'Your everyday essential', description: 'A simple debit card linked to your current account.', accountIds: ['everyday'], defaultAccountId: 'everyday', designId: 'nordic', last4: '4829', highlights: ['Everyday spending', 'Instant freeze', 'Contactless'], included: true},
  {id: 'travel-debit', name: 'Travel debit', category: 'Travel', format: 'Physical', subtitle: 'Made for moving', description: 'A separate debit card for your travel pocket.', accountIds: ['travel'], defaultAccountId: 'travel', designId: 'aurora', last4: '0704', highlights: ['Travel pocket', 'International switch', 'Spending controls'], included: true},
  {id: 'virtual-debit', name: 'Virtual debit', category: 'Virtual', format: 'Digital', subtitle: 'Ready when you are', description: 'A digital-only concept for online purchases. No real card number is issued.', accountIds: ['everyday', 'travel'], defaultAccountId: 'everyday', designId: 'carbon', last4: '9102', highlights: ['Digital-only', 'Online control', 'Close anytime'], included: false},
  {id: 'premium-debit', name: 'Premium debit', category: 'Premium', format: 'Physical concept', subtitle: 'Considered in every detail', description: 'A premium debit-card concept with exclusive finishes, but no paid benefits or fees.', accountIds: ['everyday', 'travel'], defaultAccountId: 'everyday', designId: 'carbon', last4: '8820', highlights: ['Signature finish', 'Personalized controls', 'No demo fees'], included: false},
  {id: 'credit-concept', name: 'Credit concept', category: 'Credit', format: 'Concept only', subtitle: 'Explore the possibilities', description: 'A visual credit-card prototype. No borrowing, credit limit, interest or credit approval exists.', accountIds: ['everyday'], defaultAccountId: 'everyday', designId: 'aurora', last4: '3168', highlights: ['Visual prototype', 'No borrowing facility', 'Demo controls only'], included: false}
];

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};
const githubPagesOrigin = 'https://sandeepariyar.github.io';

// The public GitHub Pages build talks to this demo API across origins. Limit
// browser CORS access to our published Pages origin, and expose the temporary
// session header the Angular frontend needs to retain its sandbox state.
function withDemoCors(request, response) {
  if (request.headers.get('Origin') !== githubPagesOrigin) return response;
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('Access-Control-Allow-Origin', githubPagesOrigin);
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, X-Demo-Session, Idempotency-Key');
  responseHeaders.set('Access-Control-Expose-Headers', 'X-Demo-Session');
  responseHeaders.set('Access-Control-Max-Age', '600');
  responseHeaders.set('Vary', 'Origin');
  return new Response(response.body, {status: response.status, statusText: response.statusText, headers: responseHeaders});
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {status, headers: {...headers, ...extraHeaders}});
}

function makeSession() {
  const id = crypto.randomUUID();
  const session = {
    id,
    createdAt: Date.now(),
    customer: {
      name: 'Alex Morgan', firstName: 'Alex', initials: 'AM', memberSince: '2021',
      email: 'alex.morgan@example.com', city: 'Oulu, Finland',
      language: 'English', notifications: {email: true, push: true},
      securityPreview: {twoFactor: false, biometric: false}
    },
    accounts: [
      {id: 'everyday', name: 'Everyday account', type: 'Current', iban: 'DEMO ···· 4829', balanceCents: 1245085, color: 'forest', accent: '#b8f680'},
      {id: 'savings', name: 'Growth savings', type: 'Savings', iban: 'DEMO ···· 9281', balanceCents: 2983570, color: 'mint', accent: '#d8e9de'},
      {id: 'travel', name: 'Travel pocket', type: 'Pocket', iban: 'DEMO ···· 0704', balanceCents: 325390, color: 'peach', accent: '#f5ded2'}
    ],
    transactions: [
      {id: 'tx-01', accountId: 'everyday', name: 'Northstar Studio', detail: 'Salary payment', category: 'Income', amountCents: 485000, date: '2026-11-25', icon: 'briefcase'},
      {id: 'tx-02', accountId: 'everyday', name: 'Koru Market', detail: 'Groceries', category: 'Groceries', amountCents: -8640, date: '2026-11-24', icon: 'shopping-bag'},
      {id: 'tx-03', accountId: 'everyday', name: 'Arctic Coffee', detail: 'Food & drink', category: 'Dining', amountCents: -1280, date: '2026-11-24', icon: 'coffee'},
      {id: 'tx-04', accountId: 'everyday', name: 'Northern Rail', detail: 'Transport', category: 'Transport', amountCents: -2940, date: '2026-11-23', icon: 'train'},
      {id: 'tx-05', accountId: 'everyday', name: 'Lumina Living', detail: 'Home & lifestyle', category: 'Shopping', amountCents: -14590, date: '2026-11-22', icon: 'home'},
      {id: 'tx-06', accountId: 'everyday', name: 'Streamline+', detail: 'Subscriptions', category: 'Subscriptions', amountCents: -1599, date: '2026-11-20', icon: 'play'},
      {id: 'tx-07', accountId: 'travel', name: 'Travel pocket top-up', detail: 'Internal transfer', category: 'Transfer', amountCents: 12000, date: '2026-11-18', icon: 'repeat'}
    ],
    cards: [
      {id: 'everyday-card', productId: 'everyday-debit', accountId: 'everyday', name: 'Everyday debit', last4: '4829', expires: '08/29', frozen: false, holder: 'ALEX MORGAN', designId: 'nordic', dailyLimitCents: 300000, controls: {online: true, contactless: true, international: false}, removable: false},
      {id: 'travel-card', productId: 'travel-debit', accountId: 'travel', name: 'Travel debit', last4: '0704', expires: '04/28', frozen: false, holder: 'ALEX MORGAN', designId: 'aurora', dailyLimitCents: 150000, controls: {online: true, contactless: true, international: true}, removable: false}
    ],
    cardEvents: [
      {id: crypto.randomUUID(), cardId: 'everyday-card', label: 'Everyday debit is ready', detail: 'Original demo card', date: new Date().toISOString()},
      {id: crypto.randomUUID(), cardId: 'travel-card', label: 'Travel debit is ready', detail: 'Original demo card', date: new Date().toISOString()}
    ],
    insights: {
      month: 'November 2026',
      monthlyIncomeCents: 485000,
      monthlySpendCents: 253820,
      previousMonthlySpendCents: 279400,
      categories: [
        {name: 'Home & bills', amountCents: 98000, color: '#173f38'},
        {name: 'Groceries', amountCents: 62500, color: '#81ad82'},
        {name: 'Shopping', amountCents: 41900, color: '#bde88b'},
        {name: 'Transport', amountCents: 28600, color: '#f6c6ab'},
        {name: 'Other', amountCents: 22820, color: '#d9e2dd'}
      ],
      weeklySpendCents: [39800, 54200, 43700, 68700, 47420],
      budgetCents: 320000
    },
    idempotency: new Map()
  };
  if (sessions.size >= maxSessions) {
    const oldest = [...sessions.values()].sort((a, b) => a.createdAt - b.createdAt)[0];
    if (oldest) sessions.delete(oldest.id);
  }
  sessions.set(id, session);
  return session;
}

function findSession(request) {
  const id = request.headers.get('X-Demo-Session');
  return id && sessions.get(id);
}

function overview(session) {
  return {
    sandbox: true,
    persistence: 'temporary',
    customer: session.customer,
    accounts: session.accounts,
    transactions: session.transactions,
    cards: session.cards,
    insights: session.insights,
    totalBalanceCents: session.accounts.reduce((s, a) => s + a.balanceCents, 0)
  };
}

function addCardEvent(session, cardId, label, detail) {
  session.cardEvents.unshift({id: crypto.randomUUID(), cardId, label, detail, date: new Date().toISOString()});
  if (session.cardEvents.length > 80) session.cardEvents.length = 80;
}

async function transfer(request, session) {
  const key = request.headers.get('Idempotency-Key');
  if (!key || key.length > 128) return json({error: 'An idempotency key is required.'}, 400);
  if (session.idempotency.has(key)) return json(session.idempotency.get(key));
  let body;
  try {body = await request.json();} catch {return json({error: 'Invalid JSON payload.'}, 400);}

  const amount = body?.amount;
  const from = session.accounts.find(account => account.id === body?.fromAccountId);
  const to = session.accounts.find(account => account.id === body?.toAccountId);
  if (!from || !to || from.id === to.id) return json({error: 'Choose two different demo accounts.'}, 400);
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || amount > 50000 || Math.abs(Math.round(amount * 100) - amount * 100) > 0.000001) {
    return json({error: 'Enter an amount from €0.01 to €50,000 with at most two decimals.'}, 400);
  }
  const cents = Math.round(amount * 100);
  if (from.balanceCents < cents) return json({error: 'Insufficient funds in the selected demo account.'}, 409);

  from.balanceCents -= cents;
  to.balanceCents += cents;
  const id = crypto.randomUUID();
  const date = new Date().toISOString().slice(0, 10);
  session.transactions.unshift(
    {id: `${id}-out`, accountId: from.id, name: to.name, detail: 'Transfer sent', category: 'Transfer', amountCents: -cents, date, icon: 'repeat'},
    {id: `${id}-in`, accountId: to.id, name: from.name, detail: 'Transfer received', category: 'Transfer', amountCents: cents, date, icon: 'repeat'}
  );
  const result = {success: true, reference: id.slice(0, 8).toUpperCase(), overview: overview(session)};
  session.idempotency.set(key, result);
  return json(result, 201);
}

async function api(request, url) {
  if (request.method === 'GET' && url.pathname === '/api/health') return json({status: 'ok', api: 'Nord Ledger Demo REST API', version: '1.0.0'});
  if (request.method === 'GET' && url.pathname === '/api/overview') {
    const session = findSession(request) || makeSession();
    return json(overview(session), 200, {'X-Demo-Session': session.id});
  }
  const session = findSession(request);
  // Reset must recover from an expired or recycled Worker session. Requiring
  // an existing session here made the visible Reset button fail with HTTP 401.
  if (request.method === 'POST' && url.pathname === '/api/reset') {
    if (session) sessions.delete(session.id);
    const fresh = makeSession();
    return json(overview(fresh), 200, {'X-Demo-Session': fresh.id});
  }
  if (!session) return json({error: 'Demo session expired. Reload to start a fresh sandbox.'}, 401);
  if (request.method === 'GET' && url.pathname === '/api/accounts') return json(session.accounts);
  if (request.method === 'GET' && url.pathname === '/api/transactions') {
    const accountId = url.searchParams.get('account');
    return json(accountId ? session.transactions.filter(tx => tx.accountId === accountId) : session.transactions);
  }
  if (request.method === 'GET' && url.pathname === '/api/cards') return json(session.cards);
  if (request.method === 'GET' && url.pathname === '/api/card-products') return json(cardProducts);
  if (request.method === 'POST' && url.pathname === '/api/cards') {
    let body;
    try {body = await request.json();} catch {return json({error: 'Invalid JSON payload.'}, 400);}
    if (!body || typeof body !== 'object' || Object.keys(body).some(key => !['productId', 'accountId', 'designId'].includes(key))) return json({error: 'Invalid card application.'}, 400);
    const product = cardProducts.find(item => item.id === body.productId);
    if (!product) return json({error: 'Choose an available demo card product.'}, 400);
    if (product.included) return json({error: 'This card is already included in your demo wallet.'}, 409);
    if (session.cards.some(card => card.productId === product.id)) return json({error: 'You already have this demo card.'}, 409);
    if (session.cards.length >= cardProducts.length) return json({error: 'Demo wallet is full.'}, 409);
    if (!product.accountIds.includes(body.accountId)) return json({error: 'Choose an eligible linked demo account.'}, 400);
    if (!['nordic', 'aurora', 'carbon'].includes(body.designId)) return json({error: 'Choose a valid card finish.'}, 400);
    const card = {
      id: `${product.id}-card`, productId: product.id, accountId: body.accountId,
      name: product.name, last4: product.last4, expires: '11/30',
      holder: session.customer.name.toUpperCase(), designId: body.designId, frozen: false,
      dailyLimitCents: 150000, controls: {online: true, contactless: product.format !== 'Digital', international: false}, removable: true
    };
    session.cards.push(card);
    session.cardEvents = session.cardEvents.filter(event => event.cardId !== card.id);
    addCardEvent(session, card.id, 'Card added to demo wallet', `${product.name} · ${product.format}`);
    return json({card, overview: overview(session)}, 201);
  }
  const activityMatch = url.pathname.match(/^\/api\/cards\/([^/]+)\/activity$/);
  if (request.method === 'GET' && activityMatch) {
    if (!session.cards.some(card => card.id === activityMatch[1])) return json({error: 'Demo card not found.'}, 404);
    return json(session.cardEvents.filter(event => event.cardId === activityMatch[1]));
  }
  if (request.method === 'GET' && url.pathname === '/api/profile') return json(session.customer);
  if (request.method === 'GET' && url.pathname === '/api/insights') return json(session.insights);
  if (request.method === 'POST' && url.pathname === '/api/transfers') return transfer(request, session);
  if (request.method === 'PATCH' && url.pathname === '/api/profile') {
    let body;
    try {body = await request.json();} catch {return json({error: 'Invalid JSON payload.'}, 400);}
    const name = body?.name?.trim();
    const email = body?.email?.trim();
    if (typeof name !== 'string' || name.length < 2 || name.length > 70) return json({error: 'Enter a display name between 2 and 70 characters.'}, 400);
    if (typeof email !== 'string' || email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({error: 'Enter a valid demo email address.'}, 400);
    if (!['English', 'Finnish', 'Swedish'].includes(body?.language)) return json({error: 'Unsupported language.'}, 400);
    for (const field of ['email', 'push']) if (typeof body?.notifications?.[field] !== 'boolean') return json({error: 'Invalid notification preference.'}, 400);
    for (const field of ['twoFactor', 'biometric']) if (typeof body?.securityPreview?.[field] !== 'boolean') return json({error: 'Invalid security preview preference.'}, 400);
    const words = name.split(/\s+/);
    session.customer = {
      ...session.customer, name, firstName: words[0],
      initials: words.slice(0, 2).map(word => word[0]?.toUpperCase() || '').join(''),
      email, language: body.language,
      notifications: {email: body.notifications.email, push: body.notifications.push},
      securityPreview: {twoFactor: body.securityPreview.twoFactor, biometric: body.securityPreview.biometric}
    };
    for (const card of session.cards) card.holder = name.toUpperCase();
    return json(overview(session));
  }
  const cardMatch = url.pathname.match(/^\/api\/cards\/([^/]+)$/);
  if (request.method === 'DELETE' && cardMatch) {
    const index = session.cards.findIndex(card => card.id === cardMatch[1]);
    if (index === -1) return json({error: 'Demo card not found.'}, 404);
    if (!session.cards[index].removable) return json({error: 'Original demo cards cannot be closed.'}, 409);
    const [closed] = session.cards.splice(index, 1);
    addCardEvent(session, closed.id, 'Card closed', 'Removed from this temporary demo wallet');
    return json(overview(session));
  }
  if (request.method === 'PATCH' && cardMatch) {
    const card = session.cards.find(c => c.id === cardMatch[1]);
    if (!card) return json({error: 'Demo card not found.'}, 404);
    let body;
    try {body = await request.json();} catch {return json({error: 'Invalid JSON payload.'}, 400);}
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) return json({error: 'No changes supplied.'}, 400);
    if (body.frozen !== undefined && typeof body.frozen !== 'boolean') return json({error: 'frozen must be a boolean.'}, 400);
    if (body.designId !== undefined && !['nordic', 'aurora', 'carbon'].includes(body.designId)) return json({error: 'Unknown card design.'}, 400);
    if (body.dailyLimitCents !== undefined && (!Number.isInteger(body.dailyLimitCents) || body.dailyLimitCents < 10000 || body.dailyLimitCents > 1000000)) return json({error: 'Daily demo limit must be between €100 and €10,000.'}, 400);
    if (body.controls !== undefined) {
      if (!body.controls || typeof body.controls !== 'object' || Object.keys(body.controls).some(key => !['online', 'contactless', 'international'].includes(key))) return json({error: 'Invalid card controls.'}, 400);
      for (const [key, value] of Object.entries(body.controls)) {
        if (typeof value !== 'boolean') return json({error: 'Card controls must be boolean.'}, 400);
      }
    }
    if (body.frozen !== undefined) card.frozen = body.frozen;
    if (body.designId !== undefined) card.designId = body.designId;
    if (body.dailyLimitCents !== undefined) card.dailyLimitCents = body.dailyLimitCents;
    if (body.controls !== undefined) card.controls = {...card.controls, ...body.controls};
    if (body.frozen !== undefined) addCardEvent(session, card.id, body.frozen ? 'Card frozen' : 'Card unfrozen', 'Demo card status changed');
    if (body.designId !== undefined) addCardEvent(session, card.id, 'Design updated', `${body.designId} finish`);
    if (body.dailyLimitCents !== undefined) addCardEvent(session, card.id, 'Daily spending limit changed', `New demo limit: €${(body.dailyLimitCents / 100).toLocaleString('en-IE')}`);
    if (body.controls !== undefined) for (const [key, value] of Object.entries(body.controls)) addCardEvent(session, card.id, `${key.charAt(0).toUpperCase()}${key.slice(1)} ${value ? 'enabled' : 'disabled'}`, 'Demo payment control');
    return json(card);
  }
  return json({error: 'Endpoint not found.'}, 404);
}

function mimeType(path) {
  if (path.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (path.endsWith('.css')) return 'text/css; charset=utf-8';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.ico')) return 'image/x-icon';
  if (path.endsWith('.json')) return 'application/json; charset=utf-8';
  return 'text/html; charset=utf-8';
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (request.method === 'OPTIONS') {
        if (request.headers.get('Origin') !== githubPagesOrigin) return new Response(null, {status: 403});
        return withDemoCors(request, new Response(null, {status: 204}));
      }
      try {return withDemoCors(request, await api(request, url));}
      catch {return withDemoCors(request, json({error: 'Unexpected demo API error.'}, 500));}
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', {status: 405});
    if (url.pathname === '/design-system') return Response.redirect(`${url.origin}/design-system/`, 308);
    const path = url.pathname === '/' ? '/index.html' : ['/design-system', '/design-system/'].includes(url.pathname) ? '/design-system/index.html' : url.pathname;
    const asset = ASSETS[path] || (path.indexOf('.') === -1 ? ASSETS['/index.html'] : null);
    if (!asset) return new Response('Not found', {status: 404});
    const bytes = Uint8Array.from(atob(asset), c => c.charCodeAt(0));
    return new Response(request.method === 'HEAD' ? null : bytes, {
      headers: {
        'Content-Type': mimeType(path),
        'Cache-Control': path === '/index.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'same-origin'
      }
    });
  }
};
