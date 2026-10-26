// Classes Schedule & Booking View
import { Api } from '../api.js';
import { Icons } from '../components/icons.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export const ClassesView = {
  currentDay: 'all',
  classesList: [],
  trainersList: [],

  async render(container) {
    container.innerHTML = `
      <div style="padding: 24px 0 0;">
        <div class="page-header">
          <div>
            <h1 class="page-title">Classes & Group Sessions</h1>
            <p class="page-subtitle">Schedule group workouts, track room capacities, and manage reservations.</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" id="btn-create-class-trigger">
              ${Icons.plus} Schedule Class
            </button>
          </div>
        </div>

        <!-- Filter Days -->
        <div class="table-container">
          <div class="table-toolbar">
            <div class="filter-tabs" id="class-day-tabs">
              <button class="filter-tab ${this.currentDay === 'all' ? 'active' : ''}" data-day="all">All Days</button>
              <button class="filter-tab ${this.currentDay === 'Monday' ? 'active' : ''}" data-day="Monday">Mon</button>
              <button class="filter-tab ${this.currentDay === 'Tuesday' ? 'active' : ''}" data-day="Tuesday">Tue</button>
              <button class="filter-tab ${this.currentDay === 'Wednesday' ? 'active' : ''}" data-day="Wednesday">Wed</button>
              <button class="filter-tab ${this.currentDay === 'Thursday' ? 'active' : ''}" data-day="Thursday">Thu</button>
              <button class="filter-tab ${this.currentDay === 'Friday' ? 'active' : ''}" data-day="Friday">Fri</button>
              <button class="filter-tab ${this.currentDay === 'Saturday' ? 'active' : ''}" data-day="Saturday">Sat</button>
            </div>
          </div>

          <div style="overflow-x: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Class Session</th>
                  <th>Coach</th>
                  <th>Day</th>
                  <th>Time Slot</th>
                  <th>Capacity / Booking</th>
                  <th>Status</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody id="classes-table-body">
                <tr>
                  <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">
                    Loading workout schedule...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    await this.loadTrainers();
    await this.loadClasses(container);
    this.attachEvents(container);
  },

  async loadTrainers() {
    try {
      const res = await Api.get('/trainers');
      if (res.success) this.trainersList = res.data;
    } catch (err) {
      console.warn(err);
    }
  },

  async loadClasses(container) {
    try {
      const res = await Api.get('/classes', { dayOfWeek: this.currentDay });
      if (!res.success) throw new Error(res.message);

      this.classesList = res.data;
      const tbody = container.querySelector('#classes-table-body');
      if (!tbody) return;

      if (!this.classesList.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7">
              <div class="empty-state">
                <div class="empty-state-icon">${Icons.classes}</div>
                <div class="empty-state-title">No classes scheduled</div>
                <div class="empty-state-subtitle">No group workout classes scheduled for the selected filter.</div>
                <button class="btn btn-secondary btn-sm" id="btn-empty-add-class">${Icons.plus} Schedule Class</button>
              </div>
            </td>
          </tr>
        `;
        tbody.querySelector('#btn-empty-add-class')?.addEventListener('click', () => {
          this.openCreateClassModal(container);
        });
        return;
      }

      tbody.innerHTML = this.classesList
        .map((c) => {
          const isFull = c.bookedSeats >= c.capacity;
          const pct = Math.round((c.bookedSeats / c.capacity) * 100);

          return `
          <tr>
            <td>
              <strong style="color: var(--text); font-size: 13px;">${c.name}</strong>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="member-avatar" style="width: 24px; height: 24px; font-size: 10px;">${c.trainerName.charAt(0)}</div>
                <span style="color: var(--text); font-weight: 500;">${c.trainerName}</span>
              </div>
            </td>
            <td><span style="font-weight: 600; color: var(--text-secondary);">${c.dayOfWeek}</span></td>
            <td class="number-tabular" style="color: var(--text-secondary);">${c.time}</td>
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 70px; height: 5px; background: var(--surface-hover); border-radius: 3px; overflow: hidden;">
                  <div style="width: ${pct}%; height: 100%; background: ${isFull ? 'var(--danger)' : 'var(--accent)'};"></div>
                </div>
                <span class="number-tabular" style="font-size: 12px; font-weight: 600; color: ${isFull ? 'var(--danger)' : 'var(--text)'};">
                  ${c.bookedSeats} / ${c.capacity}
                </span>
              </div>
            </td>
            <td>
              <span class="badge ${isFull ? 'badge-danger' : 'badge-success'}">
                ${isFull ? 'Full' : 'Open'}
              </span>
            </td>
            <td style="text-align: right;">
              <div style="display: inline-flex; gap: 6px;">
                <button class="btn btn-secondary btn-sm btn-book-seat" data-id="${c._id}" ${isFull ? 'disabled' : ''}>
                  Book Seat
                </button>
                <button class="btn btn-ghost btn-sm btn-cancel-seat" data-id="${c._id}" ${c.bookedSeats === 0 ? 'disabled' : ''} title="Release 1 Seat">
                  -1
                </button>
                <button class="btn btn-ghost btn-sm btn-delete-class" data-id="${c._id}">
                  ${Icons.trash}
                </button>
              </div>
            </td>
          </tr>
        `;
        })
        .join('');

      tbody.querySelectorAll('.btn-book-seat').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            const res = await Api.post(`/classes/${btn.dataset.id}/book`);
            if (res.success) {
              Toast.success(res.message);
              this.loadClasses(container);
            }
          } catch (err) {
            Toast.error(err.message || 'Booking failed.');
          }
        });
      });

      tbody.querySelectorAll('.btn-cancel-seat').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            const res = await Api.post(`/classes/${btn.dataset.id}/cancel`);
            if (res.success) {
              Toast.info(res.message);
              this.loadClasses(container);
            }
          } catch (err) {
            Toast.error(err.message);
          }
        });
      });

      tbody.querySelectorAll('.btn-delete-class').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            const res = await Api.delete(`/classes/${btn.dataset.id}`);
            if (res.success) {
              Toast.success('Class removed.');
              this.loadClasses(container);
            }
          } catch (err) {
            Toast.error(err.message);
          }
        });
      });
    } catch (err) {
      Toast.error('Failed to load classes: ' + err.message);
    }
  },

  attachEvents(container) {
    container.querySelector('#btn-create-class-trigger')?.addEventListener('click', () => {
      this.openCreateClassModal(container);
    });

    container.querySelectorAll('#class-day-tabs .filter-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('#class-day-tabs .filter-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentDay = tab.dataset.day;
        this.loadClasses(container);
      });
    });
  },

  openCreateClassModal(container) {
    const trainerOptions = this.trainersList
      .map((t) => `<option value="${t._id}">${t.name} (${t.role})</option>`)
      .join('');

    const bodyHTML = `
      <form id="class-create-form">
        <div class="form-group">
          <label class="form-label">Class Name *</label>
          <input type="text" id="cls-name" class="form-input" placeholder="e.g. Iron HIIT Conditioning" required />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Assign Coach / Trainer</label>
            <select id="cls-trainer" class="form-select">
              ${trainerOptions || '<option value="">No coaches registered</option>'}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Day of Week *</label>
            <select id="cls-day" class="form-select">
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Time Slot *</label>
            <input type="text" id="cls-time" class="form-input" placeholder="07:00 AM - 08:00 AM" value="07:00 AM - 08:00 AM" required />
          </div>
          <div class="form-group">
            <label class="form-label">Total Capacity *</label>
            <input type="number" id="cls-cap" class="form-input" value="20" min="1" max="100" required />
          </div>
        </div>
      </form>
    `;

    const footerHTML = `
      <button class="btn btn-secondary" onclick="document.getElementById('global-modal-close').click()">Cancel</button>
      <button class="btn btn-primary" id="btn-submit-class">Schedule Class</button>
    `;

    Modal.open({
      title: 'Schedule Group Workout Class',
      bodyHTML,
      footerHTML,
      onOpen: (body, footer) => {
        footer.querySelector('#btn-submit-class').addEventListener('click', async () => {
          const name = body.querySelector('#cls-name').value.trim();
          const trainerId = body.querySelector('#cls-trainer').value;
          const dayOfWeek = body.querySelector('#cls-day').value;
          const time = body.querySelector('#cls-time').value.trim();
          const capacity = body.querySelector('#cls-cap').value;

          if (!name || !time) {
            Toast.error('Please fill in required fields.');
            return;
          }

          const btn = footer.querySelector('#btn-submit-class');
          btn.disabled = true;

          try {
            const res = await Api.post('/classes', {
              name,
              trainerId,
              dayOfWeek,
              time,
              capacity,
            });

            if (res.success) {
              Toast.success(res.message);
              Modal.close();
              this.loadClasses(container);
            }
          } catch (err) {
            Toast.error(err.message || 'Failed to schedule class.');
            btn.disabled = false;
          }
        });
      },
    });
  },
};
