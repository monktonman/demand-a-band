"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Music, Lock, Sparkles } from "lucide-react";

export default function BetaGatePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/beta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Invalid access code");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 mb-4">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Demand A Band
          </h1>
          <div className="flex items-center justify-center gap-2 text-orange-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Beta Preview
            </span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Gate Card */}
        <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Lock className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Early Access
              </h2>
              <p className="text-sm text-gray-400">
                Enter your access code to continue
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="Access Code"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center text-lg tracking-widest font-mono"
                autoFocus
                autoComplete="off"
              />
              {error && (
                <p className="mt-2 text-sm text-red-400 text-center">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/25"
            >
              {loading ? "Checking..." : "Enter Beta"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Don&apos;t have a code? Reach out to the team for access.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          demanda.band &middot; Baltimore&apos;s Concert Demand Platform
        </p>
      </div>
    </div>
  );
}
