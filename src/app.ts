import {CommonModule} from '@angular/common';
import {HttpClient, HttpHeaders, HttpErrorResponse} from '@angular/common/http';
import {Component, OnInit, computed, inject, signal} from '@angular/core';
import {firstValueFrom} from 'rxjs';

type Page = 'overview' | 'accounts' | 'payments' | 'insights' | 'cards';
type Account = {id: string; name: string; type: string; iban: string; balanceCents: number; color: string; accent: string};
type Transaction = {id: string; accountId: string; name: string; detail: string; category: string; amountCents: number; date: string; icon: string};
type CardTheme = 'nordic' | 'aurora' | 'carbon';
type CardControl = 'online' | 'contactless' | 'international';
type CardProduct = {id: string; name: string; category: string; format: string; subtitle: string; description: string; accountIds: string[]; defaultAccountId: string; designId: CardTheme; last4: string; highlights: string[]; included: boolean};
type BankCard = {id: string; productId: string; accountId: string; name: string; last4: string; expires: string; frozen: boolean; holder: string; designId: CardTheme; dailyLimitCents: number; controls: Record<CardControl, boolean>; removable: boolean};
type CardActivity = {id: string; cardId: string; label: string; detail: string; date: string};
type Customer = {name: string; firstName: string; initials: string; memberSince: string; email: string; city: string; language: string; notifications: {email: boolean; push: boolean}; securityPreview: {twoFactor: boolean; biometric: boolean}};
type Insights = {month: string; monthlyIncomeCents: number; monthlySpendCents: number; previousMonthlySpendCents: number; categories: {name: string; amountCents: number; color: string}[]; weeklySpendCents: number[]; budgetCents: number};
type Overview = {sandbox: boolean; persistence: string; customer: Customer; accounts: Account[]; transactions: Transaction[]; cards: BankCard[]; insights: Insights; totalBalanceCents: number};
type TransferResponse = {success: boolean; reference: string; overview: Overview};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  private http = inject(HttpClient);
  private session = sessionStorage.getItem('nord-ledger-session') ?? '';
  // GitHub Pages serves static Angular assets; the public demo Worker hosts
  // the actual REST endpoints. All other deployments use same-origin /api.
  private apiUrl(path: string): string {
    return window.location.hostname === 'sandeepariyar.github.io'
      ? `https://nord-ledger-angular-bank-demo.sandeep-pariyar.chatgpt.site${path}`
      : path;
  }

  readonly pages: {id: Page; label: string; icon: string}[] = [
    {id: 'overview', label: 'Overview', icon: '▦'},
    {id: 'accounts', label: 'Accounts', icon: '▤'},
    {id: 'payments', label: 'Payments', icon: '✣'},
    {id: 'insights', label: 'Insights', icon: '◫'},
    {id: 'cards', label: 'My cards', icon: '▭'}
  ];
  readonly designs: {id: CardTheme; label: string; description: string}[] = [
    {id: 'nordic', label: 'Nordic', description: 'Deep forest · signature finish'},
    {id: 'aurora', label: 'Aurora', description: 'Northern lights · luminous'},
    {id: 'carbon', label: 'Carbon', description: 'Graphite · sculpted texture'}
  ];
  readonly nowLabel = new Intl.DateTimeFormat('en-GB', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'}).format(new Date());

  readonly data = signal<Overview | null>(null);
  readonly page = signal<Page>('overview');
  readonly loading = signal(true);
  readonly error = signal('');
  readonly toast = signal('');
  readonly selectedAccount = signal('all');
  readonly search = signal('');
  readonly transferOpen = signal(false);
  readonly from = signal('everyday');
  readonly to = signal('savings');
  readonly amount = signal('250.00');
  readonly busy = signal(false);
  readonly busyCard = signal<string | null>(null);
  readonly profileOpen = signal(false);
  readonly profileTab = signal<'personal' | 'preferences' | 'security'>('personal');
  readonly profileName = signal('');
  readonly profileEmail = signal('');
  readonly profileLanguage = signal('English');
  readonly notifyEmail = signal(true);
  readonly notifyPush = signal(true);
  readonly previewTwoFactor = signal(false);
  readonly previewBiometric = signal(false);
  readonly profileSaving = signal(false);
  readonly designingCardId = signal<string | null>(null);
  readonly chosenTheme = signal<CardTheme>('nordic');
  readonly showCardBack = signal(false);
  readonly previewTilt = signal({x: 0, y: 0});
  readonly activeDesignCard = computed(() => this.data()?.cards.find(card => card.id === this.designingCardId()) ?? null);
  readonly cardCatalogOpen = signal(false);
  readonly cardCatalogLoading = signal(false);
  readonly cardProducts = signal<CardProduct[]>([]);
  readonly selectedProductId = signal<string | null>(null);
  readonly selectedProduct = computed(() => this.cardProducts().find(product => product.id === this.selectedProductId()) ?? null);
  readonly catalogStep = signal<'compare' | 'customize' | 'review'>('compare');
  readonly selectedCardAccountId = signal('everyday');
  readonly selectedCardTheme = signal<CardTheme>('nordic');
  readonly cardIssuing = signal(false);
  readonly activityCardId = signal<string | null>(null);
  readonly activityCard = computed(() => this.data()?.cards.find(card => card.id === this.activityCardId()) ?? null);
  readonly cardActivity = signal<CardActivity[]>([]);
  readonly activityLoading = signal(false);
  readonly closingCardId = signal<string | null>(null);
  readonly cardClosing = signal(false);

  readonly filteredTransactions = computed(() => {
    const overview = this.data();
    if (!overview) return [];
    const account = this.selectedAccount();
    const search = this.search().trim().toLowerCase();
    return overview.transactions.filter(tx =>
      (account === 'all' || tx.accountId === account) &&
      (!search || `${tx.name} ${tx.detail} ${tx.category}`.toLowerCase().includes(search))
    );
  });
  readonly transferAccounts = computed(() => this.data()?.accounts ?? []);

  ngOnInit(): void {void this.load();}

  private headers(extra: Record<string, string> = {}): HttpHeaders {
    return new HttpHeaders({'X-Demo-Session': this.session, ...extra});
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const response = await firstValueFrom(this.http.get<Overview>(this.apiUrl('/api/overview'), {observe: 'response', headers: this.headers()}));
      this.data.set(response.body);
      const id = response.headers.get('X-Demo-Session');
      if (id) {this.session = id; sessionStorage.setItem('nord-ledger-session', id);}
    } catch {
      this.error.set('Could not load the banking sandbox. Please try again.');
    } finally {this.loading.set(false);}
  }

  navigate(page: Page): void {this.page.set(page); this.search.set(''); this.selectedAccount.set('all'); window.scrollTo({top: 0, behavior: 'smooth'});}
  openProfile(): void {
    const customer = this.data()?.customer;
    if (!customer) return;
    this.profileName.set(customer.name);
    this.profileEmail.set(customer.email);
    this.profileLanguage.set(customer.language);
    this.notifyEmail.set(customer.notifications.email);
    this.notifyPush.set(customer.notifications.push);
    this.previewTwoFactor.set(customer.securityPreview.twoFactor);
    this.previewBiometric.set(customer.securityPreview.biometric);
    this.profileTab.set('personal');
    this.error.set('');
    this.profileOpen.set(true);
  }
  closeProfile(): void {if (!this.profileSaving()) this.profileOpen.set(false);}
  onProfileName(event: Event): void {this.profileName.set((event.target as HTMLInputElement).value);}
  onProfileEmail(event: Event): void {this.profileEmail.set((event.target as HTMLInputElement).value);}
  onProfileLanguage(event: Event): void {this.profileLanguage.set((event.target as HTMLSelectElement).value);}
  openTransfer(): void {this.transferOpen.set(true); this.error.set('');}
  closeTransfer(): void {if (!this.busy()) this.transferOpen.set(false);}
  onFromChange(event: Event): void {this.from.set((event.target as HTMLSelectElement).value);}
  onToChange(event: Event): void {this.to.set((event.target as HTMLSelectElement).value);}
  onAmountInput(event: Event): void {this.amount.set((event.target as HTMLInputElement).value);}
  onSearchInput(event: Event): void {this.search.set((event.target as HTMLInputElement).value);}
  onAccountChange(event: Event): void {this.selectedAccount.set((event.target as HTMLSelectElement).value);}

  money(cents: number): string {return new Intl.NumberFormat('en-IE', {style: 'currency', currency: 'EUR', minimumFractionDigits: 2}).format(cents / 100);}
  signedMoney(cents: number): string {return `${cents > 0 ? '+' : cents < 0 ? '−' : ''}${this.money(Math.abs(cents))}`;}
  shortDate(date: string): string {return new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short'}).format(new Date(`${date}T12:00:00`));}
  percent(value: number, total: number): number {return total ? Math.round((value / total) * 100) : 0;}
  chartHeight(value: number): number {return Math.max(16, this.percent(value, 75000));}
  categoryStyle(color: string): string {return color;}
  txIcon(icon: string): string {
    const glyphs: Record<string, string> = {'briefcase': '✦', 'shopping-bag': '◈', 'coffee': '☕', 'train': '↗', 'home': '⌂', 'play': '▷', 'repeat': '⇄'};
    return glyphs[icon] ?? '↗';
  }
  donutStyle(): string {
    const categories = this.data()?.insights.categories ?? [];
    const total = categories.reduce((sum, item) => sum + item.amountCents, 0);
    if (!total) return 'conic-gradient(#dbe4dd 0 100%)';
    let start = 0;
    const stops = categories.map(item => {
      const end = start + item.amountCents / total * 100;
      const part = `${item.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
      start = end;
      return part;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }
  accountName(id: string): string {return this.data()?.accounts.find(account => account.id === id)?.name ?? id;}
  hasCardProduct(productId: string): boolean {return !!this.data()?.cards.some(card => card.productId === productId);}

  async openCardCatalog(): Promise<void> {
    this.cardCatalogOpen.set(true);
    this.catalogStep.set('compare');
    this.selectedProductId.set(null);
    this.error.set('');
    this.cardCatalogLoading.set(true);
    try {
      this.cardProducts.set(await firstValueFrom(this.http.get<CardProduct[]>(this.apiUrl('/api/card-products'), {headers: this.headers()})));
    } catch {this.error.set('Could not load the demo card collection. Reset the sandbox if your session expired.');}
    finally {this.cardCatalogLoading.set(false);}
  }
  closeCardCatalog(): void {if (!this.cardIssuing()) this.cardCatalogOpen.set(false);}
  chooseCardProduct(product: CardProduct): void {
    if (this.hasCardProduct(product.id)) return;
    this.selectedProductId.set(product.id);
    this.selectedCardAccountId.set(product.defaultAccountId);
    this.selectedCardTheme.set(product.designId);
    this.catalogStep.set('customize');
    this.error.set('');
  }
  onSelectedCardAccount(event: Event): void {this.selectedCardAccountId.set((event.target as HTMLSelectElement).value);}
  async issueDemoCard(): Promise<void> {
    const product = this.selectedProduct();
    if (!product || this.cardIssuing()) return;
    this.cardIssuing.set(true);
    this.error.set('');
    try {
      const result = await firstValueFrom(this.http.post<{card: BankCard; overview: Overview}>(this.apiUrl('/api/cards'), {
        productId: product.id, accountId: this.selectedCardAccountId(), designId: this.selectedCardTheme()
      }, {headers: this.headers()}));
      this.data.set(result.overview);
      this.cardCatalogOpen.set(false);
      this.showToast(`${result.card.name} added to your demo wallet`);
    } catch (err) {
      const apiMessage = err instanceof HttpErrorResponse ? err.error?.error : null;
      this.error.set(apiMessage ?? 'Could not add this card. Please try again.');
    } finally {this.cardIssuing.set(false);}
  }

  async openCardActivity(card: BankCard): Promise<void> {
    this.activityCardId.set(card.id);
    this.cardActivity.set([]);
    this.activityLoading.set(true);
    this.error.set('');
    try {
      const activity = await firstValueFrom(this.http.get<CardActivity[]>(this.apiUrl(`/api/cards/${card.id}/activity`), {headers: this.headers()}));
      if (this.activityCardId() === card.id) this.cardActivity.set(activity);
    } catch {this.error.set('Could not load card activity. Please retry.');}
    finally {this.activityLoading.set(false);}
  }
  closeCardActivity(): void {this.activityCardId.set(null); this.cardActivity.set([]);}
  askCloseCard(card: BankCard): void {if (card.removable) {this.closingCardId.set(card.id); this.error.set('');}}
  cancelCloseCard(): void {if (!this.cardClosing()) this.closingCardId.set(null);}
  async confirmCloseCard(): Promise<void> {
    const id = this.closingCardId();
    if (!id || this.cardClosing()) return;
    this.cardClosing.set(true);
    this.error.set('');
    try {
      const overview = await firstValueFrom(this.http.delete<Overview>(this.apiUrl(`/api/cards/${id}`), {headers: this.headers()}));
      this.data.set(overview);
      this.closingCardId.set(null);
      if (this.activityCardId() === id) this.closeCardActivity();
      this.showToast('Demo card closed and removed from wallet');
    } catch (err) {
      const apiMessage = err instanceof HttpErrorResponse ? err.error?.error : null;
      this.error.set(apiMessage ?? 'Could not close the demo card.');
    } finally {this.cardClosing.set(false);}
  }
  activityDate(date: string): string {return new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}).format(new Date(date));}

  openDesigner(card: BankCard): void {
    this.designingCardId.set(card.id);
    this.chosenTheme.set(card.designId);
    this.showCardBack.set(false);
    this.previewTilt.set({x: 0, y: 0});
    this.error.set('');
  }
  closeDesigner(): void {if (!this.busyCard()) this.designingCardId.set(null);}
  previewMove(event: MouseEvent): void {
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    this.previewTilt.set({x: -y * 11, y: x * 11});
  }
  previewTransform(): string {
    const tilt = this.previewTilt();
    return `rotateX(${tilt.x}deg) rotateY(${tilt.y + (this.showCardBack() ? 180 : 0)}deg)`;
  }

  async submitTransfer(): Promise<void> {
    const amount = Number(this.amount());
    if (this.from() === this.to()) {this.error.set('Choose two different accounts.'); return;}
    if (!Number.isFinite(amount) || amount <= 0 || amount > 50000 || !/^\d+(?:\.\d{1,2})?$/.test(this.amount().trim())) {
      this.error.set('Enter an amount between €0.01 and €50,000.00.'); return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      const response = await firstValueFrom(this.http.post<TransferResponse>(this.apiUrl('/api/transfers'), {
        fromAccountId: this.from(), toAccountId: this.to(), amount
      }, {headers: this.headers({'Idempotency-Key': crypto.randomUUID()})}));
      this.data.set(response.overview);
      this.transferOpen.set(false);
      this.amount.set('250.00');
      this.showToast(`Transfer complete · Ref ${response.reference}`);
    } catch (err) {
      const apiMessage = err instanceof HttpErrorResponse ? err.error?.error : null;
      this.error.set(apiMessage ?? 'Transfer could not be completed. Please retry.');
    } finally {this.busy.set(false);}
  }

  async toggleCard(card: BankCard): Promise<void> {
    const result = await this.updateCard(card, {frozen: !card.frozen});
    if (result) this.showToast(result.frozen ? 'Card temporarily frozen' : 'Card ready to use');
  }

  private async updateCard(card: BankCard, changes: Record<string, unknown>): Promise<BankCard | null> {
    this.busyCard.set(card.id);
    this.error.set('');
    try {
      const updated = await firstValueFrom(this.http.patch<BankCard>(this.apiUrl(`/api/cards/${card.id}`), changes, {headers: this.headers()}));
      this.data.update(data => data ? {...data, cards: data.cards.map(item => item.id === card.id ? updated : item)} : data);
      return updated;
    } catch (err) {
      this.error.set(err instanceof HttpErrorResponse && err.status === 401 ? 'Demo session expired. Reset the sandbox to continue.' : 'Could not update card settings. Please retry.');
      return null;
    }
    finally {this.busyCard.set(null);}
  }

  async toggleCardControl(card: BankCard, key: CardControl): Promise<void> {
    const updated = await this.updateCard(card, {controls: {[key]: !card.controls[key]}});
    if (updated) this.showToast(`${key.charAt(0).toUpperCase() + key.slice(1)} payments ${updated.controls[key] ? 'enabled' : 'disabled'} in demo`);
  }

  async setCardLimit(card: BankCard, event: Event): Promise<void> {
    const cents = Number((event.target as HTMLSelectElement).value);
    const updated = await this.updateCard(card, {dailyLimitCents: cents});
    if (updated) this.showToast('Demo spending limit updated');
  }

  async saveCardDesign(): Promise<void> {
    const card = this.activeDesignCard();
    if (!card) return;
    const updated = await this.updateCard(card, {designId: this.chosenTheme()});
    if (updated) {this.designingCardId.set(null); this.showToast(`${this.designs.find(design => design.id === updated.designId)?.label} design applied`);}
  }

  async saveProfile(): Promise<void> {
    if (this.profileSaving()) return;
    this.profileSaving.set(true);
    this.error.set('');
    try {
      const overview = await firstValueFrom(this.http.patch<Overview>(this.apiUrl('/api/profile'), {
        name: this.profileName(), email: this.profileEmail(), language: this.profileLanguage(),
        notifications: {email: this.notifyEmail(), push: this.notifyPush()},
        securityPreview: {twoFactor: this.previewTwoFactor(), biometric: this.previewBiometric()}
      }, {headers: this.headers()}));
      this.data.set(overview);
      this.profileOpen.set(false);
      this.showToast('Demo profile updated');
    } catch (err) {
      this.error.set(err instanceof HttpErrorResponse ? (err.error?.error ?? 'Could not save profile changes.') : 'Could not save profile changes.');
    } finally {this.profileSaving.set(false);}
  }

  async resetDemo(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      const response = await firstValueFrom(this.http.post<Overview>(this.apiUrl('/api/reset'), {}, {headers: this.headers(), observe: 'response'}));
      this.data.set(response.body);
      const id = response.headers.get('X-Demo-Session');
      if (id) {this.session = id; sessionStorage.setItem('nord-ledger-session', id);}
      this.page.set('overview');
      this.profileOpen.set(false);
      this.designingCardId.set(null);
      this.cardCatalogOpen.set(false);
      this.closeCardActivity();
      this.closingCardId.set(null);
      this.showToast('Sandbox restored to its original balances');
    } catch {this.error.set('Could not reset the sandbox.');}
    finally {this.busy.set(false);}
  }

  exportCsv(): void {
    const rows = [
      ['Date', 'Account', 'Name', 'Category', 'Amount EUR'],
      ...this.filteredTransactions().map(tx => [tx.date, this.accountName(tx.accountId), tx.name, tx.category, (tx.amountCents / 100).toFixed(2)])
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
    link.download = 'nord-ledger-demo-statement.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    this.showToast('Demo statement downloaded');
  }

  private showToast(message: string): void {
    this.toast.set(message);
    setTimeout(() => {if (this.toast() === message) this.toast.set('');}, 4500);
  }
}
