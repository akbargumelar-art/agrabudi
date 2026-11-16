import { cuanProductSchema, type CuanContact, type CuanProduct } from '@agrabudi/contracts';

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function p(
  name: string,
  categoryName: string,
  brandName: string,
  capitalPrice: number,
  sellingPrice: number,
  cashback: number,
  isHot = false,
): CuanProduct {
  return cuanProductSchema.parse({
    id: `${slug(brandName)}-${slug(name)}`,
    name,
    categoryId: slug(categoryName),
    categoryName,
    brandId: slug(brandName),
    brandName,
    capitalPrice,
    sellingPrice,
    cashback,
    isHot,
  });
}

/**
 * DATA CONTOH Kalkulator Cuan untuk adapter mock Outlet dan Portal, disalin dari seed modul cuan repo landing (65 produk).
 * Harga modal, harga jual, dan cashback contoh, bukan harga resmi. Penanda produk
 * unggulan dipilih acak untuk mencoba filter. Di produksi daftar ini diatur Admin.
 */
export const mockCuanProducts: CuanProduct[] = [
  p('Pulsa 5rb', 'Pulsa', 'Simpati', 4800, 5500, 100),
  p('Pulsa 10rb', 'Pulsa', 'Simpati', 9700, 11000, 200),
  p('Pulsa 15rb', 'Pulsa', 'Simpati', 14500, 16000, 200),
  p('Pulsa 20rb', 'Pulsa', 'Simpati', 19500, 21500, 300),
  p('Pulsa 25rb', 'Pulsa', 'Simpati', 24300, 27000, 300),
  p('Pulsa 50rb', 'Pulsa', 'Simpati', 48500, 52000, 500),
  p('Pulsa 100rb', 'Pulsa', 'Simpati', 97000, 103000, 1000),
  p('Pulsa 5rb', 'Pulsa', 'Kartu AS', 4850, 5500, 100),
  p('Pulsa 10rb', 'Pulsa', 'Kartu AS', 9750, 11000, 150),
  p('Pulsa 25rb', 'Pulsa', 'Kartu AS', 24500, 27000, 250),
  p('Pulsa 50rb', 'Pulsa', 'Kartu AS', 48800, 52000, 400),
  p('Pulsa 100rb', 'Pulsa', 'Kartu AS', 97500, 103000, 800),
  p('Pulsa 10rb', 'Pulsa', 'byU', 9600, 11000, 250),
  p('Pulsa 20rb', 'Pulsa', 'byU', 19200, 21500, 400),
  p('Pulsa 50rb', 'Pulsa', 'byU', 48000, 52000, 700),
  p('Internet 1GB/3 Hari', 'Paket Internet', 'Simpati', 8500, 12000, 300),
  p('Internet 2GB/7 Hari', 'Paket Internet', 'Simpati', 15000, 20000, 500),
  p('Internet 5GB/30 Hari', 'Paket Internet', 'Simpati', 28000, 35000, 800),
  p('Internet 10GB/30 Hari', 'Paket Internet', 'Simpati', 45000, 55000, 1200, true),
  p('Internet 15GB/30 Hari', 'Paket Internet', 'Simpati', 60000, 75000, 1500),
  p('Internet 25GB/30 Hari', 'Paket Internet', 'Simpati', 85000, 100000, 2000),
  p('Internet 50GB/30 Hari', 'Paket Internet', 'Simpati', 130000, 155000, 3000),
  p('byU 1GB Harian', 'Paket Internet', 'byU', 5500, 8000, 200),
  p('byU 3GB/7 Hari', 'Paket Internet', 'byU', 12000, 17000, 400),
  p('byU 8GB/30 Hari', 'Paket Internet', 'byU', 35000, 45000, 1000, true),
  p('byU 15GB/30 Hari', 'Paket Internet', 'byU', 55000, 70000, 1500),
  p('byU 30GB/30 Hari', 'Paket Internet', 'byU', 90000, 110000, 2500),
  p('Internet 2GB/7 Hari', 'Paket Internet', 'Kartu AS', 14500, 19000, 400),
  p('Internet 6GB/30 Hari', 'Paket Internet', 'Kartu AS', 32000, 40000, 900),
  p('Internet 12GB/30 Hari', 'Paket Internet', 'Kartu AS', 50000, 62000, 1300),
  p('Top Up OVO 25rb', 'Paket Digital', 'e-Wallet', 24500, 26000, 200),
  p('Top Up OVO 50rb', 'Paket Digital', 'e-Wallet', 49000, 51500, 400),
  p('Top Up OVO 100rb', 'Paket Digital', 'e-Wallet', 98000, 102000, 700),
  p('Top Up GoPay 25rb', 'Paket Digital', 'e-Wallet', 24800, 26000, 150),
  p('Top Up GoPay 50rb', 'Paket Digital', 'e-Wallet', 49200, 51500, 350),
  p('Top Up GoPay 100rb', 'Paket Digital', 'e-Wallet', 98500, 102000, 600),
  p('Top Up DANA 50rb', 'Paket Digital', 'e-Wallet', 49100, 51500, 300),
  p('Top Up DANA 100rb', 'Paket Digital', 'e-Wallet', 98200, 102000, 650),
  p('Top Up ShopeePay 50rb', 'Paket Digital', 'e-Wallet', 49300, 51500, 250),
  p('Top Up ShopeePay 100rb', 'Paket Digital', 'e-Wallet', 98400, 102000, 500),
  p('Token PLN 20rb', 'Paket Digital', 'PPOB', 19500, 21000, 200),
  p('Token PLN 50rb', 'Paket Digital', 'PPOB', 49000, 51500, 500),
  p('Token PLN 100rb', 'Paket Digital', 'PPOB', 98000, 102000, 800),
  p('BPJS Kesehatan', 'Paket Digital', 'PPOB', 0, 2500, 500),
  p('Tagihan Listrik', 'Paket Digital', 'PPOB', 0, 3000, 600),
  p('Roaming ASEAN 3 Hari 1GB', 'Paket Roaming', 'Simpati', 75000, 95000, 2000),
  p('Roaming ASEAN 7 Hari 3GB', 'Paket Roaming', 'Simpati', 150000, 185000, 4000),
  p('Roaming Global 3 Hari 500MB', 'Paket Roaming', 'Simpati', 120000, 150000, 3000),
  p('Roaming Global 7 Hari 2GB', 'Paket Roaming', 'Simpati', 250000, 300000, 5000),
  p('Voucher Fisik 10rb', 'Inject Voucher Fisik', 'Simpati', 9200, 10500, 200),
  p('Voucher Fisik 25rb', 'Inject Voucher Fisik', 'Simpati', 23000, 26000, 400, true),
  p('Voucher Fisik 50rb', 'Inject Voucher Fisik', 'Simpati', 46000, 52000, 800),
  p('Voucher Fisik 100rb', 'Inject Voucher Fisik', 'Simpati', 92000, 103000, 1500),
  p('Voucher Fisik 10rb', 'Inject Voucher Fisik', 'Kartu AS', 9300, 10500, 150),
  p('Voucher Fisik 25rb', 'Inject Voucher Fisik', 'Kartu AS', 23200, 26000, 350, true),
  p('Voucher Fisik 50rb', 'Inject Voucher Fisik', 'Kartu AS', 46500, 52000, 700),
  p('Perdana Simpati 5GB', 'Aktivasi Perdana', 'Simpati', 15000, 25000, 1500),
  p('Perdana Simpati 10GB', 'Aktivasi Perdana', 'Simpati', 25000, 40000, 2500, true),
  p('Perdana Simpati 20GB', 'Aktivasi Perdana', 'Simpati', 40000, 60000, 3000),
  p('Perdana byU 6GB', 'Aktivasi Perdana', 'byU', 12000, 20000, 1200),
  p('Perdana byU 12GB', 'Aktivasi Perdana', 'byU', 20000, 35000, 2000, true),
  p('Perdana byU 25GB', 'Aktivasi Perdana', 'byU', 35000, 55000, 3000),
  p('Perdana Orbit 10GB', 'Aktivasi Perdana', 'Telkomsel Orbit', 30000, 50000, 3000),
  p('Perdana Orbit 25GB', 'Aktivasi Perdana', 'Telkomsel Orbit', 50000, 80000, 5000, true),
  p('Perdana Orbit 50GB', 'Aktivasi Perdana', 'Telkomsel Orbit', 80000, 120000, 7000),
];

/** Nomor contoh dari rentang yang tidak dipakai. Nomor asli diatur Admin Web. */
export const mockCuanContact: CuanContact = {
  whatsappLabel: '+62 800-0000-0000 (contoh)',
  whatsappUrl: 'https://wa.me/6280000000000',
  greeting: 'Halo Kak, saya ingin daftar DigiposAja.',
};
