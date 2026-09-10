/**
 * EPIC IndexedDB Storage for User-Uploaded Short Videos
 * Allows storing video files (MP4, WebM, MOV) locally without crashing localStorage quota (5MB limit).
 * Automatically resolves and persists video blobs across browser sessions and page reloads.
 */

const DB_NAME = "EpicShortsMediaDB";
const STORE_NAME = "videos";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        if (typeof window === "undefined" || !window.indexedDB) {
            return reject(new Error("IndexedDB not supported in this environment"));
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            dbPromise = null;
            reject(request.error);
        };
    });

    return dbPromise;
}

export async function storeShortVideoBlob(id: string, blob: Blob): Promise<void> {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            store.put({ id, blob, updatedAt: Date.now() });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.warn("Could not persist video to IndexedDB:", err);
    }
}

export async function getShortVideoBlob(id: string): Promise<Blob | null> {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(id);
            req.onsuccess = () => {
                resolve(req.result ? req.result.blob : null);
            };
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.warn("Could not retrieve video from IndexedDB:", err);
        return null;
    }
}

export async function deleteShortVideoBlob(id: string): Promise<void> {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            store.delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.warn("Could not delete video from IndexedDB:", err);
    }
}
