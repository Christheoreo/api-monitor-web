type Listener = (token: string | null) => void;

let accessToken: string | null = null;
// Bumped on every write. Lets a caller that started slow async work (e.g. a
// refresh request) detect that a newer logout/login/refresh landed meanwhile.
let version = 0;
const listeners = new Set<Listener>();

function set(token: string | null) {
  accessToken = token;
  version += 1;
  listeners.forEach((listener) => listener(token));
}

export const tokenStore = {
  get: () => accessToken,
  getVersion: () => version,
  set,
  // Compare-and-set: publish `token` only if no other write happened since
  // `expectedVersion` was read. Returns whether the write landed.
  setIfVersion: (expectedVersion: number, token: string | null) => {
    if (version !== expectedVersion) return false;
    set(token);
    return true;
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
