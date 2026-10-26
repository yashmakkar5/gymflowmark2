// Application Shell & Single-Page Router Orchestrator
import { State } from './state.js';
import { Icons } from './components/icons.js';
import { Modal } from './components/modal.js';
import { Toast } from './components/toast.js';
import { Api } from './api.js';

// Views
import { AuthView } from './views/auth.js';
import { DashboardView } from './views/dashboard.js';
import { MembersView } from './views/members.js';
import { MemberProfileView } from './views/memberProfile.js';
import { AttendanceView } from './views/attendance.js';
import { PlansView } from './views/plans.js';
import { PaymentsView } from './views/payments.js';
import { TrainersView } from './views/trainers.js';
import { ClassesView } from './views/classes.js';
import { ReportsView } from './views/reports.js';
import { SettingsView } from './views/settings.js';

class GymFlowApp {
  constructor() {
    this.appRoot = document.getElementById('app');
    this.currentView = null;
  }

  async init() {
    window.addEventListener('hashchange', () => this.handleRoute());

    // Listen for state changes
    State.subscribe(() => {
      if (!State.user && !window.location.hash.includes('auth')) {
        window.location.hash = '#/auth';
      }
    });

    // Check existing auth token
    const isAuthenticated = await State.loadInitialUser();

    if (!isAuthenticated) {
      window.location.hash = '#/auth';
      this.handleRoute();
    } else {
      if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#/auth') {
        window.location.hash = '#/dashboard';
      } else {
        this.handleRoute();
      }
    }

