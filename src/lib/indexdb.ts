import { IDBPDatabase, openDB } from "idb";

const DB_NAME = "metacensus";
const STORE_NAME = "metacensus-store";

let dbPromise: Promise<IDBPDatabase> | null = null;

export const getPromise = async () => {
  if (!dbPromise) {
    dbPromise = openDB(STORE_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DB_NAME)) {
          db.createObjectStore(DB_NAME);
        }
      },
    });
  }
  return dbPromise;
};

export async function get<T>(key: string): Promise<T | undefined> {
  const db = await getPromise();
  return db.get(DB_NAME, key);
}

export async function set<T>(key: string, val: T) {
  const db = await getPromise();
  return db.put(DB_NAME, val, key);
}

export async function del(key: string) {
  const db = await getPromise();
  return db.delete(DB_NAME, key);
}

export async function clear() {
  const db = await getPromise();
  return db.clear(DB_NAME);
}

export async function keys() {
  const db = await getPromise();
  return db.getAllKeys(DB_NAME);
}
