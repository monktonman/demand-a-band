"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Music2,
  MapPin,
  Users,
  Check,
  Heart,
  Share2,
  Copy,
  MessageCircle,
  Mail,
  PartyPopper,
} from "lucide-react";
import Link from "next/link";

const VENUE_SIZE_CAPACITIES: Record<string, string> = {
  intimate: "Under 200",
  club: "200–500",
  theater: "500–1,500",
  large: "1,500–5,000",
};

type DreamShowData = {
  id: string;
  shareCode: string;
  band: {
    name: string;
    genres: string[];
    popularity: number | null;
  };
  venue: {
    name: string;
    city: string;
    state: string;
    capacity: number;
  } | null;
  venueSize: string | null;
  venueSizeLabel: string | null;
  maxTicketPrice: number;
  priceTierLabel: string;
  message: string | null;
  creator: {
    name: string | null;
  };
  voteCount: number;
  votes: {
    id: string;
    name: string;
    createdAt: string;
  }[];
  createdAt: string;
};

export default function DreamShowSharePage({
  params,
}: {
  params: Promise<{ shareCode: string }>;
}) {
  const { shareCode } = use(params);
  const { data: session } = useSession();
  const [dreamShow, setDreamShow] = useState<DreamShowData | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [justVoted, setJustVoted] = useState(false);
  const [error, setError] = useState("");
  const [anonName, setAnonName] = useState("");
  const [anonEmail, setAnonEmail] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/dream-shows/${shareCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setDreamShow(data.dreamShow);
          setHasVoted(data.hasVoted);
        }
      })
      .catch(() => setError("Failed to load dream show"))
      .finally(() => setLoading(false));
  }, [shareCode]);

  const handleVote = async () => {
    if (!dreamShow) return;
    setVoting(true);

    try {
      const res = await fetch(`/api/dream-shows/${shareCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: session?.user?.name || anonName || undefined,
          email: anonEmail || undefined,
        }),
      });

      const data = await res.json();

      if (data.alreadyVoted) {
        setHasVoted(true);
        return;
      }

      if (data.success) {
        setHasVoted(true);
        setJustVoted(true);
        setDreamShow((prev) =>
          prev ? { ...prev, voteCount: data.voteCount } : prev
        );
      }
    } catch {
      // Silently fail
    } finally {
      setVoting(false);
    }
  };

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/dream-show/${shareCode}`
      : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = dreamShow
    ? dreamShow.venue
      ? `I want to see ${dreamShow.band.name} at ${dreamShow.venue.name}! Opt in to help make it happen:`
      : dreamShow.venueSize
        ? `I want to see ${dreamShow.band.name} in a ${VENUE_SIZE_CAPACITIES[dreamShow.venueSize] || ""}-person venue! Opt in to help make it happen:`
        : `I want to see ${dreamShow.band.name} live! Opt in to help make it happen:`
    : "";

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-orange-100" />
        <div className="mx-auto mt-6 h-8 w-48 animate-pulse rounded-lg bg-zinc-100" />
        <div className="mx-auto mt-4 h-4 w-64 animate-pulse rounded bg-zinc-100" />
      </div>
    );
  }

  if (error || !dreamShow) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <Music2 className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
        <h1 className="text-2xl font-bold text-zinc-700">
          Dream show not found
        </h1>
        <p className="mt-2 text-zinc-500">
          This dream show may have been removed or the link is invalid.
        </p>
        <Link href="/dream-show">
          <Button className="mt-6 bg-orange-600 hover:bg-orange-700">
            Build Your Own Dream Show
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Success flash */}
      {justVoted && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 p-4">
          <PartyPopper className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="font-medium text-green-800">You&apos;re in!</p>
            <p className="text-sm text-green-600">
              Now share this with more friends to build demand.
            </p>
          </div>
        </div>
      )}

      {/* Dream Show Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8 text-white">
        {/* Decorative */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-600/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-amber-600/10 blur-3xl" />

        <div className="relative">
          {/* Tag */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-3 py-1 text-sm font-medium text-orange-300 ring-1 ring-orange-500/30">
            <Sparkles className="h-3.5 w-3.5" />
            Dream Show
          </div>

          {/* Band + Venue */}
          <h1 className="text-3xl font-bold sm:text-4xl">
            {dreamShow.band.name}
          </h1>
          {dreamShow.venue ? (
            <>
              <div className="mt-2 flex items-center gap-2 text-zinc-300">
                <MapPin className="h-4 w-4 text-orange-400" />
                <span>
                  {dreamShow.venue.name} · {dreamShow.venue.city},{" "}
                  {dreamShow.venue.state}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-400">
                {dreamShow.venue.capacity}-person venue ·{" "}
                {dreamShow.priceTierLabel} per ticket
              </p>
            </>
          ) : dreamShow.venueSize ? (
            <>
              <div className="mt-2 flex items-center gap-2 text-zinc-300">
                <Users className="h-4 w-4 text-orange-400" />
                <span>
                  {dreamShow.venueSizeLabel || dreamShow.venueSize} venue ·{" "}
                  {VENUE_SIZE_CAPACITIES[dreamShow.venueSize] || ""} capacity
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-400">
                {dreamShow.priceTierLabel} per ticket
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">
              {dreamShow.priceTierLabel} per ticket
            </p>
          )}

          {/* Creator */}
          <p className="mt-4 text-sm text-zinc-400">
            Proposed by{" "}
            <span className="font-medium text-orange-300">
              {dreamShow.creator.name || "A fan"}
            </span>
          </p>

          {/* Optional message */}
          {dreamShow.message && (
            <div className="mt-4 rounded-lg bg-white/5 p-3 text-sm text-zinc-300 italic">
              &ldquo;{dreamShow.message}&rdquo;
            </div>
          )}

          {/* Vote count */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-orange-600/20 px-4 py-2">
              <Users className="h-4 w-4 text-orange-400" />
              <span className="text-lg font-bold text-orange-300">
                {dreamShow.voteCount}
              </span>
              <span className="text-sm text-orange-300/80">
                {dreamShow.voteCount === 1 ? "fan" : "fans"} want this
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vote / Opt-In Section */}
      <Card className="mt-6 border-2 border-orange-200">
        <CardContent className="p-6">
          {hasVoted ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold">You&apos;re opted in!</h3>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span className="font-bold text-orange-700">
                    {dreamShow.voteCount}
                  </span>
                  <span className="text-sm text-orange-600">
                    {dreamShow.voteCount === 1 ? "fan" : "fans"} want this
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-500">
                  Share with more friends to build demand!
                </p>
              </div>
              {/* Inline share buttons for voted users */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button
                  variant="outline"
                  onClick={copyLink}
                  className="h-auto flex-col gap-1.5 py-3"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5 text-zinc-500" />
                  )}
                  <span className="text-xs">
                    {copied ? "Copied!" : "Copy Link"}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="h-auto flex-col gap-1.5 py-3"
                >
                  <a
                    href={`sms:&body=${encodeURIComponent(shareText + " " + shareUrl)}`}
                  >
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <span className="text-xs">Text</span>
                  </a>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="h-auto flex-col gap-1.5 py-3"
                >
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`Dream Show: ${dreamShow.band.name}${dreamShow.venue ? ` at ${dreamShow.venue.name}` : ""}`)}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`}
                  >
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span className="text-xs">Email</span>
                  </a>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="h-auto flex-col gap-1.5 py-3"
                >
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="h-5 w-5 text-zinc-700" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span className="text-xs">X / Twitter</span>
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-bold">Would you go to this show?</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Opt in to help build enough demand to make it real
                </p>
              </div>

              {/* Anonymous name/email if not logged in */}
              {!session?.user && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Your name (optional)"
                    value={anonName}
                    onChange={(e) => setAnonName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                  <input
                    type="email"
                    placeholder="Email (we'll notify you if it happens)"
                    value={anonEmail}
                    onChange={(e) => setAnonEmail(e.target.value)}
                    className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              )}

              <Button
                onClick={handleVote}
                disabled={voting}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-base hover:from-orange-700 hover:to-amber-700 h-12"
                size="lg"
              >
                {voting ? (
                  "Opting in..."
                ) : (
                  <>
                    <Heart className="mr-2 h-5 w-5" />
                    I&apos;m In — Count Me!
                  </>
                )}
              </Button>

              {!session?.user && (
                <p className="text-center text-xs text-zinc-400">
                  <Link
                    href="/register"
                    className="text-orange-600 hover:underline"
                  >
                    Create an account
                  </Link>{" "}
                  to track all your dream shows
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Section */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-zinc-700 flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share with friends
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Button
            variant="outline"
            onClick={copyLink}
            className="h-auto flex-col gap-1.5 py-3"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <Copy className="h-5 w-5 text-zinc-500" />
            )}
            <span className="text-xs">
              {copied ? "Copied!" : "Copy Link"}
            </span>
          </Button>

          <Button
            variant="outline"
            asChild
            className="h-auto flex-col gap-1.5 py-3"
          >
            <a
              href={`sms:&body=${encodeURIComponent(shareText + " " + shareUrl)}`}
            >
              <MessageCircle className="h-5 w-5 text-green-600" />
              <span className="text-xs">Text</span>
            </a>
          </Button>

          <Button
            variant="outline"
            asChild
            className="h-auto flex-col gap-1.5 py-3"
          >
            <a
              href={`mailto:?subject=${encodeURIComponent(`Dream Show: ${dreamShow.band.name}${dreamShow.venue ? ` at ${dreamShow.venue.name}` : ""}`)}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`}
            >
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="text-xs">Email</span>
            </a>
          </Button>

          <Button
            variant="outline"
            asChild
            className="h-auto flex-col gap-1.5 py-3"
          >
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className="h-5 w-5 text-zinc-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="text-xs">X / Twitter</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Fans list */}
      {dreamShow.votes.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-zinc-700 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Fans who want this ({dreamShow.voteCount})
          </h3>
          <div className="flex flex-wrap gap-2">
            {dreamShow.votes.map((vote) => (
              <Badge
                key={vote.id}
                className="bg-orange-50 text-orange-700 border border-orange-200"
              >
                {vote.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Build your own CTA */}
      <div className="mt-10 text-center border-t pt-8">
        <p className="text-sm text-zinc-500 mb-3">
          Have your own dream show idea?
        </p>
        <Link href="/dream-show">
          <Button variant="outline">
            <Sparkles className="mr-2 h-4 w-4 text-orange-500" />
            Build Your Own Dream Show
          </Button>
        </Link>
      </div>
    </div>
  );
}
