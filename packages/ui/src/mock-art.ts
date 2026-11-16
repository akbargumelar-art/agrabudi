/**
 * ILUSTRASI CONTOH untuk data contoh (mock). Semua gambar dibuat sebagai SVG di sini:
 * bukan foto, bukan aset Telkomsel, dan tidak menggambarkan orang sungguhan.
 *
 * Modul ini hanya boleh diimpor dari mock adapter, yang dimuat lewat import dinamis.
 * Dengan begitu build bersumber data `api` tidak ikut membawa gambar contoh (PRD 3.3, AS-06).
 */

const C = {
  red: '#cf211b',
  redStrong: '#96110e',
  maroon: '#790908',
  gold: '#e8a340',
  goldSoft: '#fbedd7',
  ink: '#2e2834',
  ink700: '#57505f',
  ink300: '#cfcbd4',
  inkSoft: '#f1eff4',
  surface: '#f7f6f8',
  redSoft: '#fdeceb',
  sky: '#e5eef9',
  blue: '#1c5ca4',
  green: '#17714a',
  greenSoft: '#e4f3eb',
  white: '#ffffff',
};

const FONT = "font-family='Poppins, Segoe UI, Arial, sans-serif'";

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Angka acak yang selalu sama untuk seed yang sama, supaya gambar tidak berubah tiap render. */
function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)] as T;
}

function svg(width: number, height: number, body: string): string {
  const markup = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}' width='${width}' height='${height}'>${body}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

/** Penanda kecil di pojok gambar supaya ilustrasi tidak terbaca sebagai foto resmi. */
function sampleTag(x: number, y: number, dark = false): string {
  const fill = dark ? 'rgba(255,255,255,0.88)' : 'rgba(46,40,52,0.78)';
  const text = dark ? C.ink : C.white;
  return `<rect x='${x}' y='${y}' width='132' height='26' rx='13' fill='${fill}'/><text x='${x + 66}' y='${y + 17.5}' text-anchor='middle' ${FONT} font-size='12' font-weight='600' fill='${text}'>Ilustrasi contoh</text>`;
}

/** Bidang bersegi seperti logo, dipakai sebagai motif latar. */
function facets(cx: number, cy: number, r: number, colors: readonly string[], opacity = 1): string {
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
  });
  return points
    .map(([x, y], i) => {
      const [nx, ny] = points[(i + 1) % 6] as readonly [number, number];
      if (i % 2 === 1) return '';
      const color = colors[(i / 2) % colors.length];
      return `<path d='M${cx} ${cy} L${x.toFixed(1)} ${y.toFixed(1)} L${nx.toFixed(1)} ${ny.toFixed(1)} Z' fill='${color}' opacity='${opacity}'/>`;
    })
    .join('');
}

export type ProductArtKind = 'perdana' | 'voucher' | 'orbit' | 'soundbox' | 'paket';

