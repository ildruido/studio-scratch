import { afterEach, describe, expect, it, vi } from "vitest";
import { artifactPlatform } from "../../src/platform/artifact";

afterEach(() => vi.unstubAllGlobals());

describe("artifact platform", () => {
  it("reports no runtime and no capabilities outside the Claude app", async () => {
    vi.stubGlobal("window", {});
    expect(artifactPlatform.hasRuntime()).toBe(false);
    expect(await artifactPlatform.sample()).toBeNull();
    expect(await artifactPlatform.db()).toBeNull();
    expect(await artifactPlatform.permissionState("sample")).toBeNull();
  });

  it("asks the runtime for each capability by name", async () => {
    const use = vi.fn(async (name: string) =>
      name === "permissions" ? { state: async () => "granted" } : { name },
    );
    vi.stubGlobal("window", { claude: { use } });
    expect(artifactPlatform.hasRuntime()).toBe(true);
    await artifactPlatform.sample();
    await artifactPlatform.db();
    expect(use).toHaveBeenCalledWith("sample");
    expect(use).toHaveBeenCalledWith("db");
    expect(await artifactPlatform.permissionState("sample")).toBe("granted");
  });
});
