// Business Reports & Intelligence View
import { Api } from '../api.js';
import { Icons } from '../components/icons.js';
import { Charts } from '../components/charts.js';
import { Toast } from '../components/toast.js';

export const ReportsView = {
  reportsData: null,

  async render(container) {
    container.innerHTML = `
      <div style="padding: 24px 0 0;">
        <div class="page-header">
          <div>
            <h1 class="page-title">Executive Reports</h1>
            <p class="page-subtitle">Actionable unit economics, member retention, and attendance dynamics.</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" id="btn-export-csv">
              ${Icons.download} Export CSV
            </button>
          </div>
        </div>

        <!-- Metric Summary Row -->
        <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 24px;" id="reports-kpi-row">
          <div class="kpi-card">
            <span class="kpi-title">Total Enrolled</span>
            <div class="kpi-value number-tabular" id="rep-total-members">0</div>
            <div class="kpi-subtext">Lifetime roster</div>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Active Retention</span>
            <div class="kpi-value number-tabular" id="rep-retention-rate" style="color: var(--accent);">0%</div>
            <div class="kpi-subtext"><span class="indicator-positive">Active vs Lapsed ratio</span></div>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Expiring / At-Risk</span>
            <div class="kpi-value number-tabular" id="rep-expiring-soon" style="color: var(--warning);">0</div>
            <div class="kpi-subtext">Requires follow-up</div>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Churned / Expired</span>
            <div class="kpi-value number-tabular" id="rep-expired" style="color: var(--danger);">0</div>
            <div class="kpi-subtext">Past due date</div>
          </div>
        </div>

        <!-- Visual Intelligence Grid -->
        <div class="dashboard-grid">
          <!-- Monthly Revenue -->
          <div class="chart-card">
            <div class="chart-header">
              <div>
                <div class="chart-title">Revenue by Month</div>
                <div style="font-size: 12px; color: var(--text-muted);">Last 6 billing cycles</div>
              </div>
            </div>
            <div id="rep-revenue-chart" style="min-height: 180px; width: 100%;"></div>
          </div>

          <!-- Weekly Attendance Frequency -->
          <div class="chart-card">
            <div class="chart-header">
              <div>
                <div class="chart-title">Daily Attendance Trends</div>
                <div style="font-size: 12px; color: var(--text-muted);">Past 7 days turnstile counts</div>
              </div>
            </div>
            <div id="rep-attendance-chart" style="min-height: 180px; width: 100%;"></div>
          </div>
        </div>

        <!-- Breakdown Table: Revenue by Payment Method -->
        <div class="table-container" style="margin-top: 24px;">
          <div class="table-toolbar">
            <div style="font-size: 13px; font-weight: 600; color: var(--text);">Revenue Breakdown by Payment Channel</div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Payment Channel</th>
                <th>Transactions</th>
                <th>Total Collected</th>
                <th style="text-align: right;">Share of Total</th>
              </tr>
            </thead>
            <tbody id="rep-channel-tbody">
              <tr>
                <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">Loading breakdown...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    await this.loadReports(container);
    this.attachEvents(container);
  },

  async loadReports(container) {
    try {
      const res = await Api.get('/reports');
      if (!res.success) throw new Error(res.message);

      this.reportsData = res.data;
      const d = res.data;

      // Update KPIs
      const m = d.members;
      container.querySelector('#rep-total-members').textContent = m.total;
      container.querySelector('#rep-retention-rate').textContent = `${m.retentionRate}%`;
      container.querySelector('#rep-expiring-soon').textContent = m.expiringSoon;
      container.querySelector('#rep-expired').textContent = m.expired;

      // Charts
      const revContainer = container.querySelector('#rep-revenue-chart');
      if (revContainer && d.monthlyRevenue) {
        Charts.renderRevenueChart(revContainer, d.monthlyRevenue);
      }

      const attContainer = container.querySelector('#rep-attendance-chart');
      if (attContainer && d.attendanceTrend) {
        Charts.renderAttendanceBars(attContainer, d.attendanceTrend);
      }

      // Breakdown Table
      const tbody = container.querySelector('#rep-channel-tbody');
      if (tbody) {
        const totalRev = d.revenueByMethod.reduce((acc, x) => acc + x.amount, 0);

        if (!d.revenueByMethod.length) {
          tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 24px;">No revenue data recorded yet.</td></tr>`;
        } else {
          tbody.innerHTML = d.revenueByMethod
            .map((item) => {
              const sharePct = totalRev > 0 ? Math.round((item.amount / totalRev) * 100) : 0;
              return `
              <tr>
                <td><strong>${item.method}</strong></td>
                <td class="number-tabular">${item.count}</td>
                <td class="number-tabular" style="font-weight: 700;">₹${item.amount.toLocaleString('en-IN')}</td>
                <td style="text-align: right;">
                  <span class="badge badge-neutral">${sharePct}%</span>
                </td>
              </tr>
            `;
            })
            .join('');
        }
      }
    } catch (err) {
      Toast.error('Failed to load reports: ' + err.message);
    }
  },

  attachEvents(container) {
    container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
      this.exportCSV();
    });
  },

  exportCSV() {
    if (!this.reportsData) {
      Toast.error('No report data available to export.');
      return;
    }

    const d = this.reportsData;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += '--- GYMFLOW EXECUTIVE SUMMARY REPORT ---\r\n\r\n';

    csvContent += 'MEMBER METRICS\r\n';
    csvContent += `Total Members,${d.members.total}\r\n`;
    csvContent += `Active Members,${d.members.active}\r\n`;
    csvContent += `Expiring Soon,${d.members.expiringSoon}\r\n`;
    csvContent += `Expired,${d.members.expired}\r\n`;
    csvContent += `Retention Rate,${d.members.retentionRate}%\r\n\r\n`;

    csvContent += 'MONTHLY REVENUE\r\n';
    csvContent += 'Month,Revenue (INR)\r\n';
    d.monthlyRevenue.forEach((r) => {
      csvContent += `${r.month},${r.revenue}\r\n`;
    });
    csvContent += '\r\n';

    csvContent += 'PAYMENT CHANNELS\r\n';
    csvContent += 'Method,Transactions,Amount (INR)\r\n';
    d.revenueByMethod.forEach((m) => {
      csvContent += `${m.method},${m.count},${m.amount}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gymflow_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Toast.success('CSV Report downloaded successfully.');
  },
};
