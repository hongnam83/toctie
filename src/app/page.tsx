"use client";

import { useState, useCallback, useEffect } from "react";
import LandingHero from "@/components/LandingHero";
import AuthModal from "@/components/AuthModal";
import PuzzleDashboard from "@/components/PuzzleDashboard";
import WinModal from "@/components/WinModal";

export interface UserSession {
  id: string;
  fullName: string;
  phone?: string;
  note?: string;
  unlockedPieces: number[];
  redeemedCodes: string[];
}

const STORAGE_KEY_USER_ID = "toctie_active_user_id";
const STORAGE_KEY_USER_NAME = "toctie_active_account_name";
const STORAGE_KEY_CACHED_SESSION = "toctie_cached_session";

function saveClientSession(userData: UserSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (userData) {
      localStorage.setItem(STORAGE_KEY_USER_ID, userData.id);
      localStorage.setItem(STORAGE_KEY_USER_NAME, userData.fullName);
      localStorage.setItem(STORAGE_KEY_CACHED_SESSION, JSON.stringify(userData));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER_ID);
      localStorage.removeItem(STORAGE_KEY_USER_NAME);
      localStorage.removeItem(STORAGE_KEY_CACHED_SESSION);
    }
  } catch {
    // ignore private browsing quota issues
  }
}

export default function Home() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [newlyRevealedPiece, setNewlyRevealedPiece] = useState<number | null>(null);

  // Auto-rehydrate customer session instantly from cached storage, then sync with backend
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cachedRaw = localStorage.getItem(STORAGE_KEY_CACHED_SESSION);
      const savedUserId = localStorage.getItem(STORAGE_KEY_USER_ID);
      const savedUserName = localStorage.getItem(STORAGE_KEY_USER_NAME);

      // 1. Instant rehydration from client cache (0ms delay, no screen flash, indestructible across hours/days)
      if (cachedRaw) {
        try {
          const parsed = JSON.parse(cachedRaw) as UserSession;
          if (parsed && parsed.id && parsed.fullName) {
            setUser(parsed);
            if (parsed.unlockedPieces?.length === 4) {
              setTimeout(() => setShowWin(true), 400);
            }
          }
        } catch {
          // ignore parse errors
        }
      }

      // 2. Background revalidation with backend (handles cold boot / serverless container wakeups)
      if (!savedUserId && !savedUserName) return;

      const query = new URLSearchParams();
      if (savedUserId) query.set("userId", savedUserId);
      if (savedUserName) query.set("accountName", savedUserName);

      fetch(`/api/auth?${query.toString()}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Session fetch returned " + res.status);
        })
        .then((data) => {
          if (data?.success && data?.user) {
            const freshUser = data.user as UserSession;
            setUser(freshUser);
            saveClientSession(freshUser);
            if (freshUser.unlockedPieces?.length === 4) {
              setTimeout(() => setShowWin(true), 400);
            }
          }
        })
        .catch(() => {
          // Keep current cached session if backend is temporarily waking up or network is slow
        });
    } catch {
      // ignore localStorage errors in private mode
    }
  }, []);

  const handleAuthSuccess = useCallback((userData: UserSession) => {
    saveClientSession(userData);
    setUser(userData);
    setShowAuth(false);
    if (userData.unlockedPieces.length === 4) {
      setTimeout(() => setShowWin(true), 400);
    }
  }, []);

  const handlePieceUnlocked = useCallback((piece: number, updatedUser: UserSession) => {
    setNewlyRevealedPiece(piece);
    setUser(updatedUser);
    saveClientSession(updatedUser);
    setTimeout(() => setNewlyRevealedPiece(null), 1200);
    if (updatedUser.unlockedPieces.length === 4) {
      setTimeout(() => setShowWin(true), 1800);
    }
  }, []);

  const handleLogout = useCallback(() => {
    saveClientSession(null);
    setUser(null);
    setShowWin(false);
  }, []);

  return (
    <main>
      {!user ? (
        <>
          <LandingHero onOpenAuth={() => setShowAuth(true)} />
          {showAuth && (
            <AuthModal
              onClose={() => setShowAuth(false)}
              onSuccess={handleAuthSuccess}
            />
          )}
        </>
      ) : (
        <PuzzleDashboard
          user={user}
          newlyRevealedPiece={newlyRevealedPiece}
          onPieceUnlocked={handlePieceUnlocked}
          onLogout={handleLogout}
          onShowWin={() => setShowWin(true)}
        />
      )}

      {showWin && user && (
        <WinModal user={user} onClose={() => setShowWin(false)} />
      )}
    </main>
  );
}
