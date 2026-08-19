"use client";

import { useRef, useState } from "react";

type Track = { id: string; title: string; status: string; byteSize: string };

export function MusicLibraryManager({ tracks }: { tracks: Track[] }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function upload(formData: FormData) {
    const title = String(formData.get("title") ?? "");
    const file = fileInput.current?.files?.[0];
    if (!file) return setMessage("Pilih file MP3 atau M4A.");
    setPending(true);
    const response = await fetch("/api/admin/music", { method: "POST", headers: { "x-track-title": title }, body: file });
    setPending(false);
    if (!response.ok) return setMessage("Upload gagal. Periksa format, ukuran, dan durasi audio.");
    window.location.reload();
  }

  async function remove(trackId: string) {
    if (!window.confirm("Hapus track ini?")) return;
    const response = await fetch(`/api/admin/music/${trackId}`, { method: "DELETE" });
    if (!response.ok) return setMessage("Track tidak dapat dihapus.");
    window.location.reload();
  }

  return (
    <div className="grid gap-8">
      <form action={upload} className="grid gap-4 border border-stone-300 bg-white p-5">
        <label className="grid gap-2 text-sm font-semibold">Judul track<input required name="title" maxLength={100} className="min-h-11 border border-stone-300 px-3" /></label>
        <label className="grid gap-2 text-sm font-semibold">File MP3 atau M4A<input ref={fileInput} required type="file" accept="audio/mpeg,audio/mp4,.mp3,.m4a" className="text-sm" /></label>
        <button disabled={pending} className="min-h-11 justify-self-start bg-stone-900 px-4 text-xs font-semibold tracking-[0.14em] text-white uppercase disabled:opacity-60">{pending ? "Mengunggah..." : "Upload track"}</button>
        {message && <p role="status" className="text-sm text-red-700">{message}</p>}
      </form>
      <div className="grid gap-3">
        {tracks.length === 0 ? <p className="text-sm text-stone-600">Belum ada track musik.</p> : tracks.map((track) => <article key={track.id} className="flex flex-wrap items-center gap-4 border border-stone-300 bg-white p-4"><div className="mr-auto"><h2 className="font-semibold">{track.title}</h2><p className="text-xs text-stone-500">{track.status} · {Number(track.byteSize).toLocaleString("id-ID")} bytes</p></div><audio controls preload="metadata" src={`/api/admin/music/${track.id}`} /><button type="button" onClick={() => void remove(track.id)} className="text-xs font-semibold underline underline-offset-4">Hapus</button></article>)}
      </div>
    </div>
  );
}
