# Agrabudi.id

Monorepo tiga website PT Agrabudi Komunika. Pengaturan website (peran Admin Web) ada di dalam Portal, di bawah `/web-admin`.
Acuan: `prd.md` v2.0 dan `rancangan-build.md` di Project "Portal Agrabudi.id". Aturan kerja agen coding: `AGENTS.md`.
Status tiap fitur: `docs/status.md`.

| Aplikasi | Folder            | Stack                    | Tujuan deploy                                                 |
| -------- | ----------------- | ------------------------ | ------------------------------------------------------------- |
| Publik   | `apps/public-web` | Next.js                  | agrabudi.id                                                   |
| Outlet   | `apps/outlet-web` | Vite + React             | outlet.agrabudi.id                                            |
| Portal   | `apps/portal-web` | Vite + React             | portal.agrabudi.id                                            |
| API      | `apps/api`        | Fastify + Kysely + MySQL | di belakang Nginx: `/api/public`, `/api/v1`, `/web-admin/api` |

Paket bersama: `packages/ui` (token, font, AppSwitcher, MainNav, BottomNav, primitive), `packages/contracts`
(skema Zod dan tipe data, juga `@agrabudi/contracts/http` untuk klien API frontend), `packages/config` (tsconfig, eslint).
Infrastruktur: `infra/` (Dockerfile, Nginx tiga host, compose). Runbook deploy: `docs/deploy.md`. Pilihan stack: `docs/adr`.

## Menjalankan

Butuh Node 22 dan pnpm 10.

```bash
pnpm install
pnpm dev          # Publik :3000, Outlet :3001, Portal :3002, API :4000
pnpm lint
pnpm typecheck
pnpm test         # unit test (Vitest)
pnpm e2e          # Playwright di 360, 390, 768, 1024, 1440 px terhadap hasil build; butuh Google Chrome
```

`pnpm test` untuk `apps/api` menjalankan tes integrasi terhadap MySQL 8.4 sungguhan: bila `TEST_DB_HOST` tidak diisi,
biner MySQL resmi diunduh sekali (sekitar 1 menit) lalu di-cache.

`pnpm build` mewajibkan variabel di `.env.example` terisi. Build digagalkan bila URL aplikasi atau sumber data
tidak diisi, supaya tidak ada tautan produksi atau data contoh yang ikut tanpa sengaja.

## Akun contoh (mode mock)

Kata sandi semua akun contoh: `contoh123`. Hanya ada di build `mock`.

| Aplikasi | Username / ID                         | Peran                                      |
| -------- | ------------------------------------- | ------------------------------------------ |
| Portal   | `adminweb`                            | Admin Web (menu Website)                   |
| Portal   | `adminmobile`                         | Admin Mobile, juga izin Karir dan Pengguna |
| Portal   | `adminhousehold`                      | Admin Household                            |
| Portal   | `manager`                             | Manager, lihat seluruh cluster             |
| Portal   | `spvmobile`, `spvhousehold`           | Supervisor, lihat tim sendiri              |
| Portal   | `sfmobile`, `sfhousehold`, `sfdirect` | Salesforce, lihat data sendiri             |
| Outlet   | `CONTOH001`, `CONTOH002`, `CONTOH003` | Mitra outlet (login ID Digipos)            |

## Sumber data

`*_DATA_SOURCE=mock` memakai mock adapter di folder `src/data/mock` tiap aplikasi. Semua data contoh membawa
`meta.source = "mock"` dan ditandai "Data contoh" di layar. Dengan `*_DATA_SOURCE=api`, mock tidak ikut ke bundle
dan aplikasi membaca `apps/api`. Bila API gagal, halaman menampilkan gangguan, bukan data contoh. Menu Portal yang
belum punya kamus data tampil "belum tersambung".

## Full-stack lokal (mode `api`)

1. Siapkan MySQL 8 lokal dan database kosong. Tulis `DB_USER`/`DB_PASSWORD`/`DB_NAME` di `apps/api/.env.local`
   (tidak masuk git; nilai bawaan lain ada di `apps/api/.env.development`).
2. `pnpm --filter @agrabudi/api migrate`
3. Buat akun: `pnpm --filter @agrabudi/api account:create -- --realm staff --username adminweb --name "Admin Web" --role web_admin --scope site`
   (kata sandi diketik, minimal 12 karakter; lihat `docs/deploy.md` untuk peran lain dan akun Outlet).
4. Set `VITE_DATA_SOURCE=api` dan `NEXT_PUBLIC_DATA_SOURCE=api` di `.env.local` tiap aplikasi web, plus
   `API_INTERNAL_URL=http://localhost:4000` untuk Publik, lalu `pnpm dev`. Vite dan Next meneruskan `/api` ke port 4000.