/** Gambar produk: kartu perdana, voucher, modem Orbit, soundbox, atau paket. */
export function productArt(kind: ProductArtKind, label: string, seed = label): string {
  const random = seeded(seed);
  const accent = pick(random, [C.red, C.maroon, C.redStrong]);
  const bg = kind === 'orbit' || kind === 'soundbox' ? C.inkSoft : C.redSoft;
  let device = '';
  switch (kind) {
    case 'perdana':
      device = `<g transform='translate(120 50) rotate(-8 80 100)'>
        <path d='M0 0 H130 L170 40 V200 Q170 210 160 210 H10 Q0 210 0 200 Z' fill='${accent}'/>
        <rect x='28' y='70' width='70' height='56' rx='8' fill='${C.gold}'/>
        <path d='M28 98 H98 M63 70 V126 M40 70 V126 M86 70 V126' stroke='${C.goldSoft}' stroke-width='3'/>
        <text x='20' y='170' ${FONT} font-size='18' font-weight='700' fill='${C.white}'>${esc(label.slice(0, 14))}</text>
      </g>`;
      break;
    case 'voucher':
      device = `<g transform='translate(70 80) rotate(-5 130 70)'>
        <path d='M0 0 H260 V50 A18 18 0 0 0 260 86 V140 H0 V86 A18 18 0 0 0 0 50 Z' fill='${accent}'/>
        <path d='M190 10 V130' stroke='${C.white}' stroke-width='3' stroke-dasharray='8 8' opacity='0.7'/>
        <text x='22' y='62' ${FONT} font-size='16' font-weight='600' fill='${C.goldSoft}'>Voucher</text>
        <text x='22' y='100' ${FONT} font-size='22' font-weight='800' fill='${C.white}'>${esc(label.slice(0, 12))}</text>
        <circle cx='225' cy='70' r='18' fill='${C.gold}'/>
      </g>`;
      break;
    case 'orbit':
      device = `<g transform='translate(150 40)'>
        <path d='M30 210 Q50 30 50 30 H50' fill='none'/>
        <rect x='10' y='40' width='80' height='190' rx='30' fill='${C.white}' stroke='${C.ink300}' stroke-width='3'/>
        <circle cx='50' cy='90' r='6' fill='${C.green}'/><circle cx='50' cy='112' r='6' fill='${C.blue}'/><circle cx='50' cy='134' r='6' fill='${accent}'/>
        <path d='M100 70 q30 30 0 60 M118 52 q48 48 0 96' stroke='${accent}' stroke-width='8' fill='none' stroke-linecap='round'/>
        <path d='M0 70 q-30 30 0 60 M-18 52 q-48 48 0 96' stroke='${accent}' stroke-width='8' fill='none' stroke-linecap='round'/>
      </g>`;
      break;
    case 'soundbox':
      device = `<g transform='translate(130 40)'>
        <rect x='0' y='20' width='140' height='200' rx='22' fill='${C.ink}'/>
        <circle cx='70' cy='150' r='42' fill='${C.ink700}'/><circle cx='70' cy='150' r='18' fill='${C.ink}'/>
        <rect x='38' y='42' width='64' height='64' rx='6' fill='${C.white}'/>
        <path d='M46 50 h16 v16 h-16z M78 50 h16 v16 h-16z M46 82 h16 v16 h-16z M70 74 h8 v8 h-8z M84 84 h10 v10 h-10z' fill='${C.ink}'/>
        <circle cx='118' cy='38' r='6' fill='${accent}'/>
      </g>`;
      break;
    case 'paket':
      device = `<g transform='translate(110 60)'>
        <path d='M0 50 L90 10 L180 50 L90 90 Z' fill='${C.gold}'/>
        <path d='M0 50 V150 L90 190 V90 Z' fill='${accent}'/>
        <path d='M180 50 V150 L90 190 V90 Z' fill='${C.maroon}'/>
        <path d='M45 30 L135 70 V100' stroke='${C.goldSoft}' stroke-width='10' fill='none'/>
      </g>`;
      break;
  }
  return svg(
    400,
    300,
    `<rect width='400' height='300' fill='${bg}'/>${facets(380, 290, 150, [C.red, C.gold, C.maroon], 0.12)}${device}${sampleTag(12, 262)}`,
  );
}

/** Ilustrasi paket internet rumah: rumah, router, dan sinyal. */
export function homeInternetArt(seed: string): string {
  const random = seeded(seed);
  const roof = pick(random, [C.red, C.maroon, C.redStrong]);
  return svg(
    400,
    300,
    `<rect width='400' height='300' fill='${C.sky}'/>
    ${facets(30, 20, 120, [C.white], 0.5)}
    <path d='M80 140 L200 50 L320 140 Z' fill='${roof}'/>
    <rect x='100' y='138' width='200' height='120' fill='${C.white}'/>
    <rect x='130' y='170' width='50' height='45' rx='4' fill='${C.sky}'/><rect x='220' y='190' width='50' height='68' rx='4' fill='${C.ink300}'/>
    <rect x='160' y='238' width='60' height='14' rx='5' fill='${C.ink}'/>
    <path d='M175 225 q15 -14 30 0 M168 214 q22 -22 44 0' stroke='${C.blue}' stroke-width='5' fill='none' stroke-linecap='round'/>
    ${sampleTag(12, 262)}`,
  );
}

export type ArtTone = 'red' | 'ink' | 'gold';

const toneBg: Record<ArtTone, [string, string]> = {
  red: [C.red, C.maroon],
  ink: [C.ink, '#1d1822'],
  gold: [C.gold, '#c97d1d'],
};

