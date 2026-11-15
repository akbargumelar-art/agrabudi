import type { RewardHandover } from '@agrabudi/contracts';
import {
  AsyncView,
  Button,
  Carousel,
  DataNotice,
  EmptyState,
  MediaPlaceholder,
  Modal,
  SectionHeading,
  cardClass,
  cn,
  formatDate,
} from '@agrabudi/ui';
import { Gift } from 'lucide-react';
import { useState } from 'react';
import { useRewardHandovers } from '../../data/queries';

function Photo({ handover, className }: { handover: RewardHandover; className?: string }) {
  const label = `Foto penyerahan ${handover.rewardName} ke ${handover.outletName}`;
  return handover.photoUrl ? (
    <img
      src={handover.photoUrl}
      alt={label}
      loading="lazy"
      className={cn('object-cover', className)}
    />
  ) : (
    <MediaPlaceholder
      label={`${label} belum tersedia`}
      icon={Gift}
      tone="red"
      className={className}
    />
  );
}

/**
 * Slider dokumentasi penyerahan hadiah program, meneruskan "Bukti Penyerahan Hadiah"
 * dari aplikasi poin-outlet lama. Bergeser sendiri dengan tombol jeda; kartu dibuka
 * untuk melihat detail. Koordinat lokasi dan nama petugas tidak ditampilkan di sini.
 */
export function WinnerSlider() {
  const handovers = useRewardHandovers();
  const [viewing, setViewing] = useState<RewardHandover | null>(null);

  return (
    <section aria-labelledby="pemenang-program">
      <SectionHeading
        id="pemenang-program"
        size="sm"
        title="Pemenang program"
        description="Dokumentasi penyerahan hadiah ke outlet pemenang."
        aside={handovers.data ? <DataNotice meta={handovers.data.meta} /> : null}
      />
      <div className="mt-4">
        <AsyncView
          state={handovers}
          errorTitle="Dokumentasi tidak dapat dimuat"
          loadingLabel="Memuat dokumentasi"
        >
          {(envelope) =>
            envelope.data.length === 0 ? (
              <EmptyState
                title="Belum ada dokumentasi"
                description="Foto penyerahan hadiah tampil di sini setelah diunggah Admin program."
              />
            ) : (
              <Carousel
                label="Pemenang program"
                itemClassName="w-64 tablet:w-72"
                autoAdvanceMs={4000}
                items={envelope.data.map((handover) => ({
                  key: handover.id,
                  content: (
                    <button
                      type="button"
                      onClick={() => setViewing(handover)}
                      className={cn(
                        cardClass,
                        'flex h-full w-full flex-col overflow-hidden text-left hover:border-brand-red',
                      )}
                    >
                      <Photo handover={handover} className="aspect-4/3 w-full" />
                      <span className="flex flex-col gap-0.5 p-4">
                        <span className="font-display font-bold">{handover.rewardName}</span>
                        <span className="text-sm font-medium">{handover.outletName}</span>
                        <span className="text-xs text-ink-700">
                          {handover.tap ? `${handover.tap}, ` : ''}
                          {formatDate(handover.handedOverAt)}
                        </span>
                      </span>
                    </button>
                  ),
                }))}
              />
            )
          }
        </AsyncView>
      </div>

      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing ? `Penyerahan ${viewing.rewardName}` : 'Detail penyerahan'}
        footer={
          <Button variant="secondary" size="sm" onClick={() => setViewing(null)}>
            Tutup
          </Button>
        }
      >
        {viewing ? (
          <div className="flex flex-col gap-4">
            <Photo handover={viewing} className="aspect-4/3 w-full rounded-control" />
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-ink-700">Program</dt>
              <dd className="font-medium">{viewing.programTitle}</dd>
              <dt className="text-ink-700">Outlet</dt>
              <dd className="font-medium">{viewing.outletName}</dd>
              <dt className="text-ink-700">TAP</dt>
              <dd>{viewing.tap ?? '-'}</dd>
              <dt className="text-ink-700">Penerima</dt>
              <dd>{viewing.receiverName ?? '-'}</dd>
              <dt className="text-ink-700">Tanggal</dt>
              <dd>{formatDate(viewing.handedOverAt)}</dd>
            </dl>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
