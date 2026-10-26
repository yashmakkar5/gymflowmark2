// Trainers & Staff Roster View
import { Api } from '../api.js';
import { Icons } from '../components/icons.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export const TrainersView = {
  trainersList: [],

  async render(container) {
    container.innerHTML = `
      <div style="padding: 24px 0 0;">
        <div class="page-header">
          <div>
            <h1 class="page-title">Trainers & Staff</h1>
            <p class="page-subtitle">Manage coaches, personal trainers, shifts, and assigned trainees.</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" id="btn-add-trainer-trigger">
              ${Icons.plus} Add Trainer
            </button>
          </div>
        </div>

        <div class="table-container">
          <div style="overflow-x: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Coach / Trainer</th>
                  <th>Role & Specialization</th>
                  <th>Phone Number</th>
                  <th>Shift Schedule</th>
                  <th>Assigned Trainees</th>
                  <th>Status</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody id="trainers-table-body">
                <tr>
                  <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    Loading staff roster...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadTrainers(container);
    this.attachEvents(container);
  },

  async loadTrainers(container) {
    try {
      const res = await Api.get('/trainers');
      if (!res.success) throw new Error(res.message);

      this.trainersList = res.data;
      const tbody = container.querySelector('#trainers-table-body');
      if (!tbody) return;

      if (!this.trainersList.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7">
              <div class="empty-state">
                <div class="empty-state-icon">${Icons.trainers}</div>
                <div class="empty-state-title">No trainers added yet</div>
                <div class="empty-state-subtitle">Add your fitness trainers to start assigning members and scheduling classes.</div>
                <button class="btn btn-secondary btn-sm" id="btn-empty-add-trainer">${Icons.plus} Add Trainer</button>
              </div>
            </td>
          </tr>
        `;
        tbody.querySelector('#btn-empty-add-trainer')?.addEventListener('click', () => {
          this.openTrainerModal(container);
        });
        return;
      }

      tbody.innerHTML = this.trainersList
        .map((t) => {
          return `
          <tr>
            <td>
              <div class="member-cell">
                <div class="member-avatar" style="background: var(--surface-hover); color: var(--accent);">
                  ${t.name.charAt(0)}
                </div>
                <div class="member-meta">
                  <span class="member-name">${t.name}</span>
                  <span class="member-code">${t.email || 'Gym Staff'}</span>
                </div>
              </div>
            </td>
            <td>
              <div style="display: flex; flex-direction: column;">
                <strong style="color: var(--text);">${t.role}</strong>
                <span style="color: var(--text-muted); font-size: 11px;">${t.specialization}</span>
              </div>
            </td>
            <td class="number-tabular" style="color: var(--text-secondary);">${t.phone}</td>
            <td style="color: var(--text-secondary); font-size: 12px;">${t.shift}</td>
            <td class="number-tabular">
              <span class="badge ${t.assignedMembersCount > 0 ? 'badge-success' : 'badge-neutral'}">
                ${t.assignedMembersCount || 0} members
              </span>
            </td>
            <td>
              <span class="badge ${t.status === 'active' ? 'badge-success' : 'badge-neutral'}">
                ${t.status}
              </span>
            </td>
            <td style="text-align: right;">
              <div style="display: inline-flex; gap: 6px;">
                <button class="btn btn-secondary btn-sm btn-edit-trainer" data-id="${t._id}">
                  Edit
                </button>
                <button class="btn btn-ghost btn-sm btn-delete-trainer" data-id="${t._id}" data-name="${t.name}">
                  ${Icons.trash}
                </button>
              </div>
            </td>
          </tr>
        `;
        })
        .join('');

      tbody.querySelectorAll('.btn-edit-trainer').forEach((btn) => {
        btn.addEventListener('click', () => {
          const tr = this.trainersList.find((x) => x._id === btn.dataset.id);
          if (tr) this.openTrainerModal(container, tr);
        });
      });

      tbody.querySelectorAll('.btn-delete-trainer').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.confirmDeleteTrainer(btn.dataset.id, btn.dataset.name, container);
        });
      });
    } catch (err) {
      Toast.error('Failed to load trainers: ' + err.message);
    }
  },

  attachEvents(container) {
    container.querySelector('#btn-add-trainer-trigger')?.addEventListener('click', () => {
      this.openTrainerModal(container);
    });
  },

  openTrainerModal(container, trainer = null) {
    const isEdit = Boolean(trainer);
    const bodyHTML = `
      <form id="trainer-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="tr-name" class="form-input" value="${trainer ? trainer.name : ''}" placeholder="e.g. Sameer Khan" required />
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number *</label>
            <input type="tel" id="tr-phone" class="form-input" value="${trainer ? trainer.phone : ''}" placeholder="+91 98334 11223" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Role Title</label>
            <input type="text" id="tr-role" class="form-input" value="${trainer ? trainer.role : 'Head Strength Coach'}" placeholder="e.g. Strength Coach" />
          </div>
          <div class="form-group">
            <label class="form-label">Specialization</label>
            <input type="text" id="tr-spec" class="form-input" value="${trainer ? trainer.specialization : 'Powerlifting & Hypertrophy'}" placeholder="e.g. CrossFit, Yoga" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="tr-email" class="form-input" value="${trainer ? trainer.email || '' : ''}" placeholder="sameer@ironhouse.in" />
          </div>
          <div class="form-group">
            <label class="form-label">Shift Timing</label>
            <select id="tr-shift" class="form-select">
              <option value="Morning (06:00 AM - 02:00 PM)" ${trainer && trainer.shift.includes('Morning') ? 'selected' : ''}>Morning (06:00 AM - 02:00 PM)</option>
              <option value="Evening (02:00 PM - 10:00 PM)" ${trainer && trainer.shift.includes('Evening') ? 'selected' : ''}>Evening (02:00 PM - 10:00 PM)</option>
              <option value="Full Shift (07:00 AM - 04:00 PM)" ${trainer && trainer.shift.includes('Full') ? 'selected' : ''}>Full Shift (07:00 AM - 04:00 PM)</option>
            </select>
          </div>
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Cancel</button>
      <button class="btn btn-primary" id="btn-submit-trainer">${isEdit ? 'Update Trainer' : 'Add Trainer'}</button>
    `;

    Modal.open({
      title: isEdit ? `Edit Coach — ${trainer.name}` : 'Add New Trainer / Coach',
      bodyHTML,
      footerHTML,
      onOpen: (body, footer) => {
        footer.querySelector('#btn-submit-trainer').addEventListener('click', async () => {
          const name = body.querySelector('#tr-name').value.trim();
          const phone = body.querySelector('#tr-phone').value.trim();
          const role = body.querySelector('#tr-role').value.trim();
          const specialization = body.querySelector('#tr-spec').value.trim();
          const email = body.querySelector('#tr-email').value.trim();
          const shift = body.querySelector('#tr-shift').value;

          if (!name || !phone) {
            Toast.error('Please specify trainer name and phone number.');
            return;
          }

          const btn = footer.querySelector('#btn-submit-trainer');
          btn.disabled = true;

          try {
            let res;
            if (isEdit) {
              res = await Api.patch(`/trainers/${trainer._id}`, { name, phone, role, specialization, email, shift });
            } else {
              res = await Api.post('/trainers', { name, phone, role, specialization, email, shift });
            }

            if (res.success) {
              Toast.success(res.message);
              Modal.close();
              this.loadTrainers(container);
            }
          } catch (err) {
            Toast.error(err.message || 'Operation failed.');
            btn.disabled = false;
          }
        });
      },
    });
  },

  confirmDeleteTrainer(trainerId, name, container) {
    Modal.open({
      title: 'Remove Coach',
      bodyHTML: `
        <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
          Are you sure you want to remove <strong style="color: var(--text);">${name}</strong> from your staff list?
        </div>
      `,
      footerHTML: `
        <button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Cancel</button>
        <button class="btn btn-danger" id="btn-confirm-delete-trainer">Delete</button>
      `,
      onOpen: (body, footer) => {
        footer.querySelector('#btn-confirm-delete-trainer').addEventListener('click', async () => {
          try {
            const res = await Api.delete(`/trainers/${trainerId}`);
            if (res.success) {
              Toast.success('Trainer removed.');
              Modal.close();
              this.loadTrainers(container);
            }
          } catch (err) {
            Toast.error(err.message || 'Delete failed.');
          }
        });
      },
    });
  },
};
