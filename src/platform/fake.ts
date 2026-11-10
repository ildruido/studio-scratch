// A platform for unit tests: nothing here talks to a real host or a real model.
import type { Platform } from "./types";

class Snap implements DbDocumentSnapshot {
  constructor(
    readonly id: string,
    private readonly value: Record<string, unknown> | undefined,
  ) {}
  get exists() {
    return this.value !== undefined;
  }
  data() {
    return this.value;
  }
}

/** In-memory documents: get, set, delete and listing a collection's direct children. */
export function memoryDb(store = new Map<string, Record<string, unknown>>()): DbApi {
  const doc = (path: string): DbDocumentReference => ({
    id: path.slice(path.lastIndexOf("/") + 1),
    path,
    get: async () => new Snap(path.slice(path.lastIndexOf("/") + 1), store.get(path)),
    set: async (data) => void store.set(path, structuredClone(data)),
    delete: async () => void store.delete(path),
    collection: (name) => collection(`${path}/${name}`),
  });
  const collection = (path: string): DbCollectionReference => {
    const list = async (): Promise<DbQuerySnapshot> => {
      const docs = [...store]
        .filter(([p]) => p.startsWith(`${path}/`) && !p.slice(path.length + 1).includes("/"))
        .map(([p, v]) => new Snap(p.slice(path.length + 1), v));
      return { docs, size: docs.length, empty: docs.length === 0 };
    };
    const query: DbCollectionReference = {
      path,
      doc: (id = crypto.randomUUID()) => doc(`${path}/${id}`),
      where: () => query,
      orderBy: () => query,
      limit: () => query,
      get: list,
    };
    return query;
  };
  return { doc, collection };
}

/** A platform whose AI answers with `answer` and whose documents live in memory. */
export function fakePlatform(answer = "A fake answer."): Platform {
  const db = memoryDb();
  const sample = (async (_input, options) => {
    options?.onText?.({ text: answer, delta: answer });
    return { text: answer, truncated: false, modelTierApplied: "quick" };
  }) as SampleFn;
  return {
    hasRuntime: () => true,
    sample: async () => sample,
    db: async () => db,
    user: async () => ({ id: async () => "test-user" }),
    downloads: async () => null,
    permissionState: async () => "granted",
  };
}
