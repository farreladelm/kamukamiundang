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
        throw new Error(body.pesan ?? "Gagal mencocokkan template.");
      }

      onMatched(body as AiMatchResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-4 sm:px-8">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        aria-label="Cocokkan template dengan ceritamu"
        className="rounded-3xl border border-amber-900/10 bg-white/70 p-6 shadow-[0_25px_50px_-35px_rgba(120,53,15,0.4)] backdrop-blur sm:p-8"
      >
        <p className="text-xs font-semibold tracking-[0.18em] text-amber-800 uppercase">Bantu kami memilihkan</p>
        <label htmlFor="ai-match-cerita" className="mt-2 block font-serif text-2xl text-stone-900">
          Ceritakan pernikahanmu
        </label>
        <textarea
          id="ai-match-cerita"
          value={cerita}
          onChange={(event) => setCerita(event.target.value)}
          placeholder="Contoh: pernikahan adat Jawa yang hangat, di Yogyakarta"
          rows={3}
          className="mt-4 w-full rounded-2xl border border-stone-300 bg-white p-4 text-sm text-stone-900 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
        />
        <div className="mt-4 flex items-center gap-4">
          <button
            type="submit"
            disabled={loading || !cerita.trim()}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-stone-900 px-6 text-sm font-semibold text-stone-50 transition-all hover:-translate-y-0.5 hover:bg-amber-900 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40"
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
    </div>
  );
}
