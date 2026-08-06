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
      const body = await response.json();

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
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="mx-auto max-w-3xl px-5 pb-4 sm:px-8"
      aria-label="Cocokkan template dengan ceritamu"
    >
      <label htmlFor="ai-match-cerita" className="text-sm font-semibold tracking-[0.1em] text-stone-700 uppercase">
        Ceritakan pernikahanmu
      </label>
      <textarea
        id="ai-match-cerita"
        value={cerita}
        onChange={(event) => setCerita(event.target.value)}
        placeholder="Contoh: pernikahan adat Jawa yang hangat, di Yogyakarta"
        rows={3}
        className="mt-2 w-full border border-stone-300 bg-white p-3 text-sm text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || !cerita.trim()}
          className="inline-flex min-h-11 items-center justify-center bg-stone-900 px-5 text-sm font-semibold text-stone-50 transition-colors hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}
