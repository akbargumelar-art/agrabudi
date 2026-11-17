# Runbook deploy Agrabudi.id

Untuk: pengelola teknis yang menyiapkan staging atau produksi. Acuan: PRD 4.8 s.d. 4.15.
Status: **belum pernah dijalankan di server**. Image Docker belum dibangun di mesin mana pun
(lingkungan pengembangan tidak punya Docker); CI menyiapkan job build image dan `nginx -t`.
Jalankan dulu di staging dan catat hasilnya di bawah sebelum produksi.

## Topologi

```
Internet ─443─> terminator TLS yang sudah ada di server
                 └─> 127.0.0.1:WEB_PORT ─> web (Nginx)
                                         ├─ agrabudi.id        -> public-web (Next.js) + /api/public -> api
                                         ├─ outlet.agrabudi.id -> bundel Outlet       + /api/v1/outlet -> api
                                         └─ portal.agrabudi.id -> bundel Portal       + /api/v1, /web-admin/api -> api
api ──jaringan privat/VPN + TLS──> MySQL (server terpisah)
```

- API tidak membuka port ke Internet. Nginx hanya mendengar di loopback.
- Berkas: volume `media-public` (banner, aset website; dilayani Nginx di `/media/`) dan
  `files-private` (CV; hanya keluar lewat API berizin). Keduanya masuk cakupan backup.
- MySQL tidak ada di compose produksi. `compose.local.yml` hanya untuk uji coba satu mesin.

## Prasyarat (keputusan terbuka T-1)

1. Server aplikasi Linux dengan Docker Engine + Compose v2.24 atau lebih baru.
2. Server MySQL 8.0.16+ (CHECK constraint ditegakkan; target 8.4 LTS) yang bisa dijangkau
   dari server aplikasi lewat IP privat/VPN. Ukur RTT; target < 10 ms.
3. Sertifikat CA MySQL di server aplikasi, mis. `/etc/agrabudi/db-ca.pem`.
4. Port loopback untuk Nginx yang belum dipakai aplikasi lain. **Jangan mengubah port,
   domain, atau konfigurasi aplikasi lama.**
5. DNS tiga host mengarah ke server aplikasi, sertifikat TLS di terminator yang ada.

## 1. Database dan akun (sekali, oleh DBA)

Nama schema dan akun di bawah contoh dari PRD 4.10; sesuaikan. Kata sandi dibuat di server,
tidak ditulis di repo atau tiket.

```sql
CREATE DATABASE agrabudi_core CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migrator: DDL, hanya dipakai saat deploy.
CREATE USER 'abk_migrator'@'<ip-server-aplikasi>' IDENTIFIED BY '<rahasia>' REQUIRE SSL;
GRANT CREATE, ALTER, DROP, INDEX, REFERENCES, SELECT, INSERT, UPDATE, DELETE
  ON agrabudi_core.* TO 'abk_migrator'@'<ip-server-aplikasi>';

-- Runtime API: DML saja, tanpa DDL.
CREATE USER 'abk_api_runtime'@'<ip-server-aplikasi>' IDENTIFIED BY '<rahasia>' REQUIRE SSL;
GRANT SELECT, INSERT, UPDATE, DELETE ON agrabudi_core.* TO 'abk_api_runtime'@'<ip-server-aplikasi>';
```

Budget koneksi: `DB_POOL_MAX` (bawaan 10) x jumlah proses API, ditambah migrator sesaat.
Bandingkan dengan `max_connections` dan beban aplikasi lain di server MySQL yang sama.

## 2. Konfigurasi di server

```bash
cd infra/compose
cp ../env/stack.env.example stack.env      # RELEASE, URL, host, port loopback
cp ../env/api.env.example api.env          # akun abk_api_runtime
cp ../env/migrate.env.example migrate.env  # akun abk_migrator
chmod 600 api.env migrate.env
```

`*.env` dan `*.pem` di folder ini diabaikan git. API menolak start bila konfigurasi tidak sah,
mis. `NODE_ENV=production` tanpa cookie Secure, atau `DB_TLS=verify` tanpa berkas CA.

## 3. Rilis

```bash
export RELEASE=$(git rev-parse --short HEAD)   # sama dengan RELEASE di stack.env
docker compose --env-file stack.env build
# Backup terverifikasi sebelum migrasi berisiko (PRD 4.12).
docker compose --env-file stack.env --profile migrate run --rm migrate
docker compose --env-file stack.env up -d
```

Migrasi bersifat maju (forward-fix). Migrasi yang sudah jalan di staging/produksi tidak diubah;
perubahan skema berikutnya ditambahkan sebagai berkas baru di `apps/api/src/db/migrations`.

## 4. Akun pertama

Tidak ada akun atau data bawaan. Buat akun lewat CLI di dalam container; kata sandi dibaca dari
stdin (minimal 12 karakter), tidak lewat argumen.

```bash
docker compose --env-file stack.env exec api node dist/create-account.js \
  --realm staff --username adminweb --name "Nama Admin Web" --role web_admin --scope site
docker compose --env-file stack.env exec api node dist/create-account.js \
  --realm staff --username <user> --name "<Nama>" --role admin --unit mobile --scope cluster \
  --permission career.manage
docker compose --env-file stack.env exec api node dist/create-account.js \
  --realm outlet --digipos <ID Digipos> --outlet "<Nama outlet>" --owner "<Pemilik>" --registered 2026-11-01
```

Peran dan izin mengikuti baseline usulan PRD 2.5 yang belum disahkan. Menu User Management
di Portal belum tersambung; akun berikutnya juga dibuat lewat CLI ini.

## 5. Pemeriksaan pasca-deploy

| Cek               | Cara                                                                                                          | Harapan                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| API hidup         | `docker compose exec api node -e "fetch('http://127.0.0.1:4000/readyz').then(r=>r.text()).then(console.log)"` | `{"status":"ok"}`                                      |
| Nginx             | `curl -s -H "Host: <PUBLIC_HOST>" http://127.0.0.1:$WEB_PORT/kontak -o /dev/null -w "%{http_code}"`           | 200                                                    |
| Routing audiens   | `curl -s -H "Host: <OUTLET_HOST>" http://127.0.0.1:$WEB_PORT/api/v1/auth/me -w "%{http_code}"`                | 404 (API staff tidak dibuka di host Outlet)            |
| Login             | Masuk Portal dengan akun pertama lewat HTTPS                                                                  | Cookie `__Host-abk_staff` atau `__Secure-abk_webadmin` |
| Data kosong jujur | Buka agrabudi.id/tentang sebelum profil diisi                                                                 | "Informasi ini belum diterbitkan", bukan isi contoh    |
| Order             | Buat paket Terbit di Portal, login Outlet, periksa harga final, ajukan                                        | Order Diajukan, tampil di Portal Admin                 |

## 6. Backup dan pemulihan (PRD 4.12)

Belum diotomasi di repo ini. Minimal sebelum produksi:

- Full backup MySQL tiap malam + binary log bila RPO 15 menit disetujui; simpan di luar server DB.
- Salinan volume `files-private` dan `media-public` (mis. `docker run --rm -v agrabudi_files-private:/d alpine tar czf - /d`).
- Uji pulihkan di lingkungan terpisah minimal bulanan: login, order sampel, unduh CV berizin.

## 7. Rollback

Rollback aplikasi = jalankan ulang `up -d` dengan `RELEASE` sebelumnya. Skema tidak di-rollback
otomatis; migrasi dirancang aditif supaya image lama tetap jalan di skema baru. Sebelum rollback,
periksa order yang sudah commit sejak rilis (PRD 4.15 butir 9).
