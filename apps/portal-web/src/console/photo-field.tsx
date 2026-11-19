import { Field, Select } from '@agrabudi/ui';
import { useAssets } from './data/queries';

export type Photo = { url: string; name: string };

/** Aset jenis Foto yang sudah diunggah di Aset Website. */
export function usePhotoAssets(): Photo[] {
  const assets = useAssets();
  return (assets.data?.data ?? []).filter((asset) => asset.kind === 'foto');
}

/** Pilih foto dari Aset Website. URL lama yang asetnya sudah tidak ada tetap bisa dipertahankan. */
export function PhotoField({
  id,
  label,
  value,
  photos,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string | null;
  photos: Photo[];
  error: string | undefined;
  onChange: (next: string | null) => void;
}) {
  const stored = value !== null && !photos.some((photo) => photo.url === value);
  return (
    <Field
      label={label}
      htmlFor={id}
      hint="Unggah dulu di Aset Website dengan jenis Foto."
      error={error}
    >
      <Select
        id={id}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Tanpa foto</option>
        {stored ? <option value={value}>Foto tersimpan sebelumnya</option> : null}
        {photos.map((photo) => (
          <option key={photo.url} value={photo.url}>
            {photo.name}
          </option>
        ))}
      </Select>
    </Field>
  );
}
