import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Music, Users, Ticket, TrendingUp } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-400">
              <Music className="h-4 w-4" />
              Crowd-powered concert booking
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Demand the shows{" "}
              <span className="text-orange-500">you want to see</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              Tell us which artists you want in your city. When enough fans
              demand it, we book the show. You only pay if it happens.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-orange-600 text-base hover:bg-orange-700"
                >
                  Get Started
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-zinc-600 text-base text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              How Demand A Band works
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              Three simple steps to bring your favorite artists to town.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <div className="relative rounded-2xl border bg-zinc-50 p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold">1. Tell us who</h3>
              <p className="mt-3 text-zinc-600">
                Sign up and tell us which artists you&apos;d love to see live in
                your area, and what you&apos;d be willing to pay.
              </p>
            </div>

            <div className="relative rounded-2xl border bg-zinc-50 p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold">2. We gauge demand</h3>
              <p className="mt-3 text-zinc-600">
                We aggregate demand signals from fans like you. When we see
                enough interest, we work with venues to book the show.
              </p>
            </div>

            <div className="relative rounded-2xl border bg-zinc-50 p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                <Ticket className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold">3. Pledge & go</h3>
              <p className="mt-3 text-zinc-600">
                Pledge for tickets when an event is proposed. You only get
                charged if enough pledges come in and the show is confirmed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dream Show CTA */}
      <section className="bg-gradient-to-r from-orange-600 to-amber-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Dream Show Experience
            </h2>
            <p className="mt-4 text-lg text-orange-100">
              Imagine your favorite stadium act in a 400-seat room. Premium,
              once-in-a-lifetime experiences powered by real fan demand.
            </p>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="mt-8 border-white text-base text-white hover:bg-white hover:text-orange-600"
              >
                Tell us your dream show
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
