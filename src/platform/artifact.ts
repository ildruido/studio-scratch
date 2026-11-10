import type { Platform } from "./types";

/** The Claude artifact runtime (`window.claude`), read lazily so tests can fake it late. */
export const artifactPlatform: Platform = {
  hasRuntime: () => Boolean(window.claude),
  sample: async () => (window.claude ? window.claude.use("sample") : null),
  db: async () => (window.claude ? window.claude.use("db") : null),
  user: async () => (window.claude ? window.claude.use("user") : null),
  downloads: async () => (window.claude ? window.claude.use("downloads") : null),
  permissionState: async (name) => {
    const permissions = window.claude ? await window.claude.use("permissions") : null;
    return permissions ? permissions.state(name) : null;
  },
};
