// The one place the page asks "where am I running?". The build picks the adapter whose target
// matches `__TARGET__` (see src/platform/adapters/); with none, every capability is absent.
import type { Platform, PlatformAdapter } from "./types";

export type { Platform, PlatformAdapter } from "./types";

/** A place with no host at all: the page still renders and explains itself. */
export const nullPlatform: Platform = {
  hasRuntime: () => false,
  sample: async () => null,
  db: async () => null,
  user: async () => null,
  downloads: async () => null,
  permissionState: async () => null,
};

const adapters = import.meta.glob<{ default: PlatformAdapter }>("./adapters/*.ts", {
  eager: true,
});

let current: Platform = nullPlatform;

export function getPlatform(): Platform {
  return current;
}

/** Swap the platform (tests). */
export function setPlatform(platform: Platform): void {
  current = platform;
}

/** Choose this build's platform and run its boot step. Call once, before the app mounts. */
export async function startPlatform(): Promise<void> {
  const adapter = Object.values(adapters)
    .map((m) => m.default)
    .find((a) => a.target === __TARGET__);
  if (!adapter) return;
  current = adapter.create();
  await adapter.boot?.();
}
