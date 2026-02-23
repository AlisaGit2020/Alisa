const USER_ID_KEY = "asset-current-user-id";

let cachedUserId: number | null = null;

export function setCurrentUserId(id: number | null): void {
  cachedUserId = id;
  if (id !== null) {
    localStorage.setItem(USER_ID_KEY, id.toString());
  } else {
    localStorage.removeItem(USER_ID_KEY);
  }
}

export function getCurrentUserId(): number | null {
  if (cachedUserId !== null) {
    return cachedUserId;
  }

  const stored = localStorage.getItem(USER_ID_KEY);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed)) {
      cachedUserId = parsed;
      return parsed;
    }
  }
  return null;
}

export function buildKey(key: string): string {
  const userId = getCurrentUserId();
  const prefix = userId !== null ? `user:${userId}` : "anonymous";
  return `${prefix}:${key}`;
}

export function getItem<T>(key: string): T | null {
  const fullKey = buildKey(key);
  const stored = localStorage.getItem(fullKey);
  if (stored === null) {
    return null;
  }
  try {
    return JSON.parse(stored) as T;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  const fullKey = buildKey(key);
  localStorage.setItem(fullKey, JSON.stringify(value));
}

export function removeItem(key: string): void {
  const fullKey = buildKey(key);
  localStorage.removeItem(fullKey);
}

const UserStorage = {
  setCurrentUserId,
  getCurrentUserId,
  buildKey,
  getItem,
  setItem,
  removeItem,
};

export default UserStorage;
