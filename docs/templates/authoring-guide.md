# Template Authoring Guide

Panduan ini berlaku untuk renderer invitation di `src/features/templates`. Template harus terasa seperti undangan digital sungguhan: mobile-width, dibuka dari cover, dibaca vertikal, dan tetap nyaman pada desktop.

## Struktur Standar

Gunakan urutan ini sebagai default, bukan aturan kaku:

1. Cover: label wedding, nama pasangan, nama tamu, tombol buka.
2. Hero pembuka: nama pasangan, tanggal, dan opening copy.
3. Quote atau doa pembuka.
4. Profil mempelai: nama, orang tua, Instagram.
5. Save the date: tanggal dan countdown.
6. Rangkaian acara: tanggal, waktu, venue, alamat, Maps.
7. RSVP, bila pasangan memerlukannya.
8. Live stream, bila tersedia.
9. Gallery dan video, bila tersedia.
10. Love story, bila tersedia.
11. Wedding gift: rekening dan alamat kado fisik.
12. Ucapan dan doa.
13. Quote atau closing message.
14. Footer branding Undango.

Section opsional tidak boleh meninggalkan wrapper kosong, spacing kosong, atau heading tanpa isi. Data optional `undefined` berarti section tidak dirender.

## Contract Content

`TemplateContentViewModel` adalah kontrak renderer. Renderer hanya menerima `content` dan `palette`; jangan membaca database, URL request, atau environment variable dari template.

Runtime manifest di source code hanya memiliki identity/version, content schema, renderer, capabilities, palette contract, demo content, dan pilihan preview yang mengaktifkan behavior code/CSS. Nama publik, slug, kategori, deskripsi marketing, harga, thumbnail marketing, urutan, dan lifecycle katalog dimiliki PostgreSQL sesuai ADR-0007. Renderer tidak boleh membaca atau menyediakan fallback untuk metadata bisnis tersebut.

Field inti:

- `cover`, `couple`, `profiles`, `opening`, `quote`.
- `eventDate`, `eventDateIso`, `events`.
- `closing`, `branding`.

Field optional:

- `gallery`, `story`, `gift`, `rsvp`, `wishes`.

Capability metadata harus mencerminkan kemampuan template. Capability tidak menggantikan pengecekan data: template bisa mendukung gallery tetapi demo atau invitation tertentu boleh tidak mengaktifkannya.

## Layout Rules

- Invitation utama selalu maksimal sekitar `30rem`.
- Desktop memakai dua area: panel foto/informasi di kiri dan invitation rail di kanan.
- Mobile menyembunyikan panel kiri dan memakai invitation selebar viewport.
- Section internal memakai satu kolom sebagai default. Jangan memakai breakpoint viewport untuk memaksa dua kolom di rail sempit.
- Semua section harus tetap terbaca pada lebar 360px.
- Informasi tidak boleh hanya muncul ketika hover.
- Link eksternal memakai `target="_blank"` dan `rel="noreferrer"`.

## Cover dan Interaksi

`InvitationExperience` menangani perilaku bersama:

- Cover memakai `min-height: 100dvh`.
- Konten dikunci sampai tombol buka ditekan.
- Setelah dibuka, fokus dipindahkan ke main invitation.
- Audio tidak boleh autoplay tanpa interaksi pengguna.
- Animasi harus tetap informatif ketika `prefers-reduced-motion` aktif.

Jangan membuat cover lock baru di masing-masing renderer. Perbedaan template cukup diwujudkan melalui palette, variant class, ornamen, tipografi, dan komposisi section.

## Foto dan Placeholder

Demo saat ini memakai placeholder CSS bertipe `TemplatePhoto`. Saat aset nyata tersedia:

- Gunakan aset berlisensi dan catat sumbernya di `docs/templates/licenses.md`.
- Simpan `alt` yang menjelaskan isi foto.
- Pertahankan rasio dan ukuran intrinsik untuk mencegah layout shift.
- Above-the-fold photo boleh diprioritaskan; gallery tetap lazy-load.
- Jangan hotlink aset referensi atau aset vendor lain.

## Countdown dan Tanggal

- Simpan target dalam `eventDateIso` dengan offset timezone eksplisit.
- Simpan `eventDate` untuk display copy.
- Jangan menghitung countdown dari string display.
- Target yang sudah lewat menampilkan nol, bukan angka negatif.

## RSVP, Gift, dan Ucapan

UI demo boleh memakai state lokal, tetapi tidak boleh berpura-pura menyimpan data ke server. Endpoint production akan mengikuti task `MVP-27` dan `MVP-28`.

- RSVP harus punya label, jumlah tamu terbatas, dan pilihan kehadiran.
- Ucapan menggunakan plain text React rendering, bukan `innerHTML`.
- Nomor rekening hanya data informasional; tombol copy memberi feedback aksesibel.
- Tidak menyimpan atau mengirim data tamu ke analytics.

## Membuat Template Baru

1. Tambahkan folder `src/features/templates/<template>/v1/`.
2. Buat `definition.ts` dengan `templateKey`, `templateVersion`, `contentSchemaVersion`, content validation schema, palette, capabilities, demo content, dan renderer.
3. Buat renderer tipis yang menggunakan `InvitationExperience` atau komposisi shared section yang setara.
4. Pilih section optional secara eksplisit melalui demo data.
5. Daftarkan definition di `registry.tsx`.
6. Jalankan reconciliation catalog untuk membuat metadata `DRAFT`; jangan menambahkan metadata bisnis sebagai runtime authority.
7. Lengkapi metadata melalui admin dan buat visible hanya setelah exact runtime/catalog validation lulus.
8. Tambahkan renderer test untuk nama demo, tanggal, event, Maps, dan optional section.
9. Tambahkan lisensi untuk semua asset non-CSS.
10. Jalankan drift check, `pnpm lint`, `pnpm typecheck`, `pnpm test`, dan `pnpm build`.

## Versioning

Breaking content atau visual interpretation harus membuat `templateVersion` baru; perubahan bentuk content juga menaikkan `contentSchemaVersion`. Versi yang sudah direferensikan order, invitation, atau published snapshot tidak boleh dihapus atau diganti renderernya. Perubahan saat ini memakai template v1 dengan `contentSchemaVersion: 2` karena repository belum memiliki published invitation aktif; setelah production mereferensikan v1, pertahankan entry/renderer v1 dan tambahkan entry/renderer v2 untuk perubahan breaking.

## Checklist Review

- Cover mengunci scroll dan bisa dibuka keyboard.
- Nama tamu aman ditampilkan sebagai text biasa.
- Main content dapat dibaca tanpa animasi atau audio.
- Section optional benar-benar hilang saat data tidak ada.
- Tidak ada horizontal overflow pada 360px.
- Maps, Instagram, dan tombol copy dapat diakses keyboard.
- Form memiliki label dan status sukses.
- Placeholder atau foto memiliki alternative text.
- Renderer tidak memiliki database access.
- Runtime manifest tidak menjadi fallback metadata bisnis.
- Exact runtime/catalog pair dan reference scan lulus sebelum visible/deploy.
- Test dan build lulus.
