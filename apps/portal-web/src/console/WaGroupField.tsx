import { Button, Field, Input } from '@agrabudi/ui';

/** Satu isian ID grup WhatsApp dengan tombol pesan uji di sebelahnya. */
export function WaGroupField({
  id,
  label,
  hint,
  value,
  error,
  onChange,
  testDisabled,
  onTest,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  error: string | undefined;
  onChange: (value: string) => void;
  testDisabled: boolean;
  onTest: () => void;
}) {
  return (
    <div className="grid gap-2 tablet:grid-cols-[minmax(0,1fr)_auto] tablet:items-start">
      <Field label={label} htmlFor={id} hint={hint} error={error}>
        <Input
          id={id}
          autoComplete="off"
          spellCheck={false}
          placeholder="120363000000000000@g.us"
          value={value}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      </Field>
      <Button
        variant="secondary"
        size="sm"
        className="min-h-11 tablet:mt-7"
        aria-label={`Kirim pesan uji ke ${label}`}
        disabled={testDisabled}
        onClick={onTest}
      >
        Kirim pesan uji
      </Button>
    </div>
  );
}
