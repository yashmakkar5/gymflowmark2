// Members Management View
import { Api } from '../api.js';
import { Icons } from '../components/icons.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export const MembersView = {
  currentFilter: 'all',
  searchQuery: '',
  membersList: [],
  plansList: [],

  async render(container) {
    container.innerHTML = `
      <div style="padding: 24px 0 0;">
        <div class="page-header">
          <div>
            <h1 class="page-title">Members</h1>
            <p class="page-subtitle">Manage member profiles, subscriptions, and active renewals.</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" id="btn-add-member-trigger">
              ${Icons.plus} Add Member
            </button>
          </div>
        </div>

        <!-- Data Table Container -->
        <div class="table-container">
          <!-- Toolbar -->
          <div class="table-toolbar">
            <div class="search-input-wrapper">
              ${Icons.search}
              <input type="text" id="member-search-input" class="table-search-input" placeholder="Search by name, phone or code..." />
            </div>

            <div class="filter-tabs" id="member-filter-tabs">
              <button class="filter-tab ${this.currentFilter === 'all' ? 'active' : ''}" data-status="all">All</button>
              <button class="filter-tab ${this.currentFilter === 'active' ? 'active' : ''}" data-status="active">Active</button>
              <button class="filter-tab ${this.currentFilter === 'expiring_soon' ? 'active' : ''}" data-status="expiring_soon">Expiring Soon</button>
              <button class="filter-tab ${this.currentFilter === 'expired' ? 'active' : ''}" data-status="expired">Expired</button>
            </div>
          </div>

          <!-- Table -->
          <div style="overflow-x: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Phone</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Expiry</th>
                  <th>Payment</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody id="members-table-body">
                <tr>
                  <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    Loading members directory...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadPlans();
    await this.loadMembers(container);
    this.attachEvents(container);
  },

  async loadPlans() {
    try {
      const res = await Api.get('/plans');
      if (res.success) {
        this.plansList = res.data;
      }
    } catch (err) {
      console.warn('Could not load plans for modal dropdown', err);
    }
  },

  async loadMembers(container) {
    try {
      const res = await Api.get('/members', {
        status: this.currentFilter,
        search: this.searchQuery,
      });

      if (!res.success) throw new Error(res.message);

      this.membersList = res.data;
      this.renderTableBody(container);
    } catch (err) {
      Toast.error('Failed to load members: ' + err.message);
    }
  },

  renderTableBody(container) {
    const tbody = container.querySelector('#members-table-body');
    if (!tbody) return;

    if (!this.membersList.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <div class="empty-state-icon">${Icons.members}</div>
              <div class="empty-state-title">No members found</div>
              <div class="empty-state-subtitle">No member records matched your search or status filter.</div>
              <button class="btn btn-secondary btn-sm" id="btn-empty-add-member">${Icons.plus} Add Member</button>
            </div>
          </td>
        </tr>
      `;

      tbody.querySelector('#btn-empty-add-member')?.addEventListener('click', () => {
        this.openAddMemberModal(container);
      });
      return;
    }

    tbody.innerHTML = this.membersList
      .map((m) => {
        const joinedDate = new Date(m.joinedDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        const expiryDate = new Date(m.membershipEndDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        let statusBadge = '<span class="badge badge-success">Active</span>';
        if (m.status === 'expiring_soon') {
          statusBadge = '<span class="badge badge-warning">Expiring Soon</span>';
        } else if (m.status === 'expired') {
          statusBadge = '<span class="badge badge-danger">Expired</span>';
        }

        let paymentBadge = '<span class="badge badge-success">Paid</span>';
        if (m.paymentStatus === 'pending') {
          paymentBadge = '<span class="badge badge-warning">Pending</span>';
        } else if (m.paymentStatus === 'overdue') {
          paymentBadge = '<span class="badge badge-danger">Overdue</span>';
        }

        return `
        <tr>
          <td>
            <div class="member-cell">
              <div class="member-avatar">${m.name.charAt(0)}</div>
              <div class="member-meta">
                <span class="member-name">${m.name}</span>
                <span class="member-code">${m.memberCode || 'MEMBER'}</span>
              </div>
            </div>
          </td>
          <td class="number-tabular" style="color: var(--text-secondary);">${m.phone}</td>
          <td><span style="font-weight: 500;">${m.planName || 'Standard'}</span></td>
          <td>${statusBadge}</td>
          <td class="number-tabular" style="color: var(--text-muted);">${joinedDate}</td>
          <td class="number-tabular" style="font-weight: 500;">${expiryDate}</td>
          <td>${paymentBadge}</td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm btn-view-member" data-id="${m._id}" title="View CRM Profile">
                View
              </button>
              <button class="btn btn-ghost btn-sm btn-delete-member" data-id="${m._id}" data-name="${m.name}" title="Delete Member">
                ${Icons.trash}
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join('');

    // Attach actions
    tbody.querySelectorAll('.btn-view-member').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.location.hash = `#/members/${btn.dataset.id}`;
      });
    });

    tbody.querySelectorAll('.btn-delete-member').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.confirmDeleteMember(btn.dataset.id, btn.dataset.name, container);
      });
    });
  },

  attachEvents(container) {
    // Add Member
    container.querySelector('#btn-add-member-trigger')?.addEventListener('click', () => {
      this.openAddMemberModal(container);
    });

    // Search
    let debounceTimer;
    const searchInput = container.querySelector('#member-search-input');
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.searchQuery = e.target.value;
        this.loadMembers(container);
      }, 250);
    });

    // Filter Tabs
    container.querySelectorAll('#member-filter-tabs .filter-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('#member-filter-tabs .filter-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentFilter = tab.dataset.status;
        this.loadMembers(container);
      });
    });
  },

  openAddMemberModal(container) {
    const plansOptions = this.plansList
      .map((p) => `<option value="${p._id}">${p.name} — ₹${p.price.toLocaleString('en-IN')} (${p.durationMonths} Mo)</option>`)
      .join('');

    const bodyHTML = `
      <form id="add-member-form">
        <!-- Group 1: Personal Information -->
        <fieldset class="form-fieldset">
          <legend class="form-legend">Personal Information</legend>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" id="m-name" class="form-input" placeholder="e.g. Rahul Sharma" required />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number *</label>
              <input type="tel" id="m-phone" class="form-input" placeholder="e.g. 98201 12345" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="m-email" class="form-input" placeholder="name@email.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Gender</label>
              <select id="m-gender" class="form-select">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </fieldset>

        <!-- Group 2: Contact Information & Emergency -->
        <fieldset class="form-fieldset">
          <legend class="form-legend">Contact & Emergency</legend>
          <div class="form-group">
            <label class="form-label">Residential Address</label>
            <input type="text" id="m-address" class="form-input" placeholder="e.g. Flat 402, Powai Lake Towers, Mumbai" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Emergency Contact Name</label>
              <input type="text" id="m-emerg-name" class="form-input" placeholder="e.g. Priya Sharma" />
            </div>
            <div class="form-group">
              <label class="form-label">Emergency Contact Phone</label>
              <input type="tel" id="m-emerg-phone" class="form-input" placeholder="e.g. 98201 99999" />
            </div>
          </div>
        </fieldset>

        <!-- Group 3: Membership Plan -->
        <fieldset class="form-fieldset">
          <legend class="form-legend">Membership Plan</legend>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Select Plan *</label>
              <select id="m-plan" class="form-select" required>
                ${plansOptions || '<option value="">Standard Plan</option>'}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input type="date" id="m-start-date" class="form-input" value="${new Date().toISOString().split('T')[0]}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Initial Payment Collection</label>
            <select id="m-payment-method" class="form-select">
              <option value="UPI">Collect upfront via UPI</option>
              <option value="Cash">Collect upfront in Cash</option>
              <option value="Card">Collect upfront via Card</option>
              <option value="">Mark Pending (Collect Later)</option>
            </select>
          </div>
        </fieldset>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Cancel</button>
      <button class="btn btn-primary" id="btn-submit-new-member">Create Member</button>
    `;

    Modal.open({
      title: 'Add New Member',
      bodyHTML,
      footerHTML,
      large: true,
      onOpen: (body, footer) => {
        footer.querySelector('#btn-submit-new-member').addEventListener('click', async () => {
          const name = body.querySelector('#m-name').value.trim();
          const phone = body.querySelector('#m-phone').value.trim();
          const email = body.querySelector('#m-email').value.trim();
          const gender = body.querySelector('#m-gender').value;
          const address = body.querySelector('#m-address').value.trim();
          const emergencyName = body.querySelector('#m-emerg-name').value.trim();
          const emergencyPhone = body.querySelector('#m-emerg-phone').value.trim();
          const planId = body.querySelector('#m-plan').value;
          const startDate = body.querySelector('#m-start-date').value;
          const paymentMethod = body.querySelector('#m-payment-method').value;

          if (!name || !phone) {
            Toast.error('Please enter member name and phone number.');
            return;
          }

          const btn = footer.querySelector('#btn-submit-new-member');
          btn.disabled = true;
          btn.textContent = 'Creating...';

          try {
            const res = await Api.post('/members', {
              name,
              phone,
              email,
              gender,
              address,
              emergencyName,
              emergencyPhone,
              planId,
              startDate,
              paymentMethod,
            });

            if (res.success) {
              Toast.success(`Member ${name} enrolled successfully.`);
              Modal.close();
              this.loadMembers(container);
            }
          } catch (err) {
            Toast.error(err.message || 'Failed to create member.');
            btn.disabled = false;
            btn.textContent = 'Create Member';
          }
        });
      },
    });
  },

  confirmDeleteMember(memberId, name, container) {
    Modal.open({
      title: 'Remove Member',
      bodyHTML: `
        <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
          Are you sure you want to remove <strong style="color: var(--text);">${name}</strong> from your gym records?
          This action will permanently delete their attendance and membership logs.
        </div>
      `,
      footerHTML: `
        <button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Cancel</button>
        <button class="btn btn-danger" id="btn-confirm-delete">Delete Member</button>
      `,
      onOpen: (body, footer) => {
        footer.querySelector('#btn-confirm-delete').addEventListener('click', async () => {
          try {
            const res = await Api.delete(`/members/${memberId}`);
            if (res.success) {
              Toast.success('Member removed successfully.');
              Modal.close();
              this.loadMembers(container);
            }
          } catch (err) {
            Toast.error(err.message || 'Failed to remove member.');
          }
        });
      },
    });
  },
};