    this.setupGlobalShortcuts();
  }

  setupGlobalShortcuts() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openCommandPalette();
      }
    });
  }

  openCommandPalette() {
    const bodyHTML = `
      <div style="margin-bottom: 12px; position: relative;">
        <input type="text" id="cmd-input" class="form-input" placeholder="Type a command or search members..." style="height: 42px; font-size: 14px;" autocomplete="off" />
      </div>
      <div id="cmd-results" style="max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">
        <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600; padding: 4px 6px;">Navigation</div>
        <div class="cmd-item" data-hash="#/dashboard" style="padding: 8px 10px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 10px; color: var(--text);">
          ${Icons.dashboard} <span>Go to Dashboard</span>
        </div>
        <div class="cmd-item" data-hash="#/members" style="padding: 8px 10px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 10px; color: var(--text);">
          ${Icons.members} <span>Go to Members Directory</span>
        </div>
        <div class="cmd-item" data-hash="#/attendance" style="padding: 8px 10px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 10px; color: var(--text);">
          ${Icons.attendance} <span>Go to Fast Attendance Desk</span>
        </div>
        <div class="cmd-item" data-hash="#/plans" style="padding: 8px 10px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 10px; color: var(--text);">
          ${Icons.plans} <span>Go to Membership Plans</span>
        </div>
        <div class="cmd-item" data-hash="#/payments" style="padding: 8px 10px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 10px; color: var(--text);">
          ${Icons.payments} <span>Go to Payments Ledger</span>
        </div>
        <div class="cmd-item" data-hash="#/reports" style="padding: 8px 10px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 10px; color: var(--text);">
          ${Icons.reports} <span>Go to Executive Reports</span>
        </div>
        <div class="cmd-item" data-hash="#/settings" style="padding: 8px 10px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 10px; color: var(--text);">
          ${Icons.settings} <span>Go to Settings</span>
        </div>
      </div>
    `;

    Modal.open({
      title: 'Command Palette',
      bodyHTML,
      footerHTML: '',
      onOpen: (body) => {
        const input = body.querySelector('#cmd-input');
        input.focus();

        body.querySelectorAll('.cmd-item').forEach((item) => {
          item.addEventListener('mouseenter', () => (item.style.background = 'var(--surface-hover)'));
          item.addEventListener('mouseleave', () => (item.style.background = 'transparent'));
          item.addEventListener('click', () => {
            window.location.hash = item.dataset.hash;
            Modal.close();
          });
        });

        // Fast member search filter in palette
        input.addEventListener('input', async (e) => {
          const val = e.target.value.toLowerCase().trim();
          if (val.length >= 2) {
            try {
              const res = await Api.get('/members', { search: val });
              if (res.success && res.data.length) {
                const resultsEl = body.querySelector('#cmd-results');
                resultsEl.innerHTML = `
                  <div style="font-size: 11px; text-transform: uppercase; color: var(--accent); font-weight: 700; padding: 4px 6px;">Matching Members</div>
                  ${res.data
                    .slice(0, 5)
                    .map(
                      (m) => `
                    <div class="cmd-item" data-hash="#/members/${m._id}" style="padding: 8px 10px; border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; color: var(--text);">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        ${Icons.user}
                        <strong>${m.name}</strong>
                        <span style="color: var(--text-muted); font-size: 11px;">(${m.phone})</span>
                      </div>
                      <span class="badge ${m.status === 'active' ? 'badge-success' : 'badge-warning'}">${m.status}</span>
                    </div>
                  `
                    )
                    .join('')}
                `;

                resultsEl.querySelectorAll('.cmd-item').forEach((item) => {
                  item.addEventListener('mouseenter', () => (item.style.background = 'var(--surface-hover)'));
                  item.addEventListener('mouseleave', () => (item.style.background = 'transparent'));
                  item.addEventListener('click', () => {
                    window.location.hash = item.dataset.hash;
                    Modal.close();
                  });
                });
              }
            } catch (err) {
              console.warn(err);
            }
          }
        });
      },
    });
  }

  ensureShell() {
    if (document.getElementById('shell-rendered')) return;

    const user = State.user || { name: 'Vikram Oberoi', role: 'owner' };
    const gym = State.gym || { name: 'Iron House Fitness', currencySymbol: '₹' };

    this.appRoot.innerHTML = `
      <div class="app-shell" id="shell-rendered">
        <!-- Sidebar -->
        <aside class="sidebar" id="app-sidebar">
          <div class="sidebar-header">
            <a href="#/dashboard" class="brand-link">
              <div class="brand-glyph">G</div>
              <span>GymFlow</span>
            </a>
            <span class="brand-badge">SaaS</span>
          </div>

          <nav class="sidebar-nav">
            <div class="nav-section-label">Core Operations</div>
            <a href="#/dashboard" class="nav-item" data-route="dashboard">
              ${Icons.dashboard}
              <span>Dashboard</span>
            </a>
            <a href="#/members" class="nav-item" data-route="members">
              ${Icons.members}
              <span>Members</span>
            </a>
            <a href="#/attendance" class="nav-item" data-route="attendance">
              ${Icons.attendance}
              <span>Attendance</span>
            </a>
            <a href="#/plans" class="nav-item" data-route="plans">
              ${Icons.plans}
              <span>Plans</span>
            </a>
            <a href="#/payments" class="nav-item" data-route="payments">
              ${Icons.payments}
              <span>Payments</span>
            </a>

            <div class="nav-section-label" style="margin-top: 10px;">Management</div>
            <a href="#/trainers" class="nav-item" data-route="trainers">
              ${Icons.trainers}
              <span>Trainers</span>
            </a>
            <a href="#/classes" class="nav-item" data-route="classes">
              ${Icons.classes}
              <span>Classes</span>
            </a>
            <a href="#/reports" class="nav-item" data-route="reports">
              ${Icons.reports}
              <span>Reports</span>
            </a>
            <a href="#/settings" class="nav-item" data-route="settings">
              ${Icons.settings}
              <span>Settings</span>
            </a>
          </nav>

          <div class="sidebar-footer">
            <div class="gym-info-badge">
              <span class="gym-name" id="sidebar-gym-name">${gym.name}</span>
              <span class="pulse-dot" title="Tenant Active"></span>
            </div>

            <div class="user-row">
              <div class="user-avatar" id="sidebar-user-avatar">${user.name.charAt(0)}</div>
              <div class="user-details">
                <div class="user-name" id="sidebar-user-name">${user.name}</div>
                <div class="user-role" id="sidebar-user-role">${user.role}</div>
              </div>
              <button class="btn-logout" id="btn-sidebar-logout" title="Sign out of GymFlow">
                ${Icons.logout}
              </button>
            </div>
          </div>
        </aside>

        <!-- Main Wrapper -->
        <div class="main-wrapper">
          <!-- Topbar -->
          <header class="topbar">
            <div class="topbar-left">
              <button class="mobile-menu-btn" id="btn-mobile-sidebar">
                ${Icons.menu}
              </button>
              <div class="breadcrumb-nav">
                <span>GymFlow</span>
                <span class="separator">/</span>
                <span class="current" id="topbar-breadcrumb">Dashboard</span>
              </div>
            </div>

            <div class="topbar-right">
              <div class="global-search-trigger" id="btn-open-cmd-palette">
                ${Icons.search}
                <span>Quick search...</span>
                <span class="kbd-shortcut">Ctrl K</span>
              </div>

              <div class="live-presence-indicator" title="Live status">
                <span class="pulse-dot"></span>
                <span id="topbar-clock">Live</span>
              </div>
            </div>
          </header>

          <!-- Main Viewport -->
          <main class="content-viewport" id="main-content-viewport"></main>
        </div>
      </div>
    `;

    // Attach Topbar and Sidebar triggers
    document.getElementById('btn-open-cmd-palette')?.addEventListener('click', () => this.openCommandPalette());

    document.getElementById('btn-sidebar-logout')?.addEventListener('click', () => {
      State.clearUser();
      Toast.info('Signed out successfully.');
      window.location.hash = '#/auth';
    });

    const mobileBtn = document.getElementById('btn-mobile-sidebar');
    const sidebar = document.getElementById('app-sidebar');
    if (mobileBtn && sidebar) {
      mobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
      // Close on content click on mobile
      document.getElementById('main-content-viewport')?.addEventListener('click', () => {
        sidebar.classList.remove('open');
      });
    }

    // Live clock in topbar
    setInterval(() => {
      const clockEl = document.getElementById('topbar-clock');
      if (clockEl) {
        clockEl.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      }
    }, 1000);
  }

  async handleRoute() {
    const hash = window.location.hash || '#/dashboard';
    const parts = hash.replace('#/', '').split('/');
    const route = parts[0] || 'dashboard';
    const param = parts[1];

    if (route === 'auth') {
      const shellEl = document.getElementById('shell-rendered');
      if (shellEl) shellEl.remove();
      AuthView.render(this.appRoot);
      return;
    }

    // Require Auth
    if (!State.user) {
      const ok = await State.loadInitialUser();
      if (!ok) {
        window.location.hash = '#/auth';
        return;
      }
    }

    this.ensureShell();

    // Update active nav link
    document.querySelectorAll('.sidebar-nav .nav-item').forEach((link) => {
      if (link.dataset.route === route) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update breadcrumb
    const breadcrumb = document.getElementById('topbar-breadcrumb');
    if (breadcrumb) {
      breadcrumb.textContent = route.charAt(0).toUpperCase() + route.slice(1);
    }

    // Close mobile sidebar if open
    document.getElementById('app-sidebar')?.classList.remove('open');

    const viewport = document.getElementById('main-content-viewport');
    if (!viewport) return;

    switch (route) {
      case 'dashboard':
        DashboardView.render(viewport);
        break;
      case 'members':
        if (param) {
          MemberProfileView.render(viewport, param);
        } else {
          MembersView.render(viewport);
        }
        break;
      case 'attendance':
        AttendanceView.render(viewport);
        break;
      case 'plans':
        PlansView.render(viewport);
        break;
      case 'payments':
        PaymentsView.render(viewport);
        break;
      case 'trainers':
        TrainersView.render(viewport);
        break;
      case 'classes':
        ClassesView.render(viewport);
        break;
      case 'reports':
        ReportsView.render(viewport);
        break;
      case 'settings':
        SettingsView.render(viewport);
        break;
      default:
        DashboardView.render(viewport);
        break;
    }
  }
}

// Start application
const app = new GymFlowApp();
window.addEventListener('DOMContentLoaded', () => {
  app.init();
});
