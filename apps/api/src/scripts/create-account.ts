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
import { loadConfig } from '../config';
import { createDb } from '../db/database';
import { newId } from '../lib/ids';
import { hashPassword } from '../lib/password';

/**
 * Buat akun pertama (bootstrap) tanpa menaruh kata sandi di repo atau seed. Kata sandi dibaca
 * dari stdin, bukan argumen, supaya tidak tersimpan di riwayat shell.
 *
 *   pnpm --filter @agrabudi/api account:create -- --realm staff --username adminmobile \
 *     --name "Nama" --role admin --unit mobile --scope cluster --permission career.manage
 *   pnpm --filter @agrabudi/api account:create -- --realm outlet --digipos 0012345 \
 *     --outlet "Nama Outlet" --owner "Nama Pemilik" --registered 2026-11-01
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
  },
});

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

const config = loadConfig();
const db = createDb(config);
try {
  if (values.realm === 'staff') {
    const args = staffArgs.parse(values);
    const passwordHash = await hashPassword(await readPassword());
    const id = newId();
    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto('staffAccounts')
        .values({
          id,
          username: args.username,
          displayName: args.name,
          email: null,
          phone: null,
          role: args.role,
          unit: args.unit ?? null,
          scope: args.scope,
          passwordHash,
        })
        .execute();
      if (args.permission.length > 0) {
        await trx
          .insertInto('staffPermissions')
          .values(args.permission.map((permission) => ({ accountId: id, permission })))
          .execute();
      }
    });
    console.log(`Akun Portal dibuat: ${args.username} (${args.role}).`);
  } else if (values.realm === 'outlet') {
    const args = outletArgs.parse(values);
    const passwordHash = await hashPassword(await readPassword());
    await db
      .insertInto('outletAccounts')
      .values({
        id: newId(),
        digiposId: args.digipos,
        outletName: args.outlet,
        ownerName: args.owner,
        tap: args.tap ?? null,
        registeredAt: args.registered,
        salesforceName: null,
        photoUrl: null,
        passwordHash,
      })
      .execute();
    console.log(`Akun Outlet dibuat: ${args.digipos}.`);
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
