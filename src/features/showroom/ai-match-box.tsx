"use client";

import { useState, type FormEvent } from "react";
import type { MatchResult } from "@/features/ai-match/match";

export type AiMatchResponse = {
  source: "llm" | "fallback";
  results: MatchResult[];
};

export function AiMatchBox({ onMatched }: { onMatched: (response: AiMatchResponse) => void }) {
  const [cerita, setCerita] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = cerita.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cerita: trimmed }),
      });

      let body: { pesan?: string } = {};
      try {
        body = await response.json();
      } catch {
        // non-JSON response body — fall through to the generic error message
      }

      if (!response.ok) {
        // Pesan dari API sudah dalam Bahasa Indonesia yang ramah; selain itu jangan tampilkan detail teknis.
        setError(body.pesan ?? "Gagal mencocokkan template. Coba lagi sebentar lagi.");
        return;
      }

      onMatched(body as AiMatchResponse);
    } catch {
      // Kesalahan jaringan/parsing tidak boleh menampilkan detail teknis ke pengguna.
      setError("Koneksi terputus. Coba lagi sebentar lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-amber-900/10 bg-white/70 p-4 backdrop-blur sm:p-5">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 marker:content-none">
          <span className="text-sm font-medium text-stone-700">
            Belum yakin pilih yang mana? <span className="text-amber-800">Ceritakan, kami bantu pilihkan.</span>
          </span>
          <span
            aria-hidden="true"
            className="shrink-0 text-lg text-amber-800 transition-transform duration-300 group-open:rotate-45"
          >
            +
          </span>
        </summary>
        <form
          onSubmit={(event) => void handleSubmit(event)}
          aria-label="Cocokkan template dengan ceritamu"
          className="mt-4"
        >
          <label htmlFor="ai-match-cerita" className="sr-only">
            Ceritakan pernikahanmu
          </label>
          <textarea
            id="ai-match-cerita"
            value={cerita}
            onChange={(event) => setCerita(event.target.value)}
            placeholder="Contoh: pernikahan adat Jawa yang hangat, di Yogyakarta"
            rows={2}
            className="w-full rounded-2xl border border-stone-300 bg-white p-4 text-sm text-stone-900 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
          />
          <div className="mt-3 flex items-center gap-4">
            <button
              type="submit"
              disabled={loading || !cerita.trim()}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-stone-900 px-5 text-sm font-semibold text-stone-50 transition-all hover:-translate-y-0.5 hover:bg-amber-900 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40"
            >
              {loading ? "Mencocokkan…" : "Cocokkan template"}
            </button>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
        </form>
      </details>
    </div>
  );
}
