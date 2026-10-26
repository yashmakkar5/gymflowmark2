// Application State Store
import { Api } from './api.js';

class StateStore {
  constructor() {
    this.user = null;
    this.gym = null;
    this.currentRoute = 'dashboard';
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this);
    }
  }

  setUser(user, gym) {
    this.user = user;
    this.gym = gym;
    this.notify();
  }

  clearUser() {
    this.user = null;
    this.gym = null;
    Api.setToken(null);
    this.notify();
  }

  async loadInitialUser() {
    const token = Api.getToken();
    if (!token) return false;

    try {
      const res = await Api.get('/auth/me');
      if (res.success) {
        this.setUser(res.user, res.gym);
        return true;
      }
    } catch (err) {
      this.clearUser();
      return false;
    }
    return false;
  }
}

export const State = new StateStore();
