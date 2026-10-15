"use client";

import { useState, useCallback } from "react";
import LandingHero from "@/components/LandingHero";
import AuthModal from "@/components/AuthModal";
import PuzzleDashboard from "@/components/PuzzleDashboard";
import WinModal from "@/components/WinModal";

export interface UserSession {
  id: string;
  fullName: string;
  unlockedPieces: number[];
  redeemedCodes: string[];
}

export default function Home() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [newlyRevealedPiece, setNewlyRevealedPiece] = useState<number | null>(null);

  const handleAuthSuccess = useCallback((userData: UserSession) => {
    setUser(userData);
    setShowAuth(false);
    if (userData.unlockedPieces.length === 4) {
      setTimeout(() => setShowWin(true), 400);
    }
  }, []);

  const handlePieceUnlocked = useCallback((piece: number, updatedUser: UserSession) => {
    setNewlyRevealedPiece(piece);
    setUser(updatedUser);
    setTimeout(() => setNewlyRevealedPiece(null), 1200);
    if (updatedUser.unlockedPieces.length === 4) {
      setTimeout(() => setShowWin(true), 1800);
    }
  }, []);

  const handleLogout = useCallback(() => {
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
