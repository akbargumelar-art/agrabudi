import { CV_ACCEPT, CV_MAX_BYTES } from '@agrabudi/contracts';
import { Field, Input, Textarea } from '@agrabudi/ui';

/** Pola HTML yang sama dengan `phoneIdSchema` di packages/contracts. */
export const PHONE_PATTERN = '(\\+62|0)8[0-9]{7,12}';

export function NameField({ id, label = 'Nama' }: { id: string; label?: string }) {
  return (
    <Field label={label} htmlFor={id}>
      <Input id={id} name="name" autoComplete="name" required maxLength={80} />
    </Field>
  );
}

export function PhoneField({ id }: { id: string }) {
  return (
    <Field label="Nomor HP" htmlFor={id} hint="Contoh: 081234567890">
      <Input
        id={id}
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        pattern={PHONE_PATTERN}
        title="Nomor HP diawali 08 atau +628, 10 sampai 15 digit."
        aria-describedby={`${id}-hint`}
      />
    </Field>
  );
}

export function AddressField({ id, label }: { id: string; label: string }) {
  return (
    <Field label={label} htmlFor={id}>
      <Textarea id={id} name="address" autoComplete="street-address" required maxLength={300} />
    </Field>
  );
}

export function CvField({ id }: { id: string }) {
  return (
    <Field
      label="CV"
      htmlFor={id}
      hint="PDF atau Word, paling besar 2 MB. CV disimpan privat dan hanya dibuka petugas rekrutmen yang berizin."
    >
      <Input
        id={id}
        name="cv"
        type="file"
        accept={CV_ACCEPT}
        required
        data-max-bytes={CV_MAX_BYTES}
        className="py-2"
        aria-describedby={`${id}-hint`}
      />
    </Field>
  );
}

export function ConsentField({ text }: { text: string }) {
  return (
    <label className="flex min-h-11 items-start gap-3 text-sm">
      <input type="checkbox" name="consent" required className="mt-1 size-4" />
      <span>{text}</span>
    </label>
  );
}
