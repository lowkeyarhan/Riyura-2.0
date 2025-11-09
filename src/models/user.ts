// Firestore User model & converter
// Stored in collection `users` with document id = auth.uid

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string;
  photoURL: string | null;
  createdAt: number; // unix epoch ms
}
