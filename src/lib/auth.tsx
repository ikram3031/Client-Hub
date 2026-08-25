"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AuthContextType {
  isUnlocked: boolean;
  unlock: (passkey: string) => boolean;
  lock: () => void;
  requireAuth: (callback: () => void) => void;
  isAuthModalOpen: boolean;
  openAuthModal: (onSuccessCallback?: () => void) => void;
  closeAuthModal: () => void;
  pendingCallback: (() => void) | null;
  generateHexChallenge: () => string;
}

const PASSKEY = "metalIsNotDead";
const STORAGE_KEY = "docs_dev_auth_unlocked";

const AuthContext = createContext<AuthContextType>({
  isUnlocked: false,
  unlock: () => false,
  lock: () => {},
  requireAuth: () => {},
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  pendingCallback: null,
  generateHexChallenge: () => "",
});

// Generates a random cryptographic hexadecimal challenge string
export const generateRandomHex = (length: number = 8): string => {
  const chars = "0123456789ABCDEF";
  let result = "0x";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

// Authentication provider managing developer dashboard access and passkey verification
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  // Synchronizes persistent developer unlock status on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "true") {
        setIsUnlocked(true);
      }
    } catch (e) {
      console.error("Auth storage read error:", e);
    }
  }, []);

  // Unlocks developer mode if passkey matches "metalIsNotDead"
  const unlock = useCallback((passkey: string): boolean => {
    if (passkey.trim() === PASSKEY) {
      setIsUnlocked(true);
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch (e) {
        console.error("Auth storage write error:", e);
      }
      if (pendingCallback) {
        pendingCallback();
        setPendingCallback(null);
      }
      setIsAuthModalOpen(false);
      return true;
    }
    return false;
  }, [pendingCallback]);

  // Relocks dashboard to public read-only guest mode
  const lock = useCallback(() => {
    setIsUnlocked(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Auth storage remove error:", e);
    }
  }, []);

  // Opens auth modal with optional callback to execute upon successful unlock
  const openAuthModal = useCallback((onSuccessCallback?: () => void) => {
    if (onSuccessCallback) {
      setPendingCallback(() => onSuccessCallback);
    }
    setIsAuthModalOpen(true);
  }, []);

  // Closes the auth modal and discards pending callback
  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setPendingCallback(null);
  }, []);

  // Executes callback if unlocked, or prompts auth modal if locked
  const requireAuth = useCallback((callback: () => void) => {
    if (isUnlocked) {
      callback();
    } else {
      openAuthModal(callback);
    }
  }, [isUnlocked, openAuthModal]);

  // Helper generating a random hex code challenge string
  const generateHexChallenge = useCallback(() => {
    return generateRandomHex(10);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isUnlocked,
        unlock,
        lock,
        requireAuth,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        pendingCallback,
        generateHexChallenge,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook for consuming developer authorization state and actions
export const useAuth = () => useContext(AuthContext);
