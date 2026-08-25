"use client";

import React, { useState, useEffect, useRef } from "react";
import { KeyRound, ShieldAlert, X, Lock, Eye, EyeOff, Terminal, ShieldCheck } from "lucide-react";
import { useAuth, generateRandomHex } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Authentication modal dialog presenting a dynamic hexadecimal challenge to unlock dashboard controls
export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, unlock } = useAuth();
  const [passkey, setPasskey] = useState<string>("");
  const [hexCode, setHexCode] = useState<string>("");
  const [questionText, setQuestionText] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showPasskey, setShowPasskey] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generates a dynamic random hex question challenge whenever modal opens
  const generateNewChallenge = () => {
    const hex = generateRandomHex(8);
    setHexCode(hex);
    setQuestionText(`Authorization Challenge [${hex}]: What is the developer passkey to unlock the Management Dashboard?`);
  };

  useEffect(() => {
    if (isAuthModalOpen) {
      generateNewChallenge();
      setPasskey("");
      setError("");
      setIsSuccess(false);
      setShowPasskey(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isAuthModalOpen]);

  // Handles escape key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  // Submits the passkey for verification
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const success = unlock(passkey);
    if (success) {
      setIsSuccess(true);
      setError("");
    } else {
      setError("Access Denied: Invalid security passkey. Please try again.");
      generateNewChallenge();
      setPasskey("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in select-none font-sans">
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar with Hex Challenge Tag */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center space-x-2 text-foreground font-bold text-sm">
            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <Lock className="w-4 h-4" />
            </div>
            <span>Developer Authorization</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="purple" className="font-mono text-[10px]">
              {hexCode}
            </Badge>
            <button
              onClick={closeAuthModal}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors text-base cursor-pointer"
              type="button"
            >
              ×
            </button>
          </div>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Dynamic Hex Code Question */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
            <div className="flex items-center space-x-2 text-foreground font-semibold">
              <Terminal className="w-4 h-4 text-primary shrink-0" />
              <span>Security Question:</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-mono">
              {questionText}
            </p>
          </div>

          {/* Error / Success Alerts */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center space-x-2 animate-in shake">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="text-xs">{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold">Access Granted: Dashboard unlocked!</span>
            </div>
          )}

          {/* Passkey Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase font-mono">
              Developer Passkey
            </label>
            <div className="relative flex items-center">
              <Input
                ref={inputRef}
                type={showPasskey ? "text" : "password"}
                placeholder="Enter passkey..."
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className="pr-10 font-mono text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasskey(!showPasskey)}
                className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
                title={showPasskey ? "Hide passkey" : "Show passkey"}
              >
                {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-[11px] text-muted-foreground font-mono">
              Public view active
            </span>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                type="button"
                onClick={closeAuthModal}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
              >
                <KeyRound className="w-3.5 h-3.5 mr-1" />
                <span>Unlock Dashboard</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
