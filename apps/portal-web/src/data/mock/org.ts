import type { BusinessUnit } from '@agrabudi/contracts';

/**
 * ORGANISASI CONTOH: tim, salesforce, outlet, dan pelanggan rekaan untuk mencoba Portal.
 * Nama orang dan toko bukan data sungguhan. Nama kecamatan dipakai apa adanya supaya
 * filter wilayah terasa wajar.
 */
export type Person = {
  id: string;
  name: string;
  /** Username akun contoh bila orang ini bisa login. */
  username: string | null;
  role: 'admin' | 'manager' | 'supervisor' | 'salesforce' | 'web_admin';
  unit: BusinessUnit | null;
  teamId: string | null;
};

export type Team = { id: string; name: string; unit: BusinessUnit; supervisorId: string };

export const teams: Team[] = [
  { id: 'tim-mobile-a', name: 'Tim Mobile A', unit: 'mobile', supervisorId: 'p-spv-mobile' },
  { id: 'tim-mobile-b', name: 'Tim Mobile B', unit: 'mobile', supervisorId: 'p-spv-mobile-2' },
  // Direct Sales belum punya supervisor sendiri; sementara di bawah Supervisor Mobile.
  { id: 'tim-direct', name: 'Tim Direct Sales', unit: 'direct_sales', supervisorId: 'p-spv-mobile' },
  { id: 'tim-hh-a', name: 'Tim Household A', unit: 'household', supervisorId: 'p-spv-household' },
  { id: 'tim-hh-b', name: 'Tim Household B', unit: 'household', supervisorId: 'p-spv-household-2' },
];

export const people: Person[] = [
  { id: 'p-adminweb', name: 'Laras Wulandari', username: 'adminweb', role: 'web_admin', unit: null, teamId: null },
  { id: 'p-admin-mobile', name: 'Teguh Santoso', username: 'adminmobile', role: 'admin', unit: 'mobile', teamId: null },
  { id: 'p-admin-household', name: 'Maya Kartika', username: 'adminhousehold', role: 'admin', unit: 'household', teamId: null },
  { id: 'p-manager', name: 'Bambang Suryadi', username: 'manager', role: 'manager', unit: null, teamId: null },
  { id: 'p-spv-mobile', name: 'Yusuf Hidayat', username: 'spvmobile', role: 'supervisor', unit: 'mobile', teamId: 'tim-mobile-a' },
  { id: 'p-spv-mobile-2', name: 'Bayu Firmansyah', username: null, role: 'supervisor', unit: 'mobile', teamId: 'tim-mobile-b' },
  { id: 'p-spv-household', name: 'Eko Prasetyo', username: 'spvhousehold', role: 'supervisor', unit: 'household', teamId: 'tim-hh-a' },
  { id: 'p-spv-household-2', name: 'Lina Marlina', username: null, role: 'supervisor', unit: 'household', teamId: 'tim-hh-b' },
  { id: 'p-sf-mobile', name: 'Rizky Pratama', username: 'sfmobile', role: 'salesforce', unit: 'mobile', teamId: 'tim-mobile-a' },
  { id: 'p-sf-m2', name: 'Dimas Saputra', username: null, role: 'salesforce', unit: 'mobile', teamId: 'tim-mobile-a' },
  { id: 'p-sf-m3', name: 'Fajar Nugroho', username: null, role: 'salesforce', unit: 'mobile', teamId: 'tim-mobile-a' },
  { id: 'p-sf-m4', name: 'Ilham Ramadhan', username: null, role: 'salesforce', unit: 'mobile', teamId: 'tim-mobile-b' },
  { id: 'p-sf-m5', name: 'Wahyu Kurniawan', username: null, role: 'salesforce', unit: 'mobile', teamId: 'tim-mobile-b' },
  { id: 'p-sf-m6', name: 'Arif Budiman', username: null, role: 'salesforce', unit: 'mobile', teamId: 'tim-mobile-b' },
  { id: 'p-sf-direct', name: 'Nadia Putri', username: 'sfdirect', role: 'salesforce', unit: 'direct_sales', teamId: 'tim-direct' },
  { id: 'p-sf-d2', name: 'Rina Anggraini', username: null, role: 'salesforce', unit: 'direct_sales', teamId: 'tim-direct' },
  { id: 'p-sf-household', name: 'Dewi Lestari', username: 'sfhousehold', role: 'salesforce', unit: 'household', teamId: 'tim-hh-a' },
  { id: 'p-sf-h2', name: 'Putri Ayu', username: null, role: 'salesforce', unit: 'household', teamId: 'tim-hh-a' },
  { id: 'p-sf-h3', name: 'Andika Saputra', username: null, role: 'salesforce', unit: 'household', teamId: 'tim-hh-a' },
  { id: 'p-sf-h4', name: 'Rahmat Hidayat', username: null, role: 'salesforce', unit: 'household', teamId: 'tim-hh-b' },
  { id: 'p-sf-h5', name: 'Sari Wulandari', username: null, role: 'salesforce', unit: 'household', teamId: 'tim-hh-b' },
];

