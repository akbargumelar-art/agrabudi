import { Button, Textarea, cardClass, cn } from '@agrabudi/ui';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useId, type ReactNode } from 'react';

export function moveItem<T>(items: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item as T);
  return next;
}

const iconButton = 'min-h-11 min-w-11 px-0';

/** Tombol urut dan hapus untuk satu baris daftar. Tiap tombol berlabel untuk pembaca layar. */
export function RowActions({
  label,
  index,
  count,
  onMove,
  onRemove,
}: {
  label: string;
  index: number;
  count: number;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  return (
    <span className="flex shrink-0 gap-1">
      <Button
        variant="ghost"
        size="sm"
        className={iconButton}
        aria-label={`Naikkan ${label}`}
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp aria-hidden className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={iconButton}
        aria-label={`Turunkan ${label}`}
        disabled={index === count - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown aria-hidden className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={iconButton}
        aria-label={`Hapus ${label}`}
        onClick={onRemove}
      >
        <Trash2 aria-hidden className="size-4" />
      </Button>
    </span>
  );
}

/** Kelompok isian berbingkai dengan judul dan tombol tambah. */
export function ListFieldset({
  legend,
  hint,
  empty,
  addLabel,
  onAdd,
  children,
}: {
  legend: string;
  hint?: string;
  empty: boolean;
  addLabel: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <fieldset className={cn(cardClass, 'flex min-w-0 flex-col gap-3 p-4')}>
      <legend className="px-1 text-base font-bold">{legend}</legend>
      {hint ? <p className="text-sm text-ink-700">{hint}</p> : null}
      {empty ? <p className="text-sm text-ink-500">Belum ada isi.</p> : null}
      {children}
      <div>
        <Button variant="secondary" size="sm" onClick={onAdd}>
          <Plus aria-hidden className="size-4" />
          {addLabel}
        </Button>
      </div>
    </fieldset>
  );
}

export function InlineError({ message }: { message: string | undefined }) {
  return message ? (
    <p role="alert" className="text-sm font-medium text-danger">
      {message}
    </p>
  ) : null;
}

/** Daftar paragraf atau butir teks: tambah, ubah, urutkan, hapus. */
export function TextListField({
  legend,
  hint,
  itemLabel,
  items,
  onChange,
  errors,
  errorPrefix,
}: {
  legend: string;
  hint?: string;
  itemLabel: string;
  items: string[];
  onChange: (next: string[]) => void;
  errors: Record<string, string>;
  errorPrefix: string;
}) {
  const baseId = useId();
  return (
    <ListFieldset
      legend={legend}
      hint={hint}
      empty={items.length === 0}
      addLabel={`Tambah ${itemLabel.toLowerCase()}`}
      onAdd={() => onChange([...items, ''])}
    >
      <ol className="flex flex-col gap-3">
        {items.map((item, index) => {
          const id = `${baseId}-${index}`;
          const error = errors[`${errorPrefix}.${index}`];
          return (
            <li key={index} className="flex flex-col gap-1.5">
              <label htmlFor={id} className="text-sm font-medium">
                {itemLabel} {index + 1}
              </label>
              <div className="flex flex-col gap-2 tablet:flex-row tablet:items-start">
                <Textarea
                  id={id}
                  value={item}
                  aria-invalid={error ? true : undefined}
                  onChange={(event) =>
                    onChange(items.map((entry, i) => (i === index ? event.target.value : entry)))
                  }
                  className="min-h-20 flex-1"
                />
                <RowActions
                  label={`${itemLabel} ${index + 1}`}
                  index={index}
                  count={items.length}
                  onMove={(delta) => onChange(moveItem(items, index, delta))}
                  onRemove={() => onChange(items.filter((_, i) => i !== index))}
                />
              </div>
              <InlineError message={error} />
            </li>
          );
        })}
      </ol>
    </ListFieldset>
  );
}
