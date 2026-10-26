// Plans Admin Management View
import { Api } from '../api.js';
import { Icons } from '../components/icons.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export const PlansView = {
  plansList: [],

  async render(container) {
    container.innerHTML = `
      <div style="padding: 24px 0 0;">
        <div class="page-header">
          <div>
            <h1 class="page-title">Membership Plans</h1>
            <p class="page-subtitle">Configure pricing tiers, subscriber durations, and benefits.</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" id="btn-create-plan-trigger">
              ${Icons.plus} Create Plan
            </button>
          </div>
        </div>

        <div class="table-container">
          <div style="overflow-x: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Plan Tier</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Subscribers</th>
                  <th>Included Features</th>
                  <th>Status</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody id="plans-table-body">
                <tr>
                  <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    Loading plans...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadPlans(container);
    this.attachEvents(container);
  },

  async loadPlans(container) {
    try {
      const res = await Api.get('/plans');
      if (!res.success) throw new Error(res.message);

      this.plansList = res.data;
      const tbody = container.querySelector('#plans-table-body');
      if (!tbody) return;

      if (!this.plansList.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7">
              <div class="empty-state">
                <div class="empty-state-icon">${Icons.plans}</div>
                <div class="empty-state-title">No membership plans created yet</div>
                <div class="empty-state-subtitle">Create your first pricing tier to start enrolling members.</div>
                <button class="btn btn-secondary btn-sm" id="btn-empty-create-plan">${Icons.plus} Create Plan</button>
              </div>
            </td>
          </tr>
        `;
        tbody.querySelector('#btn-empty-create-plan')?.addEventListener('click', () => {
          this.openPlanModal(container);
        });
        return;
      }

      tbody.innerHTML = this.plansList
        .map((p) => {
          const featuresList = (p.features || []).slice(0, 2).join(' • ');
          const extraCount = (p.features || []).length > 2 ? ` (+${p.features.length - 2} more)` : '';

          return `
          <tr>
            <td>
              <div style="display: flex; flex-direction: column;">
                <strong style="color: var(--text); font-size: 14px;">${p.name}</strong>
                <span style="color: var(--text-muted); font-size: 11px;">${p.description || 'Standard access'}</span>
              </div>
            </td>
            <td class="number-tabular" style="font-weight: 700; font-size: 14px;">
              ₹${p.price.toLocaleString('en-IN')}
            </td>
            <td class="number-tabular" style="color: var(--text-secondary);">
              ${p.durationMonths} ${p.durationMonths === 1 ? 'Month' : 'Months'}
            </td>
            <td class="number-tabular">
              <span class="badge ${p.subscribersCount > 0 ? 'badge-success' : 'badge-neutral'}">
                ${p.subscribersCount || 0} active
              </span>
            </td>
            <td style="color: var(--text-secondary); font-size: 12px; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${featuresList || 'Standard Gym Access'}${extraCount}
            </td>
            <td>
              <span class="badge ${p.isActive ? 'badge-success' : 'badge-neutral'}">
                ${p.isActive ? 'Active' : 'Archived'}
              </span>
            </td>
            <td style="text-align: right;">
              <div style="display: inline-flex; gap: 6px;">
                <button class="btn btn-secondary btn-sm btn-edit-plan" data-id="${p._id}">
                  Edit
                </button>
                <button class="btn btn-ghost btn-sm btn-delete-plan" data-id="${p._id}" data-name="${p.name}">
                  ${Icons.trash}
                </button>
              </div>
            </td>
          </tr>
        `;
        })
        .join('');

      // Attach actions
      tbody.querySelectorAll('.btn-edit-plan').forEach((btn) => {
        btn.addEventListener('click', () => {
          const plan = this.plansList.find((x) => x._id === btn.dataset.id);
          if (plan) this.openPlanModal(container, plan);
        });
      });

      tbody.querySelectorAll('.btn-delete-plan').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.confirmDeletePlan(btn.dataset.id, btn.dataset.name, container);
        });
      });
    } catch (err) {
      Toast.error('Failed to load plans: ' + err.message);
    }
  },

  attachEvents(container) {
    container.querySelector('#btn-create-plan-trigger')?.addEventListener('click', () => {
      this.openPlanModal(container);
    });
  },

  openPlanModal(container, plan = null) {
    const isEdit = Boolean(plan);
    const bodyHTML = `
      <form id="plan-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Plan Name *</label>
            <input type="text" id="plan-name" class="form-input" value="${plan ? plan.name : ''}" placeholder="e.g. Premium" required />
          </div>
          <div class="form-group">
            <label class="form-label">Price (₹ INR) *</label>
            <input type="number" id="plan-price" class="form-input" value="${plan ? plan.price : '1499'}" placeholder="1499" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Duration (Months) *</label>
            <select id="plan-duration" class="form-select">
              <option value="1" ${plan && plan.durationMonths === 1 ? 'selected' : ''}>1 Month</option>
              <option value="3" ${plan && plan.durationMonths === 3 ? 'selected' : ''}>3 Months (Quarterly)</option>
              <option value="6" ${plan && plan.durationMonths === 6 ? 'selected' : ''}>6 Months (Half-Yearly)</option>
              <option value="12" ${plan && plan.durationMonths === 12 ? 'selected' : ''}>12 Months (Annual)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="plan-status" class="form-select">
              <option value="true" ${!plan || plan.isActive ? 'selected' : ''}>Active</option>
              <option value="false" ${plan && !plan.isActive ? 'selected' : ''}>Archived / Inactive</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <input type="text" id="plan-desc" class="form-input" value="${plan ? plan.description || '' : ''}" placeholder="Short summary of this tier" />
        </div>

        <div class="form-group">
          <label class="form-label">Included Features (Comma-separated)</label>
          <input type="text" id="plan-features" class="form-input" value="${plan ? (plan.features || []).join(', ') : 'Locker Access, Steam Room, 1 PT Session'}" placeholder="Locker, Steam Room, Diet Chart" />
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Cancel</button>
      <button class="btn btn-primary" id="btn-submit-plan">${isEdit ? 'Update Plan' : 'Create Plan'}</button>
    `;

    Modal.open({
      title: isEdit ? `Edit Plan — ${plan.name}` : 'Create New Membership Plan',
      bodyHTML,
      footerHTML,
      onOpen: (body, footer) => {
        footer.querySelector('#btn-submit-plan').addEventListener('click', async () => {
          const name = body.querySelector('#plan-name').value.trim();
          const price = body.querySelector('#plan-price').value;
          const durationMonths = body.querySelector('#plan-duration').value;
          const isActive = body.querySelector('#plan-status').value === 'true';
          const description = body.querySelector('#plan-desc').value.trim();
          const features = body.querySelector('#plan-features').value;

          if (!name || price === '') {
            Toast.error('Please specify a plan name and price.');
            return;
          }

          const btn = footer.querySelector('#btn-submit-plan');
          btn.disabled = true;

          try {
            let res;
            if (isEdit) {
              res = await Api.patch(`/plans/${plan._id}`, {
                name,
                price,
                durationMonths,
                isActive,
                description,
                features,
              });
            } else {
              res = await Api.post('/plans', {
                name,
                price,
                durationMonths,
                isActive,
                description,
                features,
              });
            }

            if (res.success) {
              Toast.success(res.message);
              Modal.close();
              this.loadPlans(container);
            }
          } catch (err) {
            Toast.error(err.message || 'Failed to save plan.');
            btn.disabled = false;
          }
        });
      },
    });
  },

  confirmDeletePlan(planId, name, container) {
    Modal.open({
      title: 'Delete Plan',
      bodyHTML: `
        <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
          Are you sure you want to delete the plan <strong style="color: var(--text);">${name}</strong>?
        </div>
      `,
      footerHTML: `
        <button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Cancel</button>
        <button class="btn btn-danger" id="btn-confirm-delete-plan">Delete</button>
      `,
      onOpen: (body, footer) => {
        footer.querySelector('#btn-confirm-delete-plan').addEventListener('click', async () => {
          try {
            const res = await Api.delete(`/plans/${planId}`);
            if (res.success) {
              Toast.success('Plan deleted.');
              Modal.close();
              this.loadPlans(container);
            }
          } catch (err) {
            Toast.error(err.message || 'Delete failed.');
          }
        });
      },
    });
  },
};