export function personById(id: string | null): Person | undefined {
  return people.find((person) => person.id === id);
}

export function personByUsername(username: string): Person | undefined {
  return people.find((person) => person.username === username);
}

export function salesforceOf(unit: BusinessUnit): Person[] {
  return people.filter((person) => person.role === 'salesforce' && person.unit === unit);
}

export function teamName(teamId: string | null): string {
  return teams.find((team) => team.id === teamId)?.name ?? '-';
}

export type Outlet = {
  id: string;
  digiposId: string;
  name: string;
  owner: string;
  district: string;
  tap: string;
  salesforceId: string;
};

const outletNames = [
  'Cell Berkah Jaya', 'Toko Pulsa Sinar', 'Mitra Cell 88', 'Barokah Phone', 'Sumber Rejeki Cell',
  'Putra Jaya Ponsel', 'Anugrah Cell', 'Bintang Pulsa', 'Cahaya Cell', 'Delta Phone',
  'Fortuna Cell', 'Gemilang Pulsa', 'Harapan Jaya Cell', 'Insan Ponsel', 'Jaya Abadi Cell',
  'Kurnia Pulsa', 'Lancar Jaya Cell', 'Maju Bersama Phone', 'Nusantara Cell', 'Omega Pulsa',
  'Pelangi Cell', 'Rezeki Phone', 'Sentosa Cell', 'Tunas Pulsa',
];

const owners = [
  'Hendra Wijaya', 'Siti Rahmawati', 'Agus Setiawan', 'Ujang Sopandi', 'Yanti Susanti',
  'Asep Saepudin', 'Dedi Kurnia', 'Nining Suryani', 'Rudi Hartono', 'Euis Komalasari',
  'Iwan Setiadi', 'Tati Rohayati', 'Ade Supriatna', 'Neneng Hasanah', 'Ujang Rahmat',
  'Wawan Gunawan', 'Lilis Suryani', 'Endang Sutisna', 'Cucu Sumiati', 'Dodi Firmansyah',
  'Imas Masitoh', 'Jajang Nurjaman', 'Kokom Komariah', 'Mamat Rahmat',
];

const outletAreas: Array<{ tap: string; districts: string[] }> = [
  { tap: 'TAP Kota Cirebon', districts: ['Kejaksan', 'Kesambi', 'Lemahwungkuk', 'Harjamukti'] },
  { tap: 'TAP Sumber', districts: ['Sumber', 'Plered', 'Weru', 'Palimanan'] },
  { tap: 'TAP Kuningan', districts: ['Kuningan', 'Cilimus', 'Kadugede', 'Luragung'] },
];

const mobileSf = salesforceOf('mobile');

export const outlets: Outlet[] = outletNames.map((name, index) => {
  const area = outletAreas[index % outletAreas.length] as { tap: string; districts: string[] };
  return {
    id: `outlet-${index + 1}`,
    digiposId: `CONTOH${String(index + 1).padStart(3, '0')}`,
    name,
    owner: owners[index] ?? 'Pemilik contoh',
    district: area.districts[index % area.districts.length] ?? '-',
    tap: area.tap,
    salesforceId: (mobileSf[index % mobileSf.length] as Person).id,
  };
});

export type Customer = {
  id: string;
  name: string;
  serviceNo: string;
  address: string;
  packageName: string;
  salesforceId: string;
};

const customerNames = [
  'Andi Kurniawan', 'Budi Santoso', 'Citra Lestari', 'Dian Permata', 'Erik Saputra',
  'Fitri Handayani', 'Gilang Ramadhan', 'Hana Pertiwi', 'Indra Gunawan', 'Joko Susilo',
  'Kartika Sari', 'Lukman Hakim', 'Mega Puspita', 'Nanda Pratama', 'Oki Setiawan',
  'Prita Anjani', 'Qori Amalia', 'Reza Mahendra', 'Sinta Dewi', 'Taufik Hidayat',
];

const householdSf = salesforceOf('household');
const packages = ['IndiHome 30 Mbps', 'IndiHome 50 Mbps', 'IndiHome 100 Mbps + TV'];
const customerDistricts = ['Kejaksan', 'Kesambi', 'Sumber', 'Plered', 'Kuningan', 'Cilimus'];

export const customers: Customer[] = customerNames.map((name, index) => ({
  id: `pelanggan-${index + 1}`,
  name,
  // Nomor layanan sebagai teks: nol di depan harus tetap utuh (PRD 4.5).
  serviceNo: `0122${String(310000 + index * 137).padStart(8, '0')}`,
  address: `Jl. Contoh Blok ${String.fromCharCode(65 + (index % 6))} No. ${index + 3}, ${customerDistricts[index % customerDistricts.length]}`,
  packageName: packages[index % packages.length] as string,
  salesforceId: (householdSf[index % householdSf.length] as Person).id,
}));
