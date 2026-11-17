# ADR 0001: Backend Fastify + Kysely + MySQL, satu proses API

Tanggal: 18 November 2026. Status: diusulkan, menunggu persetujuan pemilik proyek.

## Konteks

PRD 4.2 merekomendasikan NestJS + Prisma sebagai pilihan awal, dengan catatan "rekomendasi,
bukan kewajiban" dan "audit dukungan versi server, adapter, migration, TLS dan pooling sebelum
dikunci". Repo sudah memakai Zod di `packages/contracts` sebagai satu sumber tipe lintas aplikasi.
AGENTS.md (AS-14) melarang menambah framework tanpa fungsi yang jelas.

## Keputusan

- **Fastify 5** untuk HTTP. Validasi memakai skema Zod yang sama dengan frontend, tanpa lapisan
  DTO kedua (class-validator) dan tanpa decorator/reflect-metadata.
- **Kysely 0.29 + mysql2** untuk akses MySQL. SQL tetap terlihat (penting untuk `FOR UPDATE`,
  unique key idempotensi, dan audit query plan), tipe tabel ditulis eksplisit, tanpa langkah
  generate client atau engine biner. Migrasi berupa berkas TypeScript berurutan, dijalankan
  sebagai langkah deploy terpisah dengan akun migrator.
- **scrypt** dari modul `crypto` Node untuk kata sandi (tanpa dependency native).
- **Satu proses API** melayani `/api/public`, `/api/v1`, dan `/web-admin/api`. Realm sesi
  dipisah di tingkat cookie, tabel sesi, dan guard; CMS API mengabaikan cookie staff.
- Tes integrasi memakai **MySQL 8.4 sungguhan** (biner resmi lewat `mysql-memory-server` di
  lokal, service container di CI), bukan SQLite atau mock.

## Konsekuensi

- Struktur modul dijaga manual (folder `routes`, `domain`, `portal/modules`), bukan oleh
  kerangka NestJS.
- Pemisahan CMS API ke proses dan akun DB sendiri (PRD 4.4, 4.10) belum dilakukan; jalurnya
  sudah terpisah sehingga bisa dipindah tanpa mengubah kontrak.
- Bila pemilik proyek tetap memilih NestJS + Prisma, kontrak (`packages/contracts`), skema SQL,
  dan tes integrasi bisa dipakai ulang; yang diganti lapisan route dan akses data.
