import type { Metadata } from "next";
import { consumeMagicLinkAction } from "./actions";

export const metadata: Metadata = {
  referrer: "no-referrer",
};

export default async function MagicLinkConfirmationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  async function submitMagicLink(formData: FormData) {
    "use server";
    await consumeMagicLinkAction(formData);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg items-center px-6 py-12">
      <section className="w-full border border-stone-300 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">Akses privat</p>
        <h1 className="mt-3 font-serif text-4xl text-stone-900">Buka workspace undangan</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          Tautan ini hanya bisa dipakai sekali dan berlaku selama 24 jam.
        </p>
        <form action={submitMagicLink} className="mt-8">
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            className="min-h-12 w-full bg-stone-900 px-5 text-sm font-semibold text-white hover:bg-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
          >
            Lanjut ke workspace
          </button>
        </form>
      </section>
    </main>
  );
}
