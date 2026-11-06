import { FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  longUrl: string;
  setLongUrl: (url: string) => void;
  isLoading: boolean;
  onSubmit: (e: FormEvent) => void;
}

export function HeroSection({ longUrl, setLongUrl, isLoading, onSubmit }: HeroSectionProps) {
  return (
    <div className="text-center w-full max-w-2xl">
      <h1 className="font-serif text-5xl md:text-6xl text-primary leading-tight mb-6">
        Shorten your links. <br className="hidden md:block" /> Expand your reach.
      </h1>
      <p className="text-gray-600 text-lg mb-10 font-sans">
        A premium URL shortener designed for clarity, speed, and elegance.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col md:flex-row gap-4 items-center w-full relative z-10">
        <div className="relative w-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] rounded-xl border border-gray-200 bg-surface focus-within:ring-2 focus-within:ring-primary/20 transition-all overflow-hidden flex items-center px-4 py-3">
          <input
            type="text"
            required
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            placeholder="Paste your long link here..."
            className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-gray-400 font-sans text-lg"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={isLoading}
          type="submit"
          className="w-full md:w-auto px-8 py-4 bg-primary text-white font-sans font-medium rounded-xl shadow-sm hover:bg-primary-hover disabled:opacity-70 transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
        >
          {isLoading ? "Shortening..." : "Shorten"}
          {!isLoading && <ArrowRight size={18} />}
        </motion.button>
      </form>
    </div>
  );
}
