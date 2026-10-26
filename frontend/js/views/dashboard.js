// Dashboard View
import { Api } from '../api.js';
import { State } from '../state.js';
import { Icons } from '../components/icons.js';
import { Charts } from '../components/charts.js';
import { Toast } from '../components/toast.js';

export const DashboardView = {
  async render(container) {
    container.innerHTML = `
      <div style="padding: 24px 0 0;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 24px;">
          <div>
            <h1 style="font-size: 22px; font-weight: 700; color: var(--text); letter-spacing: -0.02em; margin-bottom: 4px;" id="dash-greeting">
              Loading dashboard...
            </h1>
            <p style="font-size: 13px; color: var(--text-secondary);" id="dash-subgreeting">
              Fetching today's performance metrics...
            </p>
          </div>
          <div style="display:flex; gap: 10px;">
            <button class="btn btn-secondary btn-sm" id="btn-refresh-dash">
              Refresh
            </button>
            <button class="btn btn-primary btn-sm" id="btn-dash-fast-checkin">
              ${Icons.attendance} Fast Check-In
            </button>
          </div>
        </div>

        <!-- KPI Row -->
        <div class="kpi-grid" id="dash-kpi-grid">
          <div class="kpi-card" style="min-height: 100px; justify-content: center;">
            <div style="color: var(--text-muted); font-size: 12px;">Loading KPIs...</div>
          </div>
        </div>

        <!-- Revenue & Attendance Row -->
        <div class="dashboard-grid">
          <!-- Revenue Chart Card -->
          <div class="chart-card">
            <div class="chart-header">
              <div>
                <div class="chart-title">Revenue Trajectory</div>
                <div class="chart-big-number" id="dash-revenue-total">₹0</div>
              </div>
              <div style="display:flex; gap: 6px;">
                <span class="badge badge-success" id="dash-revenue-growth">+14.2%</span>
              </div>
            </div>
            <div id="revenue-chart-container" style="min-height: 180px; width: 100%;"></div>
          </div>

          <!-- Attendance Frequency Card -->
          <div class="chart-card">
            <div class="chart-header">
              <div>
                <div class="chart-title">Weekly Attendance</div>
                <div class="chart-big-number" id="dash-attendance-today">0</div>
              </div>
              <span class="badge badge-neutral" id="dash-inside-now">0 inside</span>
            </div>
            <div id="attendance-chart-container" style="min-height: 180px; width: 100%;"></div>
          </div>
        </div>

        <!-- Two Column Section: Recent Activity & Expiring Memberships -->
        <div class="dashboard-grid" style="margin-bottom: 24px;">
          <!-- Left: Recent Activity -->
          <div class="section-card">
            <div class="section-card-header">
              <div class="section-card-title">Recent Activity</div>
              <button class="btn btn-ghost btn-sm" id="btn-view-all-activity">Live Feed</button>
            </div>
            <div class="activity-list" id="dash-activity-list">
              <div style="color: var(--text-muted); font-size: 12px; padding: 12px 0;">Loading activity...</div>
            </div>
          </div>

          <!-- Right: Memberships Expiring -->
          <div class="section-card">
            <div class="section-card-header">
              <div class="section-card-title">Memberships Expiring</div>
              <span class="badge badge-warning" id="dash-expiring-badge">Action Required</span>
            </div>
            <div class="expiring-list" id="dash-expiring-list">
              <div style="color: var(--text-muted); font-size: 12px; padding: 12px 0;">Checking memberships...</div>
            </div>
          </div>
        </div>

        <!-- Quick Actions Bar -->
        <div class="quick-actions-bar">
          <div class="quick-actions-title">Quick Operational Actions</div>
          <div class="quick-actions-btns">
            <button class="btn btn-secondary" id="dash-qa-add-member">
              ${Icons.plus} Add Member
            </button>
            <button class="btn btn-secondary" id="dash-qa-payment">
              ${Icons.receipt} Record Payment
            </button>
            <button class="btn btn-secondary" id="dash-qa-attendance">
              ${Icons.attendance} Mark Attendance
            </button>
            <button class="btn btn-secondary" id="dash-qa-plan">
              ${Icons.plans} Create Plan
            </button>
          </div>
        </div>
      </div>
    `;

    await this.loadData(container);
  },

  async loadData(container) {
    try {
      const res = await Api.get('/dashboard');
      if (!res.success) throw new Error(res.message);

      const d = res.data;

      // Time-aware greeting
      const hour = new Date().getHours();
      let greetingTime = 'Good morning';
      if (hour >= 12 && hour < 17) greetingTime = 'Good afternoon';
      else if (hour >= 17) greetingTime = 'Good evening';

      const greetingEl = container.querySelector('#dash-greeting');
      const subgreetingEl = container.querySelector('#dash-subgreeting');

      if (greetingEl) {
        greetingEl.textContent = `${greetingTime}, ${d.userName}`;
      }
      if (subgreetingEl) {
        subgreetingEl.textContent = `Here's what's happening at ${d.gymName} today.`;
      }

      // Populate KPI Row
      const kpis = d.kpis;
      const kpiContainer = container.querySelector('#dash-kpi-grid');
      if (kpiContainer) {
        kpiContainer.innerHTML = `
          <!-- Active Members -->
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Active Members</span>
              <span class="kpi-icon">${Icons.members}</span>
            </div>
            <div class="kpi-value number-tabular">${kpis.activeMembers.value}</div>
            <div class="kpi-subtext">
              <span class="indicator-positive">${kpis.activeMembers.changeLabel}</span>
            </div>
          </div>

          <!-- Today's Attendance -->
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Today's Attendance</span>
              <span class="kpi-icon">${Icons.attendance}</span>
            </div>
            <div class="kpi-value number-tabular">${kpis.todayAttendance.value}</div>
            <div class="kpi-subtext">
              <span style="color: var(--text-secondary);">${kpis.todayAttendance.changeLabel}</span>
            </div>
          </div>

          <!-- Monthly Revenue -->
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Monthly Revenue</span>
              <span class="kpi-icon">${Icons.payments}</span>
            </div>
            <div class="kpi-value number-tabular">${kpis.monthlyRevenue.formatted}</div>
            <div class="kpi-subtext">
              <span class="${Number(kpis.monthlyRevenue.changeLabel.replace('%', '')) >= 0 ? 'indicator-positive' : 'indicator-negative'}">
                ${kpis.monthlyRevenue.changeLabel}
              </span>
            </div>
          </div>

          <!-- Expiring Memberships -->
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">Expiring Memberships</span>
              <span class="kpi-icon">${Icons.plans}</span>
            </div>
            <div class="kpi-value number-tabular" style="${kpis.expiringMemberships.value > 0 ? 'color: var(--warning);' : ''}">
              ${kpis.expiringMemberships.value}
            </div>
            <div class="kpi-subtext">
              <span class="indicator-warning">${kpis.expiringMemberships.changeLabel}</span>
            </div>
          </div>
        `;
      }

      // Populate Revenue Chart
      const revTotal = container.querySelector('#dash-revenue-total');
      const revGrowth = container.querySelector('#dash-revenue-growth');
      if (revTotal) revTotal.textContent = kpis.monthlyRevenue.formatted;
      if (revGrowth) revGrowth.textContent = kpis.monthlyRevenue.changeLabel;

      const chartContainer = container.querySelector('#revenue-chart-container');
      if (chartContainer && d.chartData) {
        Charts.renderRevenueChart(chartContainer, d.chartData);
      }

      // Populate Attendance Bars (using reports weekly data or simulated last 7 days)
      const attTodayEl = container.querySelector('#dash-attendance-today');
      const insideNowEl = container.querySelector('#dash-inside-now');
      if (attTodayEl) attTodayEl.textContent = `${kpis.todayAttendance.value} Check-ins`;
      if (insideNowEl) insideNowEl.textContent = `${kpis.todayAttendance.currentlyInGym} in gym`;

      const attChartContainer = container.querySelector('#attendance-chart-container');
      if (attChartContainer) {
        const sampleDays = [
          { day: 'Mon', count: 48 },
          { day: 'Tue', count: 52 },
          { day: 'Wed', count: 45 },
          { day: 'Thu', count: 56 },
          { day: 'Fri', count: 62 },
          { day: 'Sat', count: 70 },
          { day: 'Today', count: kpis.todayAttendance.value },
        ];
        Charts.renderAttendanceBars(attChartContainer, sampleDays);
      }

      // Populate Recent Activity
      const activityContainer = container.querySelector('#dash-activity-list');
      if (activityContainer) {
        if (!d.recentActivity.length) {
          activityContainer.innerHTML = `<div style="color:var(--text-muted); padding: 12px 0;">No recent activity recorded today.</div>`;
        } else {
          activityContainer.innerHTML = d.recentActivity
            .map(
              (act) => `
              <div class="activity-item">
                <div class="activity-left">
                  <div class="activity-avatar">${act.title.charAt(0)}</div>
                  <div>
                    <div class="activity-name">${act.title}</div>
                    <div class="activity-subtitle">${act.subtitle}</div>
                  </div>
                </div>
                <div class="activity-time">${act.time}</div>
              </div>
            `
            )
            .join('');
        }
      }

      // Populate Expiring Memberships
      const expiringContainer = container.querySelector('#dash-expiring-list');
      if (expiringContainer) {
        if (!d.expiringMembers.length) {
          expiringContainer.innerHTML = `
            <div style="color:var(--text-muted); font-size: 13px; padding: 16px 0; text-align: center;">
              No memberships expiring in the next 7 days.
            </div>
          `;
        } else {
          expiringContainer.innerHTML = d.expiringMembers
            .map(
              (m) => `
              <div class="expiring-item">
                <div class="expiring-info">
                  <span class="expiring-name">${m.name}</span>
                  <span class="expiring-plan">${m.planName} • ${m.label}</span>
                </div>
                <button class="btn btn-secondary btn-sm btn-renew-member" data-id="${m.id}" data-name="${m.name}">
                  Renew
                </button>
              </div>
            `
            )
            .join('');

          // Attach quick renew clicks
          expiringContainer.querySelectorAll('.btn-renew-member').forEach((btn) => {
            btn.addEventListener('click', () => {
              window.location.hash = `#/members/${btn.dataset.id}`;
            });
          });
        }
      }

      this.attachEvents(container);
    } catch (err) {
      Toast.error('Failed to load dashboard data: ' + err.message);
    }
  },

  attachEvents(container) {
    const refreshBtn = container.querySelector('#btn-refresh-dash');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.render(container);
        Toast.info('Dashboard refreshed.');
      });
    }

    const fastCheckinBtn = container.querySelector('#btn-dash-fast-checkin');
    if (fastCheckinBtn) {
      fastCheckinBtn.addEventListener('click', () => {
        window.location.hash = '#/attendance';
      });
    }

    // Quick Actions
    container.querySelector('#dash-qa-add-member')?.addEventListener('click', () => {
      window.location.hash = '#/members';
      setTimeout(() => {
        document.getElementById('btn-add-member-trigger')?.click();
      }, 100);
    });

    container.querySelector('#dash-qa-payment')?.addEventListener('click', () => {
      window.location.hash = '#/payments';
      setTimeout(() => {
        document.getElementById('btn-record-payment-trigger')?.click();
      }, 100);
    });

    container.querySelector('#dash-qa-attendance')?.addEventListener('click', () => {
      window.location.hash = '#/attendance';
    });

    container.querySelector('#dash-qa-plan')?.addEventListener('click', () => {
      window.location.hash = '#/plans';
      setTimeout(() => {
        document.getElementById('btn-create-plan-trigger')?.click();
      }, 100);
    });
  },
};
