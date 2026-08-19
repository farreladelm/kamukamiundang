import { MusicLibraryManager } from "@/features/admin/music-library-manager";
import { db } from "@/lib/server/db";

export default async function AdminMusicPage() {
  const tracks = await db.musicLibraryTrack.findMany({
    where: { status: { not: "DELETED" } },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, status: true, byteSize: true },
  });
  return <section><p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Music library</p><h1 className="mt-2 font-serif text-3xl">Track kurasi</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">Upload track sekali untuk dipakai pada pilihan musik template di tahap berikutnya.</p><div className="mt-8"><MusicLibraryManager tracks={tracks.map((track) => ({ ...track, byteSize: track.byteSize.toString() }))} /></div></section>;
}
