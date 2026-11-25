/* Tiny interactions for the framework-neutral component explorer.
 * No banking API, local storage, tracking, or personal data collection.
 */
const toast = document.getElementById('system-toast');
let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = `✓ ${message}`;
  toast.hidden = false;
  toastTimer = setTimeout(() => {toast.hidden = true;}, 2700);
}
document.querySelectorAll('[data-feedback]').forEach(button => {
  button.addEventListener('click', () => showToast(`${button.dataset.feedback} selected`));
});
document.getElementById('show-toast').addEventListener('click', () => showToast('Example confirmation. No real banking action occurred.'));

const stateButton = document.getElementById('state-demo-button');
const stateDescription = document.getElementById('state-description');
const stateLabels = {
  default: 'Ready for interaction',
  hover: 'Visual hover treatment',
  focus: 'Visible keyboard-focus ring',
  disabled: 'Unavailable; no action can be triggered',
  loading: 'Simulated request in progress'
};
document.querySelectorAll('[data-button-state]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('[data-button-state]').forEach(button => button.setAttribute('aria-selected', String(button === tab)));
    const state = tab.dataset.buttonState;
    stateButton.className = 'nl-button nl-button--primary';
    stateButton.disabled = state === 'disabled' || state === 'loading';
    stateButton.textContent = state === 'loading' ? 'Processing…' : 'Continue';
    if (state === 'hover') stateButton.classList.add('state-hover');
    if (state === 'focus') stateButton.classList.add('state-focus');
    if (state === 'loading') stateButton.classList.add('state-loading');
    stateDescription.textContent = stateLabels[state];
  });
});
stateButton.addEventListener('click', () => showToast('Component event received'));

const email = document.getElementById('sample-email');
const emailHelp = document.getElementById('email-help');
email.addEventListener('blur', () => {
  const invalid = !!email.value.trim() && !email.validity.valid;
  email.setAttribute('aria-invalid', String(invalid));
  emailHelp.classList.toggle('nl-field-error', invalid);
  emailHelp.textContent = invalid ? 'Enter a valid email format, such as alex@example.com.' : 'Enter a demo address and leave the field to validate it.';
});
const toggle = document.getElementById('sample-toggle');
toggle.addEventListener('click', () => {
  const next = toggle.getAttribute('aria-pressed') !== 'true';
  toggle.setAttribute('aria-pressed', String(next));
  toggle.nextElementSibling.textContent = next ? 'Enabled' : 'Disabled';
  toggle.nextElementSibling.classList.toggle('nl-badge--success', next);
  showToast(`Demo notifications ${next ? 'enabled' : 'disabled'}`);
});

const card = document.getElementById('system-bank-card');
document.querySelectorAll('.finish-options [data-finish]').forEach(option => {
  option.addEventListener('click', () => {
    document.querySelectorAll('.finish-options [data-finish]').forEach(button => {
      const chosen = button === option;
      button.setAttribute('aria-checked', String(chosen));
      button.querySelector('b').textContent = chosen ? '✓' : '';
    });
    card.dataset.finish = option.dataset.finish;
  });
});

const sectionLinks = [...document.querySelectorAll('.system-nav nav a')];
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    sectionLinks.forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
  }
}, {rootMargin: '-12% 0px -70% 0px', threshold: 0});
document.querySelectorAll('.section-anchor').forEach(section => observer.observe(section));
// Keep links to the product relative so this explorer also works beneath the
// GitHub Pages repository prefix rather than only at a domain root.
document.querySelectorAll('a[href="/"]').forEach(link => link.setAttribute('href', '../'));

