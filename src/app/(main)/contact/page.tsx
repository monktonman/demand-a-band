import { Mail, MapPin, Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-100">
          <Mail className="h-7 w-7 text-orange-600" />
        </div>
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="mt-3 text-lg text-zinc-500">
          Have a question, suggestion, or just want to say hi? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col items-center p-8 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
              <Mail className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold">Email Us</h2>
            <p className="mt-2 text-sm text-zinc-500">
              For general inquiries, partnerships, or feedback
            </p>
            <a
              href="mailto:hello@demanda.band"
              className="mt-4 text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              hello@demanda.band
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center p-8 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
              <Music className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold">Venue Partners</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Interested in hosting shows through Demand A Band?
            </p>
            <a
              href="mailto:venues@demanda.band"
              className="mt-4 text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              venues@demanda.band
            </a>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 rounded-xl border bg-zinc-50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
          <MapPin className="h-5 w-5 text-orange-600" />
        </div>
        <p className="font-semibold text-zinc-700">Based in Baltimore, MD</p>
        <p className="mt-1 text-sm text-zinc-500">
          Building the future of live music, one show at a time.
        </p>
      </div>
    </div>
  );
}
