import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  type DocumentReference,
  type CollectionReference,
} from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import type { AppUser } from "@/src/models/user";
import type { WatchlistItem } from "@/src/models/watchlist";

// Generic helpers -----------------------------------------------------------
export function usersCol(): CollectionReference {
  return collection(db, "users");
}
export function userDoc(uid: string): DocumentReference {
  return doc(usersCol(), uid);
}
export function watchlistCol(uid: string): CollectionReference {
  return collection(userDoc(uid), "watchlist");
}
export function progressCol(uid: string): CollectionReference {
  return collection(userDoc(uid), "progress");
}
export function reviewsCol(uid: string): CollectionReference {
  return collection(userDoc(uid), "reviews");
}

// CRUD User ----------------------------------------------------------------
export async function ensureUserProfile(user: {
  uid: string;
  displayName: string | null;
  email: string;
  photoURL: string | null;
}) {
  const ref = userDoc(user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const data: AppUser = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: Date.now(),
    };
    await setDoc(ref, data);
  }
}

// Watchlist ----------------------------------------------------------------
export async function addToWatchlist(uid: string, item: WatchlistItem) {
  const ref = doc(watchlistCol(uid), item.id);
  await setDoc(ref, item);
}
export async function removeFromWatchlist(uid: string, id: string) {
  const ref = doc(watchlistCol(uid), id);
  await deleteDoc(ref);
}
export async function getWatchlist(uid: string) {
  const col = watchlistCol(uid);
  const snap = await getDocs(col);
  return snap.docs.map((d) => d.data() as WatchlistItem);
}

// Query example: find watchlist item by type
export async function getWatchlistByType(uid: string, type: string) {
  const q = query(watchlistCol(uid), where("type", "==", type));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as WatchlistItem);
}
