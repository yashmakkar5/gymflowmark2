// Member Profile View (CRM Detail View with 4 tabs)
import { Api } from '../api.js';
import { Icons } from '../components/icons.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export const MemberProfileView = {
  currentTab: 'overview',
  memberData: null,
  plansList: [],

  async render(container, memberId) {
    container.innerHTML = `
      <div style="padding: 24px 0 0;" id="member-profile-root">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
          <a href="#/members" class="btn btn-ghost btn-sm" style="padding-left: 4px;">
            ${Icons.arrowLeft} Back to Members
          </a>
        </div>

        <div style="color: var(--text-muted); font-size: 13px;">Loading member details...</div>
      </div>
    `;

    await this.loadPlans();
    await this.loadData(container, memberId);
  },

  async loadPlans() {
    try {
      const res = await Api.get('/plans');
      if (res.success) this.plansList = res.data;
    } catch (err) {
      console.warn(err);
    }
  },

  async loadData(container, memberId) {
    try {
      const res = await Api.get(`/members/${memberId}`);
      if (!res.success) throw new Error(res.message);

      this.memberData = res.data;
      const m = this.memberData.member;

      let statusBadge = '<span class="badge badge-success">Active Member</span>';
      if (m.status === 'expiring_soon') {
        statusBadge = '<span class="badge badge-warning">Expiring Soon</span>';
      } else if (m.status === 'expired') {
        statusBadge = '<span class="badge badge-danger">Expired Membership</span>';
      }

      const root = container.querySelector('#member-profile-root');
      root.innerHTML = `
        <!-- CRM Header -->
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
          <a href="#/members" class="btn btn-ghost btn-sm" style="padding-left: 4px;">
            ${Icons.arrowLeft} Back to Members
          </a>
        </div>

        <div class="page-header" style="align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div class="member-avatar" style="width: 56px; height: 56px; font-size: 20px; position: relative; border-radius: 50%; overflow: visible; ${m.avatarUrl ? `background-image: url('${m.avatarUrl}'); background-size: cover; background-position: center; color: transparent;` : ''}">
              ${m.avatarUrl ? '' : m.name.charAt(0)}
              <label for="member-avatar-upload" style="position: absolute; bottom: -2px; right: -2px; background: var(--surface-elevated); border: 1px solid var(--border); border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-secondary); box-shadow: 0 2px 5px rgba(0,0,0,0.4);" title="Upload Photo (Multer)">
                ${Icons.edit}
              </label>
              <input type="file" id="member-avatar-upload" accept="image/*" style="display: none;" />
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                <h1 class="page-title" style="margin-bottom: 0;">${m.name}</h1>
                ${statusBadge}
              </div>
              <p class="page-subtitle">
                ID: <strong style="color: var(--text);">${m.memberCode || 'MEMBER'}</strong> • 
                Joined: ${new Date(m.joinedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" id="btn-profile-checkin">
              ${Icons.attendance} Check In
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-profile-payment">
              ${Icons.receipt} Record Payment
            </button>
            <button class="btn btn-primary btn-sm" id="btn-profile-renew">
              Renew Membership
            </button>
          </div>
        </div>

        <!-- CRM Navigation Tabs -->
        <div class="tabs-nav" id="profile-tabs-nav">
          <button class="tab-btn ${this.currentTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
          <button class="tab-btn ${this.currentTab === 'attendance' ? 'active' : ''}" data-tab="attendance">
            Attendance (${this.memberData.attendance.length})
          </button>
          <button class="tab-btn ${this.currentTab === 'payments' ? 'active' : ''}" data-tab="payments">
            Payments (${this.memberData.payments.length})
          </button>
          <button class="tab-btn ${this.currentTab === 'history' ? 'active' : ''}" data-tab="history">
            Membership History
          </button>
        </div>

        <!-- Tab Body Content -->
        <div id="profile-tab-content"></div>
      `;

      this.renderTabContent(root);
      this.attachEvents(root, memberId);
    } catch (err) {
      Toast.error('Failed to load member profile: ' + err.message);
    }
  },

  renderTabContent(root) {
    const content = root.querySelector('#profile-tab-content');
    if (!content || !this.memberData) return;

    const m = this.memberData.member;

    if (this.currentTab === 'overview') {
      const expiryFormatted = new Date(m.membershipEndDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const startFormatted = new Date(m.membershipStartDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      content.innerHTML = `
        <div class="dashboard-grid">
          <!-- Left Column: Personal & Membership Card -->
          <div>
            <div class="section-card">
              <div class="section-card-title" style="margin-bottom: 16px;">Membership Details</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                <div>
                  <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Current Plan</div>
                  <div style="font-size: 15px; font-weight: 700; color: var(--text); margin-top: 2px;">${m.planName}</div>
                </div>
                <div>
                  <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Payment Status</div>
                  <div style="font-size: 14px; font-weight: 600; text-transform: capitalize; color: ${m.paymentStatus === 'paid' ? 'var(--accent)' : 'var(--warning)'}; margin-top: 2px;">
                    ${m.paymentStatus}
                  </div>
                </div>
                <div>
                  <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Valid From</div>
                  <div class="number-tabular" style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">${startFormatted}</div>
                </div>
                <div>
                  <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Valid Until</div>
                  <div class="number-tabular" style="font-size: 13px; font-weight: 600; color: var(--text); margin-top: 2px;">${expiryFormatted}</div>
                </div>
              </div>
            </div>

            <div class="section-card">
              <div class="section-card-title" style="margin-bottom: 16px;">Personal & Contact Information</div>
              <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
                  <span style="color: var(--text-secondary);">Phone</span>
                  <span style="color: var(--text); font-weight: 500;">${m.phone}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
                  <span style="color: var(--text-secondary);">Email</span>
                  <span style="color: var(--text); font-weight: 500;">${m.email || 'Not provided'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
                  <span style="color: var(--text-secondary);">Gender</span>
                  <span style="color: var(--text); font-weight: 500; text-transform: capitalize;">${m.gender || 'male'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-secondary);">Address</span>
                  <span style="color: var(--text); font-weight: 500; text-align: right; max-width: 250px;">${m.address || 'Powai, Mumbai'}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Emergency & Staff Notes -->
          <div>
            <div class="section-card">
              <div class="section-card-title" style="margin-bottom: 16px;">Emergency Contact</div>
              <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-secondary);">Contact Name</span>
                  <span style="color: var(--text); font-weight: 500;">${m.emergencyContact?.name || 'Not on file'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-secondary);">Phone Number</span>
                  <span style="color: var(--text); font-weight: 500;">${m.emergencyContact?.phone || 'Not on file'}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-secondary);">Relationship</span>
                  <span style="color: var(--text); font-weight: 500;">${m.emergencyContact?.relation || 'Guardian'}</span>
                </div>
              </div>
            </div>

            <div class="section-card">
              <div class="section-card-title" style="margin-bottom: 12px;">Trainer & Workout Notes</div>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
                ${m.notes || 'No workout restrictions or medical limitations documented.'}
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (this.currentTab === 'attendance') {
      const records = this.memberData.attendance;
      if (!records.length) {
        content.innerHTML = `
          <div class="table-container empty-state">
            <div class="empty-state-icon">${Icons.attendance}</div>
            <div class="empty-state-title">No attendance records</div>
            <div class="empty-state-subtitle">Member has not checked in during the last 30 days.</div>
          </div>
        `;
      } else {
        content.innerHTML = `
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${records
                  .map(
                    (r) => `
                  <tr>
                    <td class="number-tabular">${r.date}</td>
                    <td class="number-tabular">${new Date(r.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td class="number-tabular">${r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td>
                      <span class="badge ${r.status === 'in_gym' ? 'badge-success' : 'badge-neutral'}">
                        ${r.status === 'in_gym' ? 'In Gym' : 'Completed'}
                      </span>
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } else if (this.currentTab === 'payments') {
      const records = this.memberData.payments;
      if (!records.length) {
        content.innerHTML = `
          <div class="table-container empty-state">
            <div class="empty-state-icon">${Icons.receipt}</div>
            <div class="empty-state-title">No payment records found</div>
            <div class="empty-state-subtitle">No recorded billing transactions for this member.</div>
          </div>
        `;
      } else {
        content.innerHTML = `
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${records
                  .map(
                    (p) => `
                  <tr>
                    <td><strong class="number-tabular" style="font-family: var(--font-mono); font-size: 12px;">${p.receiptNumber}</strong></td>
                    <td class="number-tabular" style="color: var(--text-secondary);">${new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                    <td>${p.planName}</td>
                    <td class="number-tabular" style="font-weight: 700;">₹${p.totalAmount.toLocaleString('en-IN')}</td>
                    <td><span class="badge badge-neutral">${p.paymentMethod}</span></td>
                    <td><span class="badge badge-success">Paid</span></td>
                    <td style="text-align: right;">
                      <button class="btn btn-secondary btn-sm btn-view-receipt" data-id="${p._id}">
                        ${Icons.receipt} View Receipt
                      </button>
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `;

        content.querySelectorAll('.btn-view-receipt').forEach((btn) => {
          btn.addEventListener('click', () => {
            import('./payments.js').then((module) => {
              module.PaymentsView.openReceiptModal(btn.dataset.id);
            });
          });
        });
      }
    } else if (this.currentTab === 'history') {
      const subs = this.memberData.subscriptions;
      content.innerHTML = `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Plan Name</th>
                <th>Fee</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                subs.length
                  ? subs
                      .map(
                        (s) => `
                <tr>
                  <td><strong>${s.planName}</strong></td>
                  <td class="number-tabular">₹${s.amount.toLocaleString('en-IN')}</td>
                  <td class="number-tabular">${new Date(s.startDate).toLocaleDateString('en-IN')}</td>
                  <td class="number-tabular">${new Date(s.endDate).toLocaleDateString('en-IN')}</td>
                  <td><span class="badge badge-neutral" style="text-transform: capitalize;">${s.status}</span></td>
                </tr>
              `
                      )
                      .join('')
                  : `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">No historical renewals recorded.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      `;
    }
  },

  attachEvents(root, memberId) {
    // Tabs
    root.querySelectorAll('#profile-tabs-nav .tab-btn').forEach((tab) => {
      tab.addEventListener('click', () => {
        root.querySelectorAll('#profile-tabs-nav .tab-btn').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentTab = tab.dataset.tab;
        this.renderTabContent(root);
      });
    });

    // Avatar file upload (Multer)
    const avatarInput = root.querySelector('#member-avatar-upload');
    avatarInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('avatar', file);

      try {
        Toast.info('Uploading photo...');
        const token = Api.getToken();
        const res = await fetch(`/api/members/${memberId}/avatar`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Upload failed');

        Toast.success('Profile avatar updated successfully!');
        this.loadData(root.parentElement, memberId);
      } catch (err) {
        Toast.error(err.message || 'Avatar upload failed');
      }
    });

    // Checkin button
    root.querySelector('#btn-profile-checkin')?.addEventListener('click', async () => {
      try {
        const res = await Api.post('/attendance/check-in', { memberId });
        if (res.success) {
          Toast.success(res.message);
          this.loadData(root.parentElement, memberId);
        }
      } catch (err) {
        Toast.error(err.message || 'Check-in failed');
      }
    });

    // Renew Membership button
    root.querySelector('#btn-profile-renew')?.addEventListener('click', () => {
      this.openRenewModal(root.parentElement, memberId);
    });

    // Record Payment
    root.querySelector('#btn-profile-payment')?.addEventListener('click', () => {
      import('./payments.js').then((module) => {
        module.PaymentsView.openRecordPaymentModal(() => {
          this.loadData(root.parentElement, memberId);
        }, memberId);
      });
    });
  },

  openRenewModal(container, memberId) {
    const plansOptions = this.plansList
      .map((p) => `<option value="${p._id}">${p.name} — ₹${p.price.toLocaleString('en-IN')} (${p.durationMonths} Mo)</option>`)
      .join('');

    Modal.open({
      title: `Renew Membership — ${this.memberData.member.name}`,
      bodyHTML: `
        <div class="form-group">
          <label class="form-label">Select Renewal Plan</label>
          <select id="renew-plan-select" class="form-select">
            ${plansOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Payment Mode</label>
          <select id="renew-payment-method" class="form-select">
            <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
            <option value="Cash">Cash</option>
            <option value="Card">Debit / Credit Card</option>
            <option value="NetBanking">Net Banking</option>
          </select>
        </div>
      `,
      footerHTML: `
        <button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-renew">Confirm Renewal</button>
      `,
      onOpen: (body, footer) => {
        footer.querySelector('#btn-submit-renew').addEventListener('click', async () => {
          const planId = body.querySelector('#renew-plan-select').value;
          const paymentMethod = body.querySelector('#renew-payment-method').value;

          const btn = footer.querySelector('#btn-submit-renew');
          btn.disabled = true;
          btn.textContent = 'Renewing...';

          try {
            const res = await Api.post(`/members/${memberId}/renew`, {
              planId,
              paymentMethod,
            });

            if (res.success) {
              Toast.success(res.message);
              Modal.close();
              this.loadData(container, memberId);
            }
          } catch (err) {
            Toast.error(err.message || 'Renewal failed.');
            btn.disabled = false;
            btn.textContent = 'Confirm Renewal';
          }
        });
      },
    });
  },
};
