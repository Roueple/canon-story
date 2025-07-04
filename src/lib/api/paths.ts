// src/lib/api/paths.ts
const API_ADMIN_BASE = '/api/admin';

export const API_PATHS = {
  admin: {
    // Tags
    tags: `${API_ADMIN_BASE}/tags`,
    tagById: (id: string) => `${API_ADMIN_BASE}/tags/${id}`,
  },
  public: {
    // Define public paths here as needed
  }
};