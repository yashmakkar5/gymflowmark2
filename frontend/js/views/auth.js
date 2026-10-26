// Auth View (Sign In & Register Gym)
import { Api } from '../api.js';
import { State } from '../state.js';
import { Toast } from '../components/toast.js';

export const AuthView = {
  mode: 'login', // 'login' or 'register'

  render(container) {
    container.innerHTML = `
      <div style="min-height: 100vh; width: 100vw; display: flex; align-items: center; justify-content: center; background-color: var(--bg); padding: 24px;">
        <div style="width: 100%; max-width: 380px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 32px 28px;">
          <!-- Logo & Header -->
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
            <div class="brand-glyph">G</div>
            <div style="font-weight: 800; font-size: 16px; letter-spacing: -0.02em;">GYMFLOW</div>
          </div>

          <div style="margin-bottom: 24px;">
            <h1 style="font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 4px;" id="auth-heading">
              ${this.mode === 'login' ? 'Welcome back' : 'Create your gym account'}
            </h1>
            <p style="font-size: 13px; color: var(--text-secondary);" id="auth-subheading">
              ${this.mode === 'login' ? 'Sign in to manage your members and operations.' : 'Start your 14-day free trial. No credit card required.'}
            </p>
          </div>

          <!-- Quick Demo Switcher Hint -->
          ${
            this.mode === 'login'
              ? `
            <div style="background: var(--surface-elevated); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 10px 12px; margin-bottom: 20px; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="color: var(--text-muted);">Demo:</span> <span style="color: var(--accent); font-weight: 600;">vikram@ironhouse.in</span>
              </div>
              <button id="btn-fill-demo" class="btn btn-ghost btn-sm" style="font-size: 11px; padding: 2px 6px;">
                Use Demo
              </button>
            </div>
          `
              : ''
          }

          <!-- Form -->
          <form id="auth-form">
            ${
              this.mode === 'register'
                ? `
              <div class="form-group">
                <label class="form-label">Gym Name</label>
                <input type="text" id="auth-gym-name" class="form-input" placeholder="e.g. Iron House Fitness" required />
              </div>
              <div class="form-group">
                <label class="form-label">Owner Name</label>
                <input type="text" id="auth-owner-name" class="form-input" placeholder="e.g. Vikram Oberoi" required />
              </div>
            `
                : ''
            }

            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" id="auth-email" class="form-input" placeholder="name@gym.com" required />
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="auth-password" class="form-input" placeholder="••••••••" required />
            </div>

            ${
              this.mode === 'register'
                ? `
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="tel" id="auth-phone" class="form-input" placeholder="+91 98200 00000" required />
              </div>
            `
                : ''
            }

            <button type="submit" id="auth-submit-btn" class="btn btn-primary" style="width: 100%; margin-top: 10px; padding: 10px;">
              ${this.mode === 'login' ? 'Sign In' : 'Create Gym'}
            </button>
          </form>

          <!-- Toggle Mode -->
          <div style="margin-top: 24px; text-align: center; font-size: 12px; color: var(--text-secondary); border-top: 1px solid var(--border); padding-top: 16px;">
            ${
              this.mode === 'login'
                ? `New to GymFlow? <button id="auth-toggle-mode" style="background:none; border:none; color: var(--accent); cursor: pointer; font-weight: 600;">Create Gym Account</button>`
                : `Already have an account? <button id="auth-toggle-mode" style="background:none; border:none; color: var(--accent); cursor: pointer; font-weight: 600;">Sign In</button>`
            }
          </div>
        </div>
      </div>
    `;

    this.attachEvents(container);
  },

  attachEvents(container) {
    const form = container.querySelector('#auth-form');
    const toggleBtn = container.querySelector('#auth-toggle-mode');
    const fillDemoBtn = container.querySelector('#btn-fill-demo');

    if (fillDemoBtn) {
      fillDemoBtn.addEventListener('click', () => {
        container.querySelector('#auth-email').value = 'vikram@ironhouse.in';
        container.querySelector('#auth-password').value = 'admin123';
      });
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.mode = this.mode === 'login' ? 'register' : 'login';
        this.render(container);
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = container.querySelector('#auth-submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Authenticating...';

      const email = container.querySelector('#auth-email').value.trim();
      const password = container.querySelector('#auth-password').value;

      try {
        if (this.mode === 'login') {
          const res = await Api.post('/auth/login', { email, password });
          if (res.success) {
            Api.setToken(res.token);
            State.setUser(res.user, res.gym);
            Toast.success(`Signed in to ${res.gym.name}`);
            window.location.hash = '#/dashboard';
          }
        } else {
          const gymName = container.querySelector('#auth-gym-name').value.trim();
          const ownerName = container.querySelector('#auth-owner-name').value.trim();
          const phone = container.querySelector('#auth-phone').value.trim();

          const res = await Api.post('/auth/register', {
            gymName,
            ownerName,
            email,
            password,
            phone,
          });

          if (res.success) {
            Api.setToken(res.token);
            State.setUser(res.user, res.gym);
            Toast.success('Gym created successfully.');
            window.location.hash = '#/dashboard';
          }
        }
      } catch (err) {
        Toast.error(err.message || 'Authentication failed.');
        submitBtn.disabled = false;
        submitBtn.textContent = this.mode === 'login' ? 'Sign In' : 'Create Gym';
      }
    });
  },
};
