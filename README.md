# Agrabudi.id

Monorepo tiga website PT Agrabudi Komunika. Pengaturan website (peran Admin Web) ada di dalam Portal, di bawah `/web-admin`.
Acuan: `prd.md` v2.0 dan `rancangan-build.md` di Project "Portal Agrabudi.id". Aturan kerja agen coding: `AGENTS.md`.
Status tiap fitur: `docs/status.md`.

| Aplikasi | Folder            | Stack        | Tujuan deploy      |
| -------- | ----------------- | ------------ | ------------------ |
| Publik   | `apps/public-web` | Next.js      | agrabudi.id        |
| Outlet   | `apps/outlet-web` | Vite + React | outlet.agrabudi.id |
| Portal   | `apps/portal-web` | Vite + React | portal.agrabudi.id |

Paket bersama: `packages/ui` (token, font, AppSwitcher, MainNav, BottomNav, primitive), `packages/contracts`
(skema Zod dan tipe data), `packages/config` (tsconfig, eslint).

## Menjalankan

Butuh Node 22 dan pnpm 10.

```bash
pnpm install
pnpm dev          # Publik :3000, Outlet :3001, Portal :3002
pnpm lint
pnpm typecheck
pnpm test         # unit test (Vitest)
pnpm e2e          # Playwright di 360, 390, 768, 1024, 1440 px terhadap hasil build; butuh Google Chrome
```

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
dan halaman menampilkan pesan "layanan belum terhubung" sampai backend (M2 dan seterusnya) tersedia.
