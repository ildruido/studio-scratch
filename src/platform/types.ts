// What the page needs from the place it runs in. The Claude artifact provides these through
// `window.claude`; the web build provides them through `/api/*` (docs/API.md). Every getter
// resolves null when that part is not available, and the page must cope.

export interface Platform {
  /** False when there is no host runtime at all (an ordinary browser tab, unit tests). */
  hasRuntime(): boolean;
  /** Ask the AI. Same shape as the artifact `sample` capability. */
  sample(): Promise<SampleFn | null>;
  /** Per-user documents. */
  db(): Promise<DbApi | null>;
  /** Who is using the page. */
  user(): Promise<UserApi | null>;
  /** Offer the viewer a generated file to save. */
  downloads(): Promise<DownloadsFn | null>;
  /** Consent state of a capability, without prompting. Null where the host has no such idea. */
  permissionState(name: string): Promise<PermissionState | null>;
}

/** One place the app can run. Files in src/platform/adapters/ default-export one of these. */
export interface PlatformAdapter {
  target: "artifact" | "web";
  create(): Platform;
  /** Runs before the app starts (the web adapter shows the sign-in screen here). */
  boot?(): Promise<void>;
}
