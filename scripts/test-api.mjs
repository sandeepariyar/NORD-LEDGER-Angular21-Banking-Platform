import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';

const origin = 'https://demo.example';
async function req(path, opts={}) {
  const response = await worker.fetch(new Request(origin + path, opts));
  const body = await response.json();
  return {response, body};
}

const health = await req('/api/health');
assert.equal(health.body.status, 'ok');
const redirect = await worker.fetch(new Request(origin + '/design-system'));
assert.equal(redirect.status, 308);
assert.equal(redirect.headers.get('Location'), origin + '/design-system/');
const designResponse = await worker.fetch(new Request(origin + '/design-system/'));
assert.equal(designResponse.status, 200);
const designHtml = await designResponse.text();
assert.ok(designHtml.includes('Nord Ledger | Design System'));
assert.ok(designHtml.includes('Controls & states'));
const tokenResponse = await worker.fetch(new Request(origin + '/design-system/assets/tokens.css'));
assert.equal(tokenResponse.status, 200);
assert.ok((await tokenResponse.text()).includes('--nl-forest'));
const preflight = await worker.fetch(new Request(origin + '/api/transfers', {
  method: 'OPTIONS',
  headers: {Origin: 'https://sandeepariyar.github.io', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'x-demo-session,idempotency-key,content-type'}
}));
assert.equal(preflight.status, 204);
assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), 'https://sandeepariyar.github.io');
assert.ok(preflight.headers.get('Access-Control-Allow-Headers').includes('Idempotency-Key'));
const crossOriginOverview = await worker.fetch(new Request(origin + '/api/overview', {headers: {Origin: 'https://sandeepariyar.github.io'}}));
assert.equal(crossOriginOverview.status, 200);
assert.equal(crossOriginOverview.headers.get('Access-Control-Expose-Headers'), 'X-Demo-Session');
assert.ok(crossOriginOverview.headers.get('X-Demo-Session'));
const untrustedPreflight = await worker.fetch(new Request(origin + '/api/transfers', {method: 'OPTIONS', headers: {Origin: 'https://not-our-repo.example'}}));
assert.equal(untrustedPreflight.status, 403);
const componentResponse = await worker.fetch(new Request(origin + '/design-system/assets/components.css'));
assert.equal(componentResponse.status, 200);
assert.ok((await componentResponse.text()).includes('.nl-button--primary'));
const explorerScript = await worker.fetch(new Request(origin + '/design-system/studio.js'));
assert.equal(explorerScript.status, 200);
const bootstrap = await req('/api/overview');
const session = bootstrap.response.headers.get('X-Demo-Session');
assert.ok(session);
assert.equal(bootstrap.body.accounts.length, 3);
assert.equal(bootstrap.body.sandbox, true);

const before = bootstrap.body.accounts[0].balanceCents;
const headers = {'X-Demo-Session': session, 'Idempotency-Key': 'test-transfer', 'Content-Type': 'application/json'};
const payload = JSON.stringify({fromAccountId: 'everyday', toAccountId: 'savings', amount: 42.25});
const transfer = await req('/api/transfers', {method: 'POST', headers, body: payload});
assert.equal(transfer.response.status, 201);
assert.equal(transfer.body.overview.accounts[0].balanceCents, before - 4225);
const duplicate = await req('/api/transfers', {method: 'POST', headers, body: payload});
assert.equal(duplicate.body.reference, transfer.body.reference);
assert.equal(duplicate.body.overview.accounts[0].balanceCents, before - 4225);

const bad = await req('/api/transfers', {method: 'POST', headers: {...headers, 'Idempotency-Key': 'bad'}, body: JSON.stringify({fromAccountId:'everyday', toAccountId:'savings', amount: -2})});
assert.equal(bad.response.status, 400);
const funds = await req('/api/transfers', {method: 'POST', headers: {...headers, 'Idempotency-Key': 'funds'}, body: JSON.stringify({fromAccountId:'travel', toAccountId:'savings', amount: 49999})});
assert.equal(funds.response.status, 409);

const frozen = await req('/api/cards/everyday-card', {method:'PATCH', headers, body: JSON.stringify({frozen:true})});
assert.equal(frozen.body.frozen, true);

