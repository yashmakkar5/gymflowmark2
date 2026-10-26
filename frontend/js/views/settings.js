// Settings & SaaS Configuration View
import { Api } from '../api.js';
import { Icons } from '../components/icons.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export const SettingsView = {
  currentSection: 'profile',
  gymData: null,
  usersList: [],

  async render(container) {
    container.innerHTML = `
      <div style="padding: 24px 0 0;">
        <div class="page-header">
          <div>
            <h1 class="page-title">Settings</h1>
            <p class="page-subtitle">Configure gym profile, tax identifiers, users, and membership policies.</p>
          </div>
        </div>

        <div class="tabs-nav" id="settings-tabs-nav">
          <button class="tab-btn ${this.currentSection === 'profile' ? 'active' : ''}" data-section="profile">Gym Profile</button>
          <button class="tab-btn ${this.currentSection === 'users' ? 'active' : ''}" data-section="users">Users & Roles</button>
          <button class="tab-btn ${this.currentSection === 'membership' ? 'active' : ''}" data-section="membership">Membership Policies</button>
          <button class="tab-btn ${this.currentSection === 'appearance' ? 'active' : ''}" data-section="appearance">Appearance & System</button>
        </div>

        <div id="settings-content-pane">
          <div style="color: var(--text-muted); font-size: 13px;">Loading configurations...</div>
        </div>
      </div>
    `;

    await this.loadSettings(container);
    this.attachEvents(container);
  },

  async loadSettings(container) {
    try {
      const res = await Api.get('/settings');
      if (!res.success) throw new Error(res.message);

      this.gymData = res.data.gym;
      this.usersList = res.data.users;

      this.renderCurrentSection(container);
    } catch (err) {
      Toast.error('Failed to load settings: ' + err.message);
    }
  },

  renderCurrentSection(container) {
    const pane = container.querySelector('#settings-content-pane');
    if (!pane || !this.gymData) return;

    const g = this.gymData;

    if (this.currentSection === 'profile') {
      pane.innerHTML = `
        <div class="section-card" style="max-width: 640px;">
          <div class="section-card-title" style="margin-bottom: 20px;">Gym Information</div>
          <form id="gym-profile-form">
            <div class="form-group">
              <label class="form-label">Gym Legal Name</label>
              <input type="text" id="set-gym-name" class="form-input" value="${g.name}" required />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Owner Name</label>
                <input type="text" id="set-owner-name" class="form-input" value="${g.ownerName}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Contact Phone</label>
                <input type="tel" id="set-phone" class="form-input" value="${g.phone}" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Official Email</label>
                <input type="email" id="set-email" class="form-input" value="${g.email}" required />
              </div>
              <div class="form-group">
                <label class="form-label">GSTIN / Tax ID</label>
                <input type="text" id="set-gstin" class="form-input" value="${g.gstin || '27AAACG0561K1Z2'}" placeholder="27AAACG0561K1Z2" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Premises Address</label>
                <input type="text" id="set-address" class="form-input" value="${g.address || 'Powai'}" />
              </div>
              <div class="form-group">
                <label class="form-label">City</label>
                <input type="text" id="set-city" class="form-input" value="${g.city || 'Mumbai'}" />
              </div>
            </div>

            <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
              <button type="submit" class="btn btn-primary" id="btn-save-profile">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      `;

      pane.querySelector('#gym-profile-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = pane.querySelector('#btn-save-profile');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        try {
          const res = await Api.patch('/settings/profile', {
            name: pane.querySelector('#set-gym-name').value.trim(),
            ownerName: pane.querySelector('#set-owner-name').value.trim(),
            phone: pane.querySelector('#set-phone').value.trim(),
            email: pane.querySelector('#set-email').value.trim(),
            gstin: pane.querySelector('#set-gstin').value.trim(),
            address: pane.querySelector('#set-address').value.trim(),
            city: pane.querySelector('#set-city').value.trim(),
          });

          if (res.success) {
            this.gymData = res.data;
            Toast.success('Gym profile updated successfully.');
          }
        } catch (err) {
          Toast.error(err.message || 'Update failed.');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Save Changes';
        }
      });
    } else if (this.currentSection === 'users') {
      pane.innerHTML = `
        <div class="table-container" style="max-width: 780px;">
          <div class="table-toolbar">
            <div style="font-size: 13px; font-weight: 600; color: var(--text);">Authorized Staff & Team Members</div>
            <button class="btn btn-primary btn-sm" id="btn-add-staff-user">
              ${Icons.plus} Add User
            </button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${this.usersList
                .map(
                  (u) => `
                <tr>
                  <td>
                    <div class="member-cell">
                      <div class="member-avatar" style="width: 26px; height: 26px; font-size: 11px;">${u.name.charAt(0)}</div>
                      <span class="member-name">${u.name}</span>
                    </div>
                  </td>
                  <td style="color: var(--text-secondary);">${u.email}</td>
                  <td>
                    <span class="badge ${u.role === 'owner' ? 'badge-success' : 'badge-neutral'}" style="text-transform: capitalize;">
                      ${u.role}
                    </span>
                  </td>
                  <td><span class="badge badge-success">Active</span></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;

      pane.querySelector('#btn-add-staff-user')?.addEventListener('click', () => {
        this.openAddUserModal(container);
      });
    } else if (this.currentSection === 'membership') {
      pane.innerHTML = `
        <div class="section-card" style="max-width: 640px;">
          <div class="section-card-title" style="margin-bottom: 16px;">Turnstile & Renewal Policies</div>
          <div class="form-group">
            <label class="form-label">Expiry Grace Period (Days)</label>
            <input type="number" id="set-grace" class="form-input" value="${g.settings?.gracePeriodDays || 3}" />
            <span class="form-hint">Number of days a member can enter after plan expiry before access is blocked.</span>
          </div>

          <div class="form-group" style="margin-top: 16px;">
            <label class="form-label">Currency Symbol</label>
            <input type="text" id="set-currency" class="form-input" value="₹" readonly style="opacity: 0.8;" />
            <span class="form-hint">Default currency configured for Indian Rupee (INR).</span>
          </div>

          <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
            <button class="btn btn-primary" id="btn-save-policies">Save Policies</button>
          </div>
        </div>
      `;

      pane.querySelector('#btn-save-policies')?.addEventListener('click', async () => {
        const gracePeriodDays = pane.querySelector('#set-grace').value;
        try {
          const res = await Api.patch('/settings/profile', { gracePeriodDays });
          if (res.success) {
            Toast.success('Membership policies saved.');
          }
        } catch (err) {
          Toast.error(err.message || 'Save failed.');
        }
      });
    } else if (this.currentSection === 'appearance') {
      pane.innerHTML = `
        <div class="section-card" style="max-width: 640px;">
          <div class="section-card-title" style="margin-bottom: 16px;">Interface Direction</div>
          <div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
              <div>
                <strong style="color: var(--text);">Dark-First Visual System</strong>
                <div style="color: var(--text-muted); font-size: 12px;">Linear & Vercel charcoal canvas (#09090B) with 1px zinc borders.</div>
              </div>
              <span class="badge badge-success">Active Default</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
              <div>
                <strong style="color: var(--text);">Accent Palette</strong>
                <div style="color: var(--text-muted); font-size: 12px;">Electric Lime (#10E57A) restricted to CTAs, metrics and active states.</div>
              </div>
              <div style="width: 20px; height: 20px; border-radius: 4px; background: var(--accent);"></div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="color: var(--text);">Multi-Tenant Enforcement</strong>
                <div style="color: var(--text-muted); font-size: 12px;">Tenant queries strictly isolated by authenticated user gymId.</div>
              </div>
              <span class="badge badge-success">Enforced</span>
            </div>
          </div>
        </div>
      `;
    }
  },

  attachEvents(container) {
    container.querySelectorAll('#settings-tabs-nav .tab-btn').forEach((tab) => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('#settings-tabs-nav .tab-btn').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentSection = tab.dataset.section;
        this.renderCurrentSection(container);
      });
    });
  },

  openAddUserModal(container) {
    const bodyHTML = `
      <form id="add-user-form">
        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input type="text" id="u-name" class="form-input" placeholder="e.g. Rahul Verma" required />
        </div>
        <div class="form-group">
          <label class="form-label">Email *</label>
          <input type="email" id="u-email" class="form-input" placeholder="rahul@ironhouse.in" required />
        </div>
        <div class="form-group">
          <label class="form-label">Temporary Password *</label>
          <input type="password" id="u-pass" class="form-input" placeholder="••••••••" required />
        </div>
        <div class="form-group">
          <label class="form-label">Role</label>
          <select id="u-role" class="form-select">
            <option value="staff">Front Desk Staff</option>
            <option value="manager">Gym Manager</option>
            <option value="trainer">Trainer</option>
          </select>
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Cancel</button>
      <button class="btn btn-primary" id="btn-submit-user">Add Team Member</button>
    `;

    Modal.open({
      title: 'Add Authorized Gym User',
      bodyHTML,
      footerHTML,
      onOpen: (body, footer) => {
        footer.querySelector('#btn-submit-user').addEventListener('click', async () => {
          const name = body.querySelector('#u-name').value.trim();
          const email = body.querySelector('#u-email').value.trim();
          const password = body.querySelector('#u-pass').value;
          const role = body.querySelector('#u-role').value;

          if (!name || !email || !password) {
            Toast.error('Please enter all required fields.');
            return;
          }

          try {
            const res = await Api.post('/settings/users', { name, email, password, role });
            if (res.success) {
              Toast.success('Team member added.');
              Modal.close();
              this.loadSettings(container);
            }
          } catch (err) {
            Toast.error(err.message || 'Failed to add user.');
          }
        });
      },
    });
  },
};
