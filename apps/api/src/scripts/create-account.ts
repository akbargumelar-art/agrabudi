import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import {
  businessUnitSchema,
  dataScopeSchema,
  newPasswordSchema,
  staffPermissionSchema,
  staffRoleSchema,
} from '@agrabudi/contracts';
import { z } from 'zod';
import { phoneIdSchema } from '@agrabudi/contracts';
import { loadConfig } from '../config';
import { createDb, type Db } from '../db/database';
import { issueTemporaryPassword, temporaryPasswordMessage } from '../domain/credentials';
import { newId } from '../lib/ids';
import { hashPassword } from '../lib/password';
import { createWahaSender } from '../lib/waha';

/**
 * Buat akun lewat CLI server (akun pertama, Manager, Admin Web). Dua cara memberi kata sandi:
 *
 * - bawaan: kata sandi diketik lewat stdin (bukan argumen, supaya tidak masuk riwayat shell).
 *   Dipakai untuk akun pertama saat WAHA belum ada.
 * - `--temporary`: server membuat kata sandi acak, mengirimnya ke WhatsApp `--phone`, dan akun
 *   wajib mengganti kata sandi saat login pertama. Kata sandi tidak pernah tampil di terminal.
 *
 *   pnpm --filter @agrabudi/api account:create -- --realm staff --username adminmobile \
 *     --name "Nama" --role admin --unit mobile --scope cluster --permission user.manage \
 *     --phone 081234567890 --temporary
 *   pnpm --filter @agrabudi/api account:create -- --realm outlet --digipos 0012345 \
 *     --outlet "Nama Outlet" --owner "Nama Pemilik" --registered 2026-11-01 --phone 0812...
 */
const { values } = parseArgs({
  options: {
    realm: { type: 'string' },
    username: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string' },
    unit: { type: 'string' },
    scope: { type: 'string' },
    permission: { type: 'string', multiple: true },
    digipos: { type: 'string' },
    outlet: { type: 'string' },
    owner: { type: 'string' },
    tap: { type: 'string' },
    registered: { type: 'string' },
    phone: { type: 'string' },
    temporary: { type: 'boolean', default: false },
  },
});

const phoneArg = z.object({ phone: phoneIdSchema.optional() });

async function readPassword(): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout, terminal: stdin.isTTY });
  try {
    const password = await rl.question('Kata sandi (min. 12 karakter): ');
    return newPasswordSchema.parse(password);
  } finally {
    rl.close();
  }
}

const staffArgs = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9._-]{3,64}$/),
    name: z.string().trim().min(1).max(80),
    role: staffRoleSchema,
    unit: businessUnitSchema.optional(),
    scope: dataScopeSchema,
    permission: z.array(staffPermissionSchema).default([]),
  })
  .refine(
    (args) => (args.role === 'web_admin') === (args.scope === 'site'),
    'Admin Web wajib scope "site", peran lain tidak boleh.',
  )
  .refine(
    (args) => args.role !== 'web_admin' || (!args.unit && args.permission.length === 0),
    'Admin Web tidak punya unit atau izin bisnis.',
  );

const outletArgs = z.object({
  digipos: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{3,32}$/),
  outlet: z.string().trim().min(1).max(120),
  owner: z.string().trim().min(1).max(80),
  tap: z.string().trim().max(80).optional(),
  registered: z.iso.date(),
});

/**
 * Simpan akun dengan kata sandi yang diketik, atau dengan kata sandi sementara yang dikirim
 * lewat WhatsApp (gagal kirim = akun tidak dibuat).
 */
async function withPassword(
  db: Db,
  login: { app: string; id: string; url: string },
  phone: string | undefined,
  insert: (trx: Db, passwordHash: string, mustChangePassword: boolean) => Promise<void>,
): Promise<string> {
  if (!values.temporary) {
    const passwordHash = await hashPassword(await readPassword());
    await db.transaction().execute((trx) => insert(trx, passwordHash, false));
    return 'kata sandi yang diketik';
  }
  if (!phone) throw new Error('--temporary butuh --phone (nomor WhatsApp pemilik akun).');
  const wa = createWahaSender(config);
  const delivery = await issueTemporaryPassword(
    db,
    wa,
    phone,
    temporaryPasswordMessage(login.app, login.id, login.url, 'created'),
    (trx, passwordHash) => insert(trx, passwordHash, true),
  );
  return delivery.channel === 'whatsapp'
    ? `kata sandi sementara dikirim ke WhatsApp ${delivery.maskedPhone}`
    : 'kata sandi sementara';
}

const config = loadConfig();
const db = createDb(config);
try {
  const { phone } = phoneArg.parse(values);
  if (values.realm === 'staff') {
    const args = staffArgs.parse(values);
    const id = newId();
    const how = await withPassword(
      db,
      { app: 'Portal Agrabudi', id: args.username, url: config.APP_URL_PORTAL },
      phone,
      async (trx, passwordHash, mustChangePassword) => {
        await trx
          .insertInto('staffAccounts')
          .values({
            id,
            username: args.username,
            displayName: args.name,
            email: null,
            phone: phone ?? null,
            role: args.role,
            unit: args.unit ?? null,
            scope: args.scope,
            passwordHash,
            mustChangePassword,
          })
          .execute();
        if (args.permission.length > 0) {
          await trx
            .insertInto('staffPermissions')
            .values(args.permission.map((permission) => ({ accountId: id, permission })))
            .execute();
        }
      },
    );
    console.log(`Akun Portal dibuat: ${args.username} (${args.role}), ${how}.`);
  } else if (values.realm === 'outlet') {
    const args = outletArgs.parse(values);
    const how = await withPassword(
      db,
      { app: 'Agrabudi Outlet', id: args.digipos, url: config.APP_URL_OUTLET },
      phone,
      async (trx, passwordHash, mustChangePassword) => {
        await trx
          .insertInto('outletAccounts')
          .values({
            id: newId(),
            digiposId: args.digipos,
            outletName: args.outlet,
            ownerName: args.owner,
            tap: args.tap ?? null,
            phone: phone ?? '',
            registeredAt: args.registered,
            salesforceName: null,
            photoUrl: null,
            passwordHash,
            mustChangePassword,
          })
          .execute();
      },
    );
    console.log(`Akun Outlet dibuat: ${args.digipos}, ${how}.`);
  } else {
    throw new Error('Isi --realm staff atau --realm outlet.');
  }
} catch (error) {
  console.error(
    error instanceof z.ZodError
      ? error.issues
          .map((issue) =>
            issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
          )
          .join('\n')
      : error instanceof Error
        ? error.message
        : error,
  );
  process.exitCode = 1;
} finally {
  await db.destroy();
}