const products = await req('/api/card-products', {headers});
assert.equal(products.body.length, 5);
assert.equal(products.body.filter(product => product.included).length, 2);
assert.ok(products.body.find(product => product.id === 'credit-concept').description.includes('No borrowing'));
const badProduct = await req('/api/cards', {method:'POST', headers, body: JSON.stringify({productId:'unknown',accountId:'everyday',designId:'nordic'})});
assert.equal(badProduct.response.status, 400);
const badAccount = await req('/api/cards', {method:'POST', headers, body: JSON.stringify({productId:'virtual-debit',accountId:'savings',designId:'carbon'})});
assert.equal(badAccount.response.status, 400);
const alreadyIncluded = await req('/api/cards', {method:'POST', headers, body: JSON.stringify({productId:'everyday-debit',accountId:'everyday',designId:'nordic'})});
assert.equal(alreadyIncluded.response.status, 409);
const virtualPayload = JSON.stringify({productId:'virtual-debit',accountId:'everyday',designId:'carbon'});
const virtual = await req('/api/cards', {method:'POST', headers, body: virtualPayload});
assert.equal(virtual.response.status, 201);
assert.equal(virtual.body.card.productId, 'virtual-debit');
assert.equal(virtual.body.card.designId, 'carbon');
assert.equal(virtual.body.card.controls.contactless, false);
assert.equal(virtual.body.overview.cards.length, 3);
const duplicateVirtual = await req('/api/cards', {method:'POST', headers, body: virtualPayload});
assert.equal(duplicateVirtual.response.status, 409);
const virtualFreeze = await req('/api/cards/virtual-debit-card', {method:'PATCH', headers, body: JSON.stringify({frozen:true,controls:{online:false}})});
assert.equal(virtualFreeze.body.frozen, true);
const virtualActivity = await req('/api/cards/virtual-debit-card/activity', {headers});
assert.equal(virtualActivity.response.status, 200);
assert.ok(virtualActivity.body.some(event => event.label === 'Card frozen'));
assert.ok(virtualActivity.body.some(event => event.label === 'Online disabled'));
const protectedCard = await req('/api/cards/everyday-card', {method:'DELETE', headers});
assert.equal(protectedCard.response.status, 409);
const closeVirtual = await req('/api/cards/virtual-debit-card', {method:'DELETE', headers});
assert.equal(closeVirtual.response.status, 200);
assert.equal(closeVirtual.body.cards.length, 2);
const closedActivity = await req('/api/cards/virtual-debit-card/activity', {headers});
assert.equal(closedActivity.response.status, 404);
const reopenVirtual = await req('/api/cards', {method:'POST', headers, body: virtualPayload});
assert.equal(reopenVirtual.response.status, 201);
const reopenedActivity = await req('/api/cards/virtual-debit-card/activity', {headers});
assert.equal(reopenedActivity.body.length, 1, 'A new card lifecycle should not retain history from a closed card');
const premium = await req('/api/cards', {method:'POST', headers, body: JSON.stringify({productId:'premium-debit',accountId:'travel',designId:'aurora'})});
assert.equal(premium.response.status, 201);
const creditConcept = await req('/api/cards', {method:'POST', headers, body: JSON.stringify({productId:'credit-concept',accountId:'everyday',designId:'carbon'})});
assert.equal(creditConcept.response.status, 201);
assert.equal(creditConcept.body.overview.cards.length, 5);

const profile = await req('/api/profile', {headers});
assert.equal(profile.body.name, 'Alex Morgan');
const invalidProfile = await req('/api/profile', {method:'PATCH', headers, body: JSON.stringify({name:'A',email:'bad',language:'English',notifications:{email:true,push:true},securityPreview:{twoFactor:false,biometric:false}})});
assert.equal(invalidProfile.response.status, 400);
const savedProfile = await req('/api/profile', {method:'PATCH', headers, body: JSON.stringify({name:'Jamie River',email:'jamie.river@example.com',language:'Finnish',notifications:{email:false,push:true},securityPreview:{twoFactor:true,biometric:false}})});
assert.equal(savedProfile.body.customer.firstName, 'Jamie');
assert.equal(savedProfile.body.customer.language, 'Finnish');
assert.equal(savedProfile.body.cards[0].holder, 'JAMIE RIVER');

const design = await req('/api/cards/everyday-card', {method:'PATCH', headers, body: JSON.stringify({designId:'carbon',dailyLimitCents:500000,controls:{online:false}})});
assert.equal(design.body.designId, 'carbon');
assert.equal(design.body.dailyLimitCents, 500000);
assert.equal(design.body.controls.online, false);
const invalidDesign = await req('/api/cards/everyday-card', {method:'PATCH', headers, body: JSON.stringify({frozen:false,designId:'invalid'})});
assert.equal(invalidDesign.response.status, 400);
const cardsAfterError = await req('/api/cards', {headers});
assert.equal(cardsAfterError.body[0].frozen, true, 'Invalid design must not partially unfreeze card');
assert.equal(cardsAfterError.body[0].designId, 'carbon');

const reset = await req('/api/reset', {method: 'POST', headers});
assert.equal(reset.body.accounts[0].balanceCents, before);
assert.equal(reset.body.customer.name, 'Alex Morgan');
assert.equal(reset.body.cards[0].designId, 'nordic');
assert.equal(reset.body.cards[0].controls.online, true);
assert.equal(reset.body.cards.length, 2);
assert.notEqual(reset.response.headers.get('X-Demo-Session'), session);

// A stale session is common after a Worker is restarted or a deployment rolls.
// The reset endpoint must restore a fresh demo, not reject the user with 401.
const expiredReset = await req('/api/reset', {method: 'POST', headers: {'X-Demo-Session': 'expired-session'}});
assert.equal(expiredReset.response.status, 200);
assert.equal(expiredReset.body.accounts[0].balanceCents, before);
assert.ok(expiredReset.response.headers.get('X-Demo-Session'));

const anonymousReset = await req('/api/reset', {method: 'POST'});
assert.equal(anonymousReset.response.status, 200);
assert.ok(anonymousReset.response.headers.get('X-Demo-Session'));
console.log('Worker checks passed: design-system explorer/assets, transfers, profile editing, card catalog, issuing, activity, closing/reissuing, controls, validation, and reset.');
