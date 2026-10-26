// Attendance Fast Desk View
import { Api } from '../api.js';
import { Icons } from '../components/icons.js';
import { Toast } from '../components/toast.js';

export const AttendanceView = {
  attendanceData: null,
  allMembers: [],

  async render(container) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    container.innerHTML = `
      <div style="padding: 24px 0 0;">
        <div class="page-header">
          <div>
            <h1 class="page-title">Attendance Desk</h1>
            <p class="page-subtitle">${formattedDate}</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" id="btn-refresh-attendance">
              Refresh Desk
            </button>
          </div>
        </div>

        <!-- Fast Check-in Bar -->
        <div class="section-card" style="margin-bottom: 20px; padding: 16px 20px;">
          <div style="display: flex; gap: 12px; align-items: center;">
            <div style="position: relative; flex: 1;">
              <input type="text" id="att-fast-search" class="form-input" placeholder="Type member name or phone to check in instantly..." autocomplete="off" style="padding-left: 36px; height: 42px; font-size: 14px;" />
              <div style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted);">
                ${Icons.search}
              </div>
              <div id="att-search-dropdown" style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--surface-elevated); border: 1px solid var(--border); border-radius: var(--radius-md); max-height: 240px; overflow-y: auto; z-index: 50; box-shadow: 0 10px 25px rgba(0,0,0,0.5);"></div>
            </div>
            <button class="btn btn-primary" id="btn-trigger-instant-checkin" style="height: 42px; padding: 0 20px;">
              ${Icons.attendance} Fast Check-In
            </button>
          </div>
        </div>

        <!-- Metric Summary Row -->
        <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 20px;">
          <div class="kpi-card">
            <span class="kpi-title">Checked In Today</span>
            <div class="kpi-value number-tabular" id="att-kpi-total">0</div>
            <div class="kpi-subtext">Total entries today</div>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Currently in Gym</span>
            <div class="kpi-value number-tabular" style="color: var(--accent);" id="att-kpi-in-gym">0</div>
            <div class="kpi-subtext" style="display:flex; align-items:center; gap:6px;">
              <span class="pulse-dot"></span> Live on floor
            </div>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Completed Workouts</span>
            <div class="kpi-value number-tabular" id="att-kpi-completed">0</div>
            <div class="kpi-subtext">Finished sessions</div>
          </div>
        </div>

        <!-- Attendance Table -->
        <div class="table-container">
          <div class="table-toolbar">
            <div style="font-size: 13px; font-weight: 600; color: var(--text);">
              Today's Presence Log
            </div>
            <span class="badge badge-neutral" id="att-timestamp-label">Live</span>
          </div>

          <div style="overflow-x: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Phone</th>
                  <th>Check-In Time</th>
                  <th>Check-Out Time</th>
                  <th>Status</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="attendance-table-body">
                <tr>
                  <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    Loading today's attendance logs...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadAllMembers();
    await this.loadAttendance(container);
    this.attachEvents(container);
  },

  async loadAllMembers() {
    try {
      const res = await Api.get('/members');
      if (res.success) this.allMembers = res.data;
    } catch (err) {
      console.warn('Could not preload member list for fast autocomplete', err);
    }
  },

  async loadAttendance(container) {
    try {
      const res = await Api.get('/attendance');
      if (!res.success) throw new Error(res.message);

      this.attendanceData = res;
      const d = res.data;
      const s = res.summary;

      // Update KPIs
      const kpiTotal = container.querySelector('#att-kpi-total');
      const kpiInGym = container.querySelector('#att-kpi-in-gym');
      const kpiCompleted = container.querySelector('#att-kpi-completed');

      if (kpiTotal) kpiTotal.textContent = s.total;
      if (kpiInGym) kpiInGym.textContent = s.currentlyInGym;
      if (kpiCompleted) kpiCompleted.textContent = s.completed;

      const tbody = container.querySelector('#attendance-table-body');
      if (!tbody) return;

      if (!d.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6">
              <div class="empty-state">
                <div class="empty-state-icon">${Icons.attendance}</div>
                <div class="empty-state-title">No members checked in yet today</div>
                <div class="empty-state-subtitle">Use the search box above to quickly check in arriving members.</div>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = d
        .map((r) => {
          const inTime = new Date(r.checkInTime).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const outTime = r.checkOutTime
            ? new Date(r.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            : '—';

          const isInGym = r.status === 'in_gym';

          return `
          <tr>
            <td>
              <div class="member-cell">
                <div class="member-avatar">${r.memberName.charAt(0)}</div>
                <span class="member-name">${r.memberName}</span>
              </div>
            </td>
            <td class="number-tabular" style="color: var(--text-secondary);">${r.memberPhone || '—'}</td>
            <td class="number-tabular" style="font-weight: 500;">${inTime}</td>
            <td class="number-tabular" style="color: var(--text-muted);">${outTime}</td>
            <td>
              <span class="badge ${isInGym ? 'badge-success' : 'badge-neutral'}">
                ${isInGym ? 'In Gym' : 'Completed'}
              </span>
            </td>
            <td style="text-align: right;">
              ${
                isInGym
                  ? `
                <button class="btn btn-secondary btn-sm btn-att-checkout" data-id="${r._id}" data-name="${r.memberName}">
                  Check Out
                </button>
              `
                  : `
                <button class="btn btn-ghost btn-sm btn-att-recheckin" data-memberid="${r.memberId}" data-name="${r.memberName}">
                  Re-enter
                </button>
              `
              }
            </td>
          </tr>
        `;
        })
        .join('');

      // Attach check-out actions
      tbody.querySelectorAll('.btn-att-checkout').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            const res = await Api.post('/attendance/check-out', { attendanceId: btn.dataset.id });
            if (res.success) {
              Toast.success(`${btn.dataset.name} checked out.`);
              this.loadAttendance(container);
            }
          } catch (err) {
            Toast.error(err.message || 'Check out failed.');
          }
        });
      });

      tbody.querySelectorAll('.btn-att-recheckin').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            const res = await Api.post('/attendance/check-in', { memberId: btn.dataset.memberid });
            if (res.success) {
              Toast.success(`${btn.dataset.name} checked in.`);
              this.loadAttendance(container);
            }
          } catch (err) {
            Toast.error(err.message || 'Check in failed.');
          }
        });
      });
    } catch (err) {
      Toast.error('Failed to load attendance: ' + err.message);
    }
  },

  attachEvents(container) {
    const refreshBtn = container.querySelector('#btn-refresh-attendance');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadAttendance(container);
        Toast.info('Attendance refreshed.');
      });
    }

    const searchInput = container.querySelector('#att-fast-search');
    const dropdown = container.querySelector('#att-search-dropdown');

    if (searchInput && dropdown) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        if (!val) {
          dropdown.style.display = 'none';
          return;
        }

        const matches = this.allMembers.filter(
          (m) => m.name.toLowerCase().includes(val) || m.phone.includes(val) || (m.memberCode && m.memberCode.toLowerCase().includes(val))
        );

        if (!matches.length) {
          dropdown.innerHTML = `<div style="padding: 10px 14px; font-size: 12px; color: var(--text-muted);">No matching members found.</div>`;
          dropdown.style.display = 'block';
          return;
        }

        dropdown.innerHTML = matches
          .slice(0, 6)
          .map(
            (m) => `
            <div class="att-dropdown-item" data-id="${m._id}" data-name="${m.name}" style="padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background var(--transition);">
              <div>
                <strong style="color: var(--text); font-size: 13px;">${m.name}</strong>
                <span style="color: var(--text-muted); font-size: 11px; margin-left: 6px;">${m.phone}</span>
              </div>
              <span class="badge ${m.status === 'active' ? 'badge-success' : 'badge-warning'}">${m.status}</span>
            </div>
          `
          )
          .join('');

        dropdown.style.display = 'block';

        dropdown.querySelectorAll('.att-dropdown-item').forEach((item) => {
          item.addEventListener('mouseenter', () => (item.style.background = 'var(--surface-hover)'));
          item.addEventListener('mouseleave', () => (item.style.background = 'transparent'));
          item.addEventListener('click', async () => {
            const memberId = item.dataset.id;
            const name = item.dataset.name;
            dropdown.style.display = 'none';
            searchInput.value = '';

            try {
              const res = await Api.post('/attendance/toggle', { memberId });
              if (res.success) {
                Toast.success(res.message);
                this.loadAttendance(container);
              }
            } catch (err) {
              Toast.error(err.message || 'Attendance action failed.');
            }
          });
        });
      });

      // Hide dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.style.display = 'none';
        }
      });
    }
  },
};
