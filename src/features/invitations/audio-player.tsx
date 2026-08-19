"use client";

import { useRef, useState } from "react";

export function AudioPlayer({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
      setError(false);
    } catch {
      setError(true);
    }
  }

  return (
    <div className="flex items-center gap-3" aria-label={`Musik: ${title}`}>
      <audio ref={audioRef} src={src} preload="metadata" playsInline onEnded={() => setPlaying(false)} onError={() => setError(true)} />
      <button type="button" aria-pressed={playing} onClick={() => void togglePlayback()} className="min-h-11 border px-4 text-xs font-semibold tracking-[0.14em] uppercase">
        {playing ? `Jeda ${title}` : `Putar ${title}`}
      </button>
      {error && <p role="status" className="text-sm">Musik tidak dapat diputar.</p>}
    </div>
  );
}
