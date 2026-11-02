import { ApiError } from './api-error';

// Browser transport state only. User data remains in the provider's QueryClient.
let authQueue: Promise<unknown> = Promise.resolve();
let sessionController = new AbortController();
let expired = false;
let signedOut = false;
let recovery: { signal: AbortSignal; promise: Promise<void> } | undefined;
const expiryListeners = new Set<() => void>();

export function withAuthLock<T>(operation: () => Promise<T>): Promise<T> {
  const result = authQueue.then(async (): Promise<T> => {
    if (typeof navigator !== 'undefined' && navigator.locks)
      return await navigator.locks.request('mindy-fe2-session', operation);
    return await operation();
  });
  authQueue = result.catch(() => undefined);
  return result;
}

export function sessionSignal() {
  return sessionController.signal;
}

export function sessionExpiredError() {
  return new ApiError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.');
}

export function assertSessionAvailable() {
  if (expired) throw sessionExpiredError();
}

export function sessionWasLoggedOut() {
  return signedOut;
}

export function acknowledgeLogoutNavigation() {
  signedOut = false;
}

export function subscribeSessionExpiry(listener: () => void) {
  expiryListeners.add(listener);
  return () => {
    expiryListeners.delete(listener);
  };
}

export function expireSession(signal: AbortSignal) {
  if (signal !== sessionController.signal || expired) return;
  expired = true;
  signedOut = false;
  sessionController.abort(sessionExpiredError());
  for (const listener of expiryListeners) listener();
}

function advanceSession() {
  sessionController.abort(new DOMException('Session changed', 'AbortError'));
  sessionController = new AbortController();
  recovery = undefined;
}

// Invalidate old work immediately, including while a refresh still owns the lock.
// Cookie-changing operations remain serialized until their response is received.
export function withAuthChange<T>(operation: () => Promise<T>, signedIn: boolean): Promise<T> {
  advanceSession();
  const requestedSession = sessionController.signal;
  return withAuthLock(async () => {
    requestedSession.throwIfAborted();
    const result = await operation();
    requestedSession.throwIfAborted();
    advanceSession();
    expired = !signedIn;
    signedOut = !signedIn;
    return result;
  });
}

export function recoverSession(signal: AbortSignal, operation: () => Promise<void>) {
  signal.throwIfAborted();
  if (!recovery || recovery.signal !== signal) {
    const entry = { signal, promise: withAuthLock(operation) };
    recovery = entry;
    void entry.promise
      .finally(() => {
        if (recovery === entry) recovery = undefined;
      })
      .catch(() => undefined);
  }
  return recovery.promise;
}

// One cancelled caller must not cancel the shared cookie rotation.
export function waitForRecovery(promise: Promise<void>, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}
