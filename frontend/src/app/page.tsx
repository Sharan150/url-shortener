"use client";

import { useState, FormEvent, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { HeroSection } from "@/components/HeroSection";
import { ResultCard } from "@/components/ResultCard";
import { RecentLinks, RecentLinkData } from "@/components/RecentLinks";

const mockRecentLinks: RecentLinkData[] = [
  { id: "1", originalUrl: "https://github.com/facebook/react", shortUrl: "abc12", clicks: 124, date: "Oct 12, 2026" },
  { id: "2", originalUrl: "https://news.ycombinator.com", shortUrl: "xyz89", clicks: 42, date: "Oct 11, 2026" },
  { id: "3", originalUrl: "https://figma.com/design-systems", shortUrl: "def34", clicks: 890, date: "Oct 10, 2026" },
];

export default function Home() {
  const [longUrl, setLongUrl] = useState("");
  const [shortCode, setShortCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [recentLinks, setRecentLinks] = useState<RecentLinkData[]>(mockRecentLinks);
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleShortenUrl = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setShortCode(null);
    setIsCopied(false);
    setError(null);

    try {
      // Ensure the URL has a protocol so the backend's @URL validation accepts it
      let urlToShorten = longUrl.trim();
      if (!/^https?:\/\//i.test(urlToShorten)) {
        urlToShorten = 'https://' + urlToShorten;
      }

      const response = await fetch("/api/v1/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ longUrl: urlToShorten }),
      });

      if (response.ok) {
        const payload = await response.json();
        setShortCode(payload.shortCode);
        
        const newLink: RecentLinkData = {
          id: Date.now().toString(),
          originalUrl: longUrl,
          shortUrl: payload.shortCode,
          clicks: 0,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        };
        
        setRecentLinks(prev => [newLink, ...prev].slice(0, 5));
        setLongUrl("");
      } else {
        setError("We couldn't shorten that URL. Please check the format and try again.");
      }
    } catch (err) {
      setError("Unable to reach the server. Please ensure you are connected to the internet.");
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
        <div className="mt-4 text-red-500 font-sans text-sm p-3 bg-red-50 border border-red-100 rounded-lg w-full max-w-2xl text-center">
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