/** Gambar banner lebar. Teks banner ditulis di HTML, bukan di gambar, supaya tetap terbaca dan bisa diterjemahkan. */
export function bannerArt(seed: string, tone: ArtTone = 'red'): string {
  const random = seeded(seed);
  const [from, to] = toneBg[tone];
  const shift = Math.round(random() * 120);
  const phoneX = 820 + shift / 2;
  return svg(
    1200,
    500,
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/></linearGradient></defs>
    <rect width='1200' height='500' fill='url(#g)'/>
    ${facets(1050 - shift, 260, 330, ['#ffffff', C.gold, '#ffffff'], 0.12)}
    ${facets(780 + shift, 470, 160, ['#ffffff'], 0.08)}
    <g transform='translate(${phoneX} 90) rotate(${(random() * 16 - 8).toFixed(1)} 90 160)'>
      <rect width='180' height='330' rx='28' fill='${C.white}'/>
      <rect x='14' y='22' width='152' height='270' rx='14' fill='${tone === 'gold' ? C.maroon : C.goldSoft}'/>
      <rect x='30' y='48' width='120' height='16' rx='8' fill='${C.white}' opacity='0.9'/>
      <rect x='30' y='76' width='80' height='12' rx='6' fill='${C.white}' opacity='0.7'/>
      <circle cx='90' cy='170' r='46' fill='${tone === 'red' ? C.red : C.gold}'/>
      <path d='M70 170 l14 14 l28 -30' stroke='${C.white}' stroke-width='9' fill='none' stroke-linecap='round' stroke-linejoin='round'/>
      <rect x='30' y='240' width='120' height='28' rx='14' fill='${C.white}'/>
    </g>
    ${sampleTag(1050, 460, true)}`,
  );
}

/** Gambar kartu promo/program: hadiah, piala, atau persen. */
export function programArt(seed: string, tone: ArtTone = 'red'): string {
  const random = seeded(seed);
  const [from, to] = toneBg[tone];
  const motif = pick(random, ['gift', 'trophy', 'percent'] as const);
  let icon: string;
  if (motif === 'gift') {
    icon = `<rect x='230' y='140' width='140' height='110' rx='8' fill='${C.white}'/><rect x='220' y='110' width='160' height='40' rx='8' fill='${C.goldSoft}'/><rect x='290' y='110' width='22' height='140' fill='${C.gold}'/><path d='M300 110 q-40 -50 -55 -10 q20 20 55 10 q40 -50 55 -10 q-20 20 -55 10' fill='${C.gold}'/>`;
  } else if (motif === 'trophy') {
    icon = `<path d='M250 90 H350 V150 Q350 200 300 205 Q250 200 250 150 Z' fill='${C.gold}'/><path d='M250 105 H220 Q215 150 255 160 M350 105 H380 Q385 150 345 160' stroke='${C.gold}' stroke-width='10' fill='none'/><rect x='288' y='205' width='24' height='30' fill='${C.goldSoft}'/><rect x='260' y='235' width='80' height='20' rx='6' fill='${C.white}'/>`;
  } else {
    icon = `<circle cx='300' cy='170' r='85' fill='${C.white}'/><circle cx='265' cy='135' r='18' fill='none' stroke='${C.red}' stroke-width='10'/><circle cx='335' cy='205' r='18' fill='none' stroke='${C.red}' stroke-width='10'/><path d='M345 120 L255 220' stroke='${C.red}' stroke-width='12' stroke-linecap='round'/>`;
  }
  const confetti = Array.from({ length: 14 }, () => {
    const x = Math.round(random() * 600);
    const y = Math.round(random() * 340);
    const color = pick(random, [C.white, C.gold, C.goldSoft]);
    return `<rect x='${x}' y='${y}' width='10' height='4' rx='2' fill='${color}' opacity='0.7' transform='rotate(${Math.round(random() * 180)} ${x} ${y})'/>`;
  }).join('');
  return svg(
    600,
    340,
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/></linearGradient></defs>
    <rect width='600' height='340' fill='url(#g)'/>${facets(560, 330, 200, [C.white], 0.1)}${confetti}${icon}${sampleTag(12, 302, true)}`,
  );
}

