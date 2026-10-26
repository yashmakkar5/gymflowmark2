// Payments Financial Ledger View
import { Api } from '../api.js';
import { Icons } from '../components/icons.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export const PaymentsView = {
  currentStatus: 'all',
  currentMethod: 'all',
  searchQuery: '',
  paymentsList: [],
  allMembers: [],

  async render(container) {
    container.innerHTML = `
      <div style="padding: 24px 0 0;">
        <div class="page-header">
          <div>
            <h1 class="page-title">Billing & Payments</h1>
            <p class="page-subtitle">Real-time financial ledger, member invoices, and tax receipts.</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" id="btn-record-payment-trigger">
              ${Icons.plus} Record Payment
            </button>
          </div>
        </div>

        <!-- Financial KPI Cards -->
        <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
          <div class="kpi-card">
            <span class="kpi-title">Today's Revenue</span>
            <div class="kpi-value number-tabular" id="pay-kpi-today">₹0</div>
            <div class="kpi-subtext"><span class="indicator-positive">Real-time daily collection</span></div>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">This Month</span>
            <div class="kpi-value number-tabular" id="pay-kpi-month" style="color: var(--accent);">₹0</div>
            <div class="kpi-subtext">Current calendar month</div>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Pending / Overdue</span>
            <div class="kpi-value number-tabular" id="pay-kpi-pending" style="color: var(--warning);">₹0</div>
            <div class="kpi-subtext">Awaiting collection</div>
          </div>
        </div>

        <!-- Table Container -->
        <div class="table-container">
          <!-- Toolbar -->
          <div class="table-toolbar">
            <div class="search-input-wrapper">
              ${Icons.search}
              <input type="text" id="pay-search-input" class="table-search-input" placeholder="Search receipt, member name, or ref..." />
            </div>

            <div style="display: flex; gap: 8px;">
              <select id="pay-filter-status" class="form-select" style="padding: 4px 8px; font-size: 12px; width: auto;">
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>

              <select id="pay-filter-method" class="form-select" style="padding: 4px 8px; font-size: 12px; width: auto;">
                <option value="all">All Methods</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="NetBanking">Net Banking</option>
              </select>
            </div>
          </div>

          <!-- Table -->
          <div style="overflow-x: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Member</th>
                  <th>Plan Tier</th>
                  <th>Amount (₹)</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style="text-align: right;">Receipt</th>
                </tr>
              </thead>
              <tbody id="payments-table-body">
                <tr>
                  <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    Loading financial transactions...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadAllMembers();
    await this.loadPayments(container);
    this.attachEvents(container);
  },

  async loadAllMembers() {
    try {
      const res = await Api.get('/members');
      if (res.success) this.allMembers = res.data;
    } catch (err) {
      console.warn(err);
    }
  },

  async loadPayments(container) {
    try {
      const res = await Api.get('/payments', {
        status: this.currentStatus,
        method: this.currentMethod,
        search: this.searchQuery,
      });

      if (!res.success) throw new Error(res.message);

      this.paymentsList = res.data;
      const s = res.summary;

      // Update KPIs
      const kpiToday = container.querySelector('#pay-kpi-today');
      const kpiMonth = container.querySelector('#pay-kpi-month');
      const kpiPending = container.querySelector('#pay-kpi-pending');

      if (kpiToday) kpiToday.textContent = `₹${s.todayRevenue.toLocaleString('en-IN')}`;
      if (kpiMonth) kpiMonth.textContent = `₹${s.monthRevenue.toLocaleString('en-IN')}`;
      if (kpiPending) kpiPending.textContent = `₹${s.pendingAmount.toLocaleString('en-IN')}`;

      const tbody = container.querySelector('#payments-table-body');
      if (!tbody) return;

      if (!this.paymentsList.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8">
              <div class="empty-state">
                <div class="empty-state-icon">${Icons.receipt}</div>
                <div class="empty-state-title">No transactions found</div>
                <div class="empty-state-subtitle">No payment entries matched your current filter.</div>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = this.paymentsList
        .map((p) => {
          const dateStr = new Date(p.paymentDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });

          let statusBadge = '<span class="badge badge-success">Paid</span>';
          if (p.status === 'pending') statusBadge = '<span class="badge badge-warning">Pending</span>';
          else if (p.status === 'failed') statusBadge = '<span class="badge badge-danger">Failed</span>';

          return `
          <tr>
            <td>
              <strong class="number-tabular" style="font-family: var(--font-mono); font-size: 12px; color: var(--accent);">
                ${p.receiptNumber}
              </strong>
            </td>
            <td>
              <div class="member-cell">
                <div class="member-avatar">${p.memberName.charAt(0)}</div>
                <div class="member-meta">
                  <span class="member-name">${p.memberName}</span>
                  <span class="member-code">${p.memberPhone || ''}</span>
                </div>
              </div>
            </td>
            <td><span style="font-weight: 500;">${p.planName}</span></td>
            <td class="number-tabular" style="font-weight: 700; font-size: 14px;">
              ₹${p.totalAmount.toLocaleString('en-IN')}
            </td>
            <td><span class="badge badge-neutral">${p.paymentMethod}</span></td>
            <td class="number-tabular" style="color: var(--text-secondary);">${dateStr}</td>
            <td>${statusBadge}</td>
            <td style="text-align: right;">
              <button class="btn btn-secondary btn-sm btn-open-receipt" data-id="${p._id}" title="View Tax Receipt">
                ${Icons.receipt} Receipt
              </button>
            </td>
          </tr>
        `;
        })
        .join('');

      tbody.querySelectorAll('.btn-open-receipt').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.openReceiptModal(btn.dataset.id);
        });
      });
    } catch (err) {
      Toast.error('Failed to load payments: ' + err.message);
    }
  },

  attachEvents(container) {
    container.querySelector('#btn-record-payment-trigger')?.addEventListener('click', () => {
      this.openRecordPaymentModal(() => {
        this.loadPayments(container);
      });
    });

    // Search
    let debounce;
    container.querySelector('#pay-search-input')?.addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        this.searchQuery = e.target.value;
        this.loadPayments(container);
      }, 250);
    });

    // Filters
    container.querySelector('#pay-filter-status')?.addEventListener('change', (e) => {
      this.currentStatus = e.target.value;
      this.loadPayments(container);
    });

    container.querySelector('#pay-filter-method')?.addEventListener('change', (e) => {
      this.currentMethod = e.target.value;
      this.loadPayments(container);
    });
  },

  openRecordPaymentModal(onSuccess, defaultMemberId = null) {
    const memberOptions = this.allMembers
      .map((m) => `<option value="${m._id}" ${m._id === defaultMemberId ? 'selected' : ''}>${m.name} (${m.phone}) — ${m.planName}</option>`)
      .join('');

    const bodyHTML = `
      <form id="record-payment-form">
        <div class="form-group">
          <label class="form-label">Select Member *</label>
          <select id="rec-member" class="form-select" required>
            ${memberOptions || '<option value="">No members found</option>'}
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Total Amount (₹ INR) *</label>
            <input type="number" id="rec-amount" class="form-input" placeholder="e.g. 1499" value="1499" required />
          </div>
          <div class="form-group">
            <label class="form-label">Payment Method *</label>
            <select id="rec-method" class="form-select">
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Cash">Cash</option>
              <option value="Card">Debit / Credit Card</option>
              <option value="NetBanking">Net Banking</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Payment Status</label>
            <select id="rec-status" class="form-select">
              <option value="paid">Paid (Confirmed)</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Reference / UTR / Cash Memo</label>
            <input type="text" id="rec-ref" class="form-input" placeholder="e.g. UPI-12345678" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes</label>
          <input type="text" id="rec-notes" class="form-input" placeholder="Optional notes" />
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Cancel</button>
      <button class="btn btn-primary" id="btn-submit-payment">Record Payment</button>
    `;

    Modal.open({
      title: 'Record Payment Transaction',
      bodyHTML,
      footerHTML,
      onOpen: (body, footer) => {
        footer.querySelector('#btn-submit-payment').addEventListener('click', async () => {
          const memberId = body.querySelector('#rec-member').value;
          const amount = body.querySelector('#rec-amount').value;
          const paymentMethod = body.querySelector('#rec-method').value;
          const status = body.querySelector('#rec-status').value;
          const transactionReference = body.querySelector('#rec-ref').value.trim();
          const notes = body.querySelector('#rec-notes').value.trim();

          if (!memberId || !amount) {
            Toast.error('Please select a member and enter an amount.');
            return;
          }

          const btn = footer.querySelector('#btn-submit-payment');
          btn.disabled = true;

          try {
            const res = await Api.post('/payments', {
              memberId,
              amount,
              paymentMethod,
              status,
              transactionReference,
              notes,
            });

            if (res.success) {
              Toast.success('Payment recorded successfully.');
              Modal.close();
              if (onSuccess) onSuccess();
            }
          } catch (err) {
            Toast.error(err.message || 'Payment recording failed.');
            btn.disabled = false;
          }
        });
      },
    });
  },

  async openReceiptModal(paymentId) {
    try {
      const res = await Api.get(`/payments/${paymentId}/receipt`);
      if (!res.success) throw new Error(res.message);

      const d = res.data;
      const rec = d.receipt;
      const gym = d.gym;
      const member = d.member;

      const dateStr = new Date(rec.paymentDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const bodyHTML = `
        <div class="receipt-wrapper printable-receipt-area">
          <div class="receipt-header">
            <div>
              <div class="receipt-gym-title">${gym.name}</div>
              <div style="font-size: 12px; color: #52525b; margin-top: 2px;">
                ${gym.address}, ${gym.city}<br />
                Phone: ${gym.phone} • Email: ${gym.email}
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #09090b; margin-top: 4px;">
                GSTIN: ${gym.gstin || '27AAACG0561K1Z2'}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase;">TAX INVOICE</div>
              <div style="font-size: 15px; font-weight: 800; color: #09090b; font-family: var(--font-mono);">${rec.receiptNumber}</div>
              <div style="font-size: 12px; color: #52525b; margin-top: 2px;">Date: ${dateStr}</div>
            </div>
          </div>

          <!-- Billed To -->
          <div style="background: #f4f4f5; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; font-size: 12px;">
            <div style="font-weight: 700; color: #09090b;">BILLED TO:</div>
            <div style="color: #27272a; font-weight: 600; font-size: 13px;">${member.name}</div>
            <div style="color: #52525b;">Phone: ${member.phone} ${member.memberCode ? `• ID: ${member.memberCode}` : ''}</div>
          </div>

          <!-- Items Table -->
          <table class="receipt-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Base Amount</th>
                <th style="text-align: right;">GST (18%)</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong style="color: #09090b;">${rec.planName}</strong><br />
                  <span style="font-size: 11px; color: #71717a;">Membership Access & Training Subscription</span>
                </td>
                <td style="text-align: right; font-family: var(--font-mono);">₹${rec.amount.toLocaleString('en-IN')}</td>
                <td style="text-align: right; font-family: var(--font-mono);">₹${rec.taxAmount.toLocaleString('en-IN')}</td>
                <td style="text-align: right; font-weight: 700; font-family: var(--font-mono); color: #09090b;">
                  ₹${rec.totalAmount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Payment Details -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e4e4e7; padding-top: 12px; font-size: 12px;">
            <div>
              <div style="color: #52525b;">Payment Mode: <strong style="color: #09090b;">${rec.paymentMethod}</strong></div>
              <div style="color: #52525b;">Ref / TXN: <span style="font-family: var(--font-mono);">${rec.transactionReference || 'N/A'}</span></div>
              <div style="color: #10b981; font-weight: 700; margin-top: 4px;">PAID IN FULL</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; color: #52525b;">Total Amount Paid</div>
              <div style="font-size: 20px; font-weight: 800; color: #09090b; font-family: var(--font-mono);">
                ₹${rec.totalAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      `;

      const footerHTML = `
        <button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Close</button>
        <button class="btn btn-primary" id="btn-print-receipt">
          ${Icons.print} Print Invoice
        </button>
      `;

      Modal.open({
        title: `Official Tax Invoice — ${rec.receiptNumber}`,
        bodyHTML,
        footerHTML,
        large: true,
        onOpen: (body, footer) => {
          footer.querySelector('#btn-print-receipt').addEventListener('click', () => {
            window.print();
          });
        },
      });
    } catch (err) {
      Toast.error('Failed to load invoice receipt: ' + err.message);
    }
  },
};
