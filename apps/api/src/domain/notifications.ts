import {
  emptyWaNotificationSettings,
  type OutletOrder,
  type WaNotificationSettings,
} from '@agrabudi/contracts';
import type { FastifyBaseLogger } from 'fastify';
import type { Db } from '../db/database';
import { phoneToChatId, type WaSender } from '../lib/waha';
import { findDocument } from './content';

/**
 * Notifikasi WhatsApp setelah data tersimpan. Pengiriman tidak pernah membatalkan atau
 * menunda transaksi: gagal kirim dicatat di log server (tanpa nomor dan isi pesan), dan
 * data tetap tersimpan. Isi pesan grup sengaja minim: nomor referensi, tanpa data pribadi.
 */
type Target = { chatId: string; text: string; label: string };

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

async function settings(db: Db): Promise<WaNotificationSettings> {
  return (await findDocument(db, 'wa_notifications')) ?? emptyWaNotificationSettings;
}

async function deliver(wa: WaSender, log: FastifyBaseLogger, targets: Target[]) {
  for (const target of targets) {
    try {
      await wa.sendText(target.chatId, target.text);
    } catch (error) {
      log.warn(
        {
          event: 'wa_notification_failed',
          target: target.label,
          reason: error instanceof Error ? error.message : 'unknown',
        },
        'notifikasi WhatsApp gagal dikirim',
      );
    }
  }
}

/**
 * Dipanggil tanpa `await` setelah respons siap (`void notifier.x(...)`): metode ini tidak
 * pernah melempar, semua kegagalan berakhir di log.
 */
export type Notifier = {
  orderCreated(order: OutletOrder, outletAccountId: string): Promise<void>;
  formReceived(kind: 'job_application' | 'digipos_registration', reference: string): Promise<void>;
};

function guarded<A extends unknown[]>(log: FastifyBaseLogger, run: (...args: A) => Promise<void>) {
  return async (...args: A) => {
    try {
      await run(...args);
    } catch (error) {
      log.error(
        { err: error, event: 'wa_notification_error' },
        'notifikasi WhatsApp tidak dapat disiapkan',
      );
    }
  };
}

export function createNotifier(db: Db, wa: WaSender | null, log: FastifyBaseLogger): Notifier {
  return {
    orderCreated: guarded(log, async (order: OutletOrder, outletAccountId: string) => {
      if (!wa) return;
      const config = await settings(db);
      const targets: Target[] = [];
      if (config.orderGroup) {
        targets.push({
          chatId: config.orderGroup,
          label: 'order_group',
          text: `Order ABKShop Outlet baru: ${order.number}, total ${rupiah.format(order.totalRupiah)}. Periksa di Portal.`,
        });
      }
      if (config.orderCustomer) {
        const outlet = await db
          .selectFrom('outletAccounts')
          .select('phone')
          .where('id', '=', outletAccountId)
          .executeTakeFirst();
        const chatId = outlet ? phoneToChatId(outlet.phone) : null;
        if (chatId) {
          targets.push({
            chatId,
            label: 'order_customer',
            text: `Order ${order.number} sudah diterima dengan status Diajukan. Total ${rupiah.format(order.totalRupiah)}. Pantau statusnya di aplikasi Outlet.`,
          });
        } else {
          log.info(
            { event: 'wa_notification_skipped', target: 'order_customer' },
            'nomor HP outlet kosong atau tidak sah',
          );
        }
      }
      await deliver(wa, log, targets);
    }),

    formReceived: guarded(
      log,
      async (kind: 'job_application' | 'digipos_registration', reference: string) => {
        if (!wa) return;
        const config = await settings(db);
        const group = kind === 'job_application' ? config.careerGroup : config.digiposGroup;
        if (!group) return;
        const text =
          kind === 'job_application'
            ? `Lamaran kerja baru: ${reference}. Periksa di Portal, menu Kelola Karir.`
            : `Pendaftaran Digipos baru: ${reference}. Periksa di Portal, menu Pendaftaran Digipos.`;
        await deliver(wa, log, [{ chatId: group, label: `${kind}_group`, text }]);
      },
    ),
  };
}