function storefront(random: () => number, sign: string, extra = ''): string {
  const awning = pick(random, [C.red, C.maroon, C.blue, C.green]);
  const wall = pick(random, ['#f4e9dc', '#eef1f5', '#f6efe3', '#e9f2ec']);
  const stripes = Array.from(
    { length: 8 },
    (_, i) => `<rect x='${60 + i * 60}' y='120' width='30' height='44' fill='${C.white}' opacity='0.9'/>`,
  ).join('');
  return `<rect width='600' height='450' fill='${C.sky}'/>
    <rect x='0' y='380' width='600' height='70' fill='#d9d6dd'/>
    <rect x='60' y='110' width='480' height='280' fill='${wall}'/>
    <rect x='60' y='120' width='480' height='44' fill='${awning}'/>${stripes}
    <path d='M60 164 h480 l-10 18 h-460 z' fill='${awning}' opacity='0.8'/>
    <rect x='140' y='52' width='320' height='56' rx='8' fill='${C.white}' stroke='${awning}' stroke-width='5'/>
    <text x='300' y='88' text-anchor='middle' ${FONT} font-size='24' font-weight='700' fill='${C.ink}'>${esc(sign.slice(0, 22))}</text>
    <rect x='90' y='210' width='170' height='110' rx='6' fill='#bcd3ea'/>
    <rect x='100' y='290' width='150' height='40' fill='${C.ink300}'/>
    <rect x='340' y='210' width='160' height='170' rx='6' fill='#a9c2db'/>
    <rect x='112' y='224' width='48' height='60' rx='4' fill='${C.red}'/><rect x='170' y='236' width='70' height='14' rx='4' fill='${C.white}'/>
    ${extra}`;
}

/** Foto toko outlet (ilustrasi). */
export function storeArt(name: string, seed = name): string {
  const random = seeded(seed);
  return svg(600, 450, `${storefront(random, name)}${sampleTag(12, 412)}`);
}

function person(x: number, shirt: string, skin: string, scale = 1): string {
  return `<g transform='translate(${x} 0) scale(${scale})'>
    <circle cx='0' cy='238' r='26' fill='${skin}'/>
    <path d='M-18 222 q18 -26 36 0' fill='#3b3442'/>
    <path d='M-42 380 V300 Q-42 268 -10 266 H10 Q42 268 42 300 V380 Z' fill='${shirt}'/>
  </g>`;
}

/** Dokumentasi penyerahan hadiah: dua sosok dan kotak hadiah di depan toko. Bukan orang sungguhan. */
export function handoverArt(outletName: string, seed = outletName): string {
  const random = seeded(seed);
  const skins = ['#e0ac82', '#c68b5f', '#f0c7a0', '#a86f47'];
  const extra = `${person(200, C.red, pick(random, skins))}${person(410, pick(random, [C.blue, C.green, C.ink700]), pick(random, skins))}
    <rect x='250' y='300' width='110' height='80' rx='6' fill='${C.gold}'/><rect x='296' y='300' width='18' height='80' fill='${C.goldSoft}'/>
    <rect x='240' y='286' width='130' height='22' rx='4' fill='${C.goldSoft}'/>
    <path d='M305 286 q-30 -40 -44 -8 q16 16 44 8 q30 -40 44 -8 q-16 16 -44 8' fill='${C.gold}'/>`;
  return svg(600, 450, `${storefront(random, outletName, extra)}${sampleTag(12, 412)}`);
}

/** Foto kunjungan atau pemasangan materi promosi di outlet. */
export function visitArt(outletName: string, seed = outletName, withPoster = true): string {
  const random = seeded(seed);
  const poster = withPoster
    ? `<rect x='275' y='200' width='52' height='80' rx='4' fill='${C.red}'/><rect x='283' y='212' width='36' height='8' rx='3' fill='${C.white}'/><circle cx='301' cy='248' r='13' fill='${C.gold}'/>`
    : '';
  const extra = `${poster}${person(430, pick(random, [C.red, C.maroon]), pick(random, ['#e0ac82', '#c68b5f', '#f0c7a0']), 0.92)}
    <rect x='454' y='298' width='40' height='52' rx='4' fill='${C.white}' stroke='${C.ink700}' stroke-width='3'/>
    <path d='M462 314 h24 M462 326 h24 M462 338 h16' stroke='${C.ink700}' stroke-width='3'/>`;
  return svg(600, 450, `${storefront(random, outletName, extra)}${sampleTag(12, 412)}`);
}

/** Materi promosi (POP): poster, standee, atau spanduk. */
export function popArt(kind: string, seed = kind): string {
  const random = seeded(seed);
  const tone = pick(random, [C.red, C.maroon, C.redStrong]);
  return svg(
    400,
    300,
    `<rect width='400' height='300' fill='${C.surface}'/>
    <rect x='150' y='30' width='100' height='210' rx='6' fill='${tone}'/>
    <rect x='164' y='48' width='72' height='14' rx='5' fill='${C.white}'/><rect x='164' y='70' width='50' height='10' rx='5' fill='${C.goldSoft}'/>
    <circle cx='200' cy='150' r='34' fill='${C.gold}'/>
    <rect x='170' y='206' width='60' height='18' rx='9' fill='${C.white}'/>
    <path d='M170 240 L150 280 M230 240 L250 280' stroke='${C.ink700}' stroke-width='6' stroke-linecap='round'/>
    <text x='200' y='20' text-anchor='middle' ${FONT} font-size='14' font-weight='600' fill='${C.ink700}'>${esc(kind.slice(0, 24))}</text>
    ${sampleTag(12, 262)}`,
  );
}

