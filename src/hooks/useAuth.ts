"use client";

import { useEffect, useState, useMemo } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/src/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Derive commonly used auth presentation fields
  const firstName = useMemo(() => {
    if (!user?.displayName) return null;
    return user.displayName.trim().split(/\s+/)[0];
  }, [user?.displayName]);

  const avatarUrl = user?.photoURL || null;

  return { user, loading, firstName, avatarUrl } as const;
}
