"use client";

import { useState, FormEvent, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { HeroSection } from "@/components/HeroSection";
import { ResultCard } from "@/components/ResultCard";
import { RecentLinks, RecentLinkData } from "@/components/RecentLinks";

const STORAGE_KEY = "url_shortener_recent_links";

export default function Home() {
  const [longUrl, setLongUrl] = useState("");
  const [shortCode, setShortCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [recentLinks, setRecentLinks] = useState<RecentLinkData[]>([]);
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentLinks(parsed);
        }
      }
    } catch {
      // Ignore local storage parse errors
    }
  }, []);

  const handleShortenUrl = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setShortCode(null);
    setIsCopied(false);

    let trimmedUrl = longUrl.trim();
    if (!trimmedUrl) {
      setError("Please enter a URL to shorten.");
      return;
    }

    // Auto-prefix protocol if missing
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      trimmedUrl = "https://" + trimmedUrl;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ longUrl: trimmedUrl }),
      });

      const payload = await response.json().catch(() => ({}));

      if (response.ok && payload.shortCode) {
        setShortCode(payload.shortCode);

        const newLink: RecentLinkData = {
          id: Date.now().toString(),
          originalUrl: trimmedUrl,
          shortUrl: payload.shortCode,
          clicks: 0,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        };

        setRecentLinks((prev) => {
          const updated = [newLink, ...prev.filter((l) => l.shortUrl !== payload.shortCode)].slice(0, 10);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // Ignore storage errors
          }
          return updated;
        });

        setLongUrl("");
      } else {
        const errorMsg =
          payload.error ||
          payload.message ||
          "Unable to shorten this URL. Please verify the URL and try again.";
        setError(errorMsg);
      }
    } catch {
      setError("Connection timed out. The server may be waking up — please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (shortCode && origin) {
      const fullUrl = `${origin}/${shortCode}`;
      navigator.clipboard.writeText(fullUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center pt-24 px-6 md:px-12 max-w-5xl mx-auto w-full">
      <HeroSection
        longUrl={longUrl}
        setLongUrl={setLongUrl}
        isLoading={isLoading}
        onSubmit={handleShortenUrl}
      />

      {error && (
        <div className="mt-6 text-red-600 font-sans text-sm p-4 bg-red-50 border border-red-200 rounded-xl w-full max-w-2xl text-center shadow-xs">
          {error}
        </div>
      )}

      <AnimatePresence>
        {shortCode && origin && (
          <ResultCard
            shortCode={shortCode}
            origin={origin}
            isCopied={isCopied}
            onCopy={handleCopyUrl}
          />
        )}
      </AnimatePresence>

      <RecentLinks links={recentLinks} />
    </main>
  );
}
