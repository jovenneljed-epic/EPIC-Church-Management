import type { EnrolledFaceProfile } from "./EpicFaceBiometrics";

const STORAGE_KEY = "epic_smile_profiles";
const DB_NAME = "epic_biometrics_db";
const STORE_NAME = "enrolled_faces";
const DB_VERSION = 1;

/**
 * Open IndexedDB database for permanent client-side biometrics persistence
 */
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
            return reject(new Error("IndexedDB not supported in this browser"));
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "memberId" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Synchronous read from localStorage for instant 0-latency component initialization
 */
export function getStoredBiometricsSync(): EnrolledFaceProfile[] {
    try {
        if (typeof window === "undefined" || !window.localStorage) return [];
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.filter(p => p && p.memberId && Array.isArray(p.descriptor) && p.descriptor.length > 0);
            }
        }
    } catch (e) {
        console.warn("[Biometrics] LocalStorage read warning:", e);
    }
    return [];
}

/**
 * Read from IndexedDB for permanent storage recovery
 */
export async function getBiometricsFromIndexedDB(): Promise<EnrolledFaceProfile[]> {
    try {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll();
            req.onsuccess = () => {
                const list = (req.result as EnrolledFaceProfile[]) || [];
                resolve(list.filter(p => p && p.memberId && Array.isArray(p.descriptor) && p.descriptor.length > 0));
            };
            req.onerror = () => resolve([]);
        });
    } catch {
        return [];
    }
}

/**
 * Save to IndexedDB
 */
export async function saveBiometricsToIndexedDB(profiles: EnrolledFaceProfile[]): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        for (const p of profiles) {
            store.put(p);
        }
    } catch (e) {
        console.warn("[Biometrics] Failed to write to IndexedDB:", e);
    }
}

/**
 * Delete a profile from IndexedDB (e.g., when re-capturing or removing)
 */
export async function deleteBiometricFromIndexedDB(memberId: number): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.delete(memberId);
    } catch (e) {
        console.warn("[Biometrics] Failed to delete from IndexedDB:", e);
    }
}

/**
 * Save to dual storage (LocalStorage + IndexedDB).
 * Optimizes image size in LocalStorage to never exceed browser 5MB quota.
 */
export async function saveStoredBiometrics(profiles: EnrolledFaceProfile[]): Promise<void> {
    if (!Array.isArray(profiles)) return;

    // 1. Save to LocalStorage with quota protection
    try {
        const safeProfiles = profiles.map(p => {
            // If photoPath is an excessively large base64 (> 80KB), strip or keep memberId only
            if (p.photoPath && p.photoPath.startsWith("data:") && p.photoPath.length > 80000) {
                return { ...p, photoPath: "" };
            }
            return p;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(safeProfiles));
    } catch (e) {
        console.warn("[Biometrics] LocalStorage save warning (IndexedDB will preserve data):", e);
    }

    // 2. Save full high-fidelity profiles to IndexedDB
    await saveBiometricsToIndexedDB(profiles);
}

/**
 * Merge two sets of profiles by memberId (never losing enrolled members)
 */
export function mergeFaceProfiles(
    existing: EnrolledFaceProfile[],
    incoming: EnrolledFaceProfile[]
): EnrolledFaceProfile[] {
    const map = new Map<number, EnrolledFaceProfile>();

    // Add existing
    (existing || []).forEach(p => {
        if (p && p.memberId && Array.isArray(p.descriptor) && p.descriptor.length > 0) {
            map.set(p.memberId, p);
        }
    });

    // Add/merge incoming
    (incoming || []).forEach(p => {
        if (p && p.memberId && Array.isArray(p.descriptor) && p.descriptor.length > 0) {
            const cur = map.get(p.memberId);
            // Replace if new, or if incoming has equal/newer enrolledAt
            if (!cur || !cur.enrolledAt || (p.enrolledAt && p.enrolledAt >= cur.enrolledAt)) {
                map.set(p.memberId, p);
            }
        }
    });

    return Array.from(map.values());
}

/**
 * Load all stored biometrics across LocalStorage and IndexedDB
 */
export async function loadAllStoredBiometrics(): Promise<EnrolledFaceProfile[]> {
    const local = getStoredBiometricsSync();
    const idb = await getBiometricsFromIndexedDB();

    const merged = mergeFaceProfiles(local, idb);
    if (merged.length > 0) {
        // Sync both stores
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {}
        void saveBiometricsToIndexedDB(merged);
    }
    return merged;
}