/** Gedung kantor (ilustrasi). */
export function officeArt(label: string, seed = label): string {
  const random = seeded(seed);
  const floors = 3 + Math.floor(random() * 2);
  const windows = Array.from({ length: floors * 4 }, (_, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    return `<rect x='${170 + col * 70}' y='${100 + row * 60}' width='44' height='38' rx='4' fill='${random() > 0.3 ? '#bcd3ea' : C.goldSoft}'/>`;
  }).join('');
  return svg(
    600,
    400,
    `<rect width='600' height='400' fill='${C.sky}'/>${facets(560, 40, 140, [C.white], 0.5)}
    <rect x='0' y='340' width='600' height='60' fill='#d9d6dd'/>
    <rect x='140' y='${90 - 0}' width='320' height='${floors * 60 + 30}' fill='${C.white}'/>
    <rect x='140' y='70' width='320' height='28' fill='${C.red}'/>
    ${windows}
    <rect x='265' y='${90 + floors * 60 - 30}' width='70' height='${360 - (90 + floors * 60 - 30)}' fill='${C.ink700}'/>
    <text x='300' y='90' text-anchor='middle' ${FONT} font-size='16' font-weight='700' fill='${C.white}'>${esc(label.slice(0, 26))}</text>
    ${sampleTag(12, 362)}`,
  );
}

/** Avatar inisial untuk pengguna contoh. */
export function avatarArt(name: string): string {
  const random = seeded(name);
  const bg = pick(random, [C.red, C.maroon, C.blue, C.green, C.ink700, '#c97d1d']);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return svg(
    96,
    96,
    `<rect width='96' height='96' rx='48' fill='${bg}'/><text x='48' y='58' text-anchor='middle' ${FONT} font-size='32' font-weight='700' fill='${C.white}'>${esc(initials)}</text>`,
  );
}

/** Ikon dokumen untuk berkas contoh (CV, materi, laporan). */
export function documentArt(label: string, kind = 'PDF'): string {
  return svg(
    400,
    300,
    `<rect width='400' height='300' fill='${C.surface}'/>
    <path d='M140 30 H240 L280 70 V260 Q280 270 270 270 H140 Q130 270 130 260 V40 Q130 30 140 30 Z' fill='${C.white}' stroke='${C.ink300}' stroke-width='3'/>
    <path d='M240 30 V70 H280' fill='${C.inkSoft}' stroke='${C.ink300}' stroke-width='3'/>
    <rect x='150' y='100' width='110' height='10' rx='5' fill='${C.ink300}'/><rect x='150' y='122' width='90' height='10' rx='5' fill='${C.ink300}'/><rect x='150' y='144' width='100' height='10' rx='5' fill='${C.ink300}'/>
    <rect x='150' y='200' width='64' height='28' rx='6' fill='${C.red}'/><text x='182' y='219' text-anchor='middle' ${FONT} font-size='14' font-weight='700' fill='${C.white}'>${esc(kind)}</text>
    <text x='200' y='292' text-anchor='middle' ${FONT} font-size='13' fill='${C.ink700}'>${esc(label.slice(0, 40))}</text>`,
  );
}

/** Thumbnail video roleplay (ilustrasi dengan tombol putar). */
export function videoArt(label: string, seed = label): string {
  const random = seeded(seed);
  const [from, to] = toneBg[pick(random, ['red', 'ink'] as const)];
  return svg(
    400,
    225,
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/></linearGradient></defs>
    <rect width='400' height='225' fill='url(#g)'/>${facets(380, 220, 140, [C.white], 0.1)}
    <circle cx='200' cy='100' r='36' fill='${C.white}'/><path d='M190 84 L218 100 L190 116 Z' fill='${from}'/>
    <text x='200' y='170' text-anchor='middle' ${FONT} font-size='15' font-weight='600' fill='${C.white}'>${esc(label.slice(0, 34))}</text>
    ${sampleTag(12, 190, true)}`,
  );
}
