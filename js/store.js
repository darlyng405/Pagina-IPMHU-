// js/store.js — Estado global observable
import * as api from './api.js';

const _state = {
    user:  null,
    token: null,
    role:  null,
};

const _bus = new EventTarget();

export const store = {
    get(key) {
        return _state[key];
    },

    set(key, value) {
        _state[key] = value;
        _bus.dispatchEvent(Object.assign(new Event(key), { value }));
    },

    on(key, callback) {
        const handler = (e) => callback(e.value);
        _bus.addEventListener(key, handler);
        return () => _bus.removeEventListener(key, handler);
    },

    reset() {
        Object.keys(_state).forEach(key => {
            _state[key] = null;
            _bus.dispatchEvent(Object.assign(new Event(key), { value: null }));
        });
    },
};

// Sincronizar token con api.js automáticamente
store.on('token', (token) => api.setToken(token));
