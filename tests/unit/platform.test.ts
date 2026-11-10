import { afterEach, describe, expect, it } from "vitest";
import { fakePlatform } from "../../src/platform/fake";
import { getPlatform, nullPlatform, setPlatform } from "../../src/platform";

afterEach(() => setPlatform(nullPlatform));

describe("platform", () => {
  it("has nothing to offer until a platform is set, and the page copes", async () => {
    const p = getPlatform();
    expect(p.hasRuntime()).toBe(false);
    expect(await p.sample()).toBeNull();
    expect(await p.db()).toBeNull();
  });

  it("the fake platform answers and stores without any host", async () => {
    setPlatform(fakePlatform("hello"));
    const sample = await getPlatform().sample();
    expect((await sample!("hi")).text).toBe("hello");

    const db = (await getPlatform().db())!;
    await db.doc("data/users/u1/note").set({ text: "x" });
    expect((await db.doc("data/users/u1/note").get()).data()).toEqual({ text: "x" });
    expect((await db.collection("data/users/u1").get()).size).toBe(1);
    await db.doc("data/users/u1/note").delete();
    expect((await db.doc("data/users/u1/note").get()).exists).toBe(false);
  });
});
