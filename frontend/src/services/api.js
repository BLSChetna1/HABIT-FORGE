const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "habitforge_token";

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    let data = null;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    }

    if (!res.ok) {
      const errorMessage =
        (data && data.error) ||
        (data && data.message) ||
        `Request failed with status ${res.status}`;

      if (res.status === 401) {
        removeToken();
        if (typeof unauthorizedHandler === "function") {
          unauthorizedHandler(errorMessage);
        }
      }

      throw new ApiError(errorMessage, res.status, data);
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network error or connection refused
    throw new ApiError(
      "Unable to connect to the HabitForge server. Please check your network or server status.",
      0
    );
  }
}

export const authApi = {
  register: (userData) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData)
    }),
  login: (credentials) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    }),
  getMe: () => request("/auth/me")
};

export const habitsApi = {
  getAll: (today) => {
    const query = today ? `?today=${encodeURIComponent(today)}` : "";
    return request(`/habits${query}`);
  },
  getById: (id, today) => {
    const query = today ? `?today=${encodeURIComponent(today)}` : "";
    return request(`/habits/${id}${query}`);
  },
  create: (habitData) =>
    request("/habits", {
      method: "POST",
      body: JSON.stringify(habitData)
    }),
  update: (id, habitData) =>
    request(`/habits/${id}`, {
      method: "PUT",
      body: JSON.stringify(habitData)
    }),
  delete: (id) =>
    request(`/habits/${id}`, {
      method: "DELETE"
    }),
  complete: (id, date) =>
    request(`/habits/${id}/complete`, {
      method: "POST",
      body: JSON.stringify(date ? { date } : {})
    }),
  getCompletions: (id) => request(`/habits/${id}/completions`)
};

export const analyticsApi = {
  getWeekly: (today) => {
    const query = today ? `?today=${encodeURIComponent(today)}` : "";
    return request(`/analytics/weekly${query}`);
  }
};

export const usersApi = {
  getMe: () => request("/users/me")
};

export const healthApi = {
  check: () => request("/health")
};

export default {
  auth: authApi,
  habits: habitsApi,
  analytics: analyticsApi,
  users: usersApi,
  health: healthApi,
  getToken,
  setToken,
  removeToken,
  setUnauthorizedHandler,
  ApiError
};
