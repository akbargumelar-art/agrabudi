import { companyProfileSections, type CompanyProfile } from '@agrabudi/contracts';
import { Field, Input, Select } from '@agrabudi/ui';
import { useId } from 'react';
import { emptySection } from './CompanyPages';
import { useAssets, useCompanySection, useSaveCompanySection } from './data/queries';
import { DocumentEditor } from './editors';
import { ListFieldset, RowActions, moveItem } from './list-fields';

type Office = CompanyProfile['offices'][number];
type Photo = { url: string; name: string };

const trimOffice = (office: Office): Office => ({
  ...office,
  name: office.name.trim(),
  address: office.address.trim(),
  hours: office.hours.trim(),
  phone: office.phone.trim(),
});

function OfficeRow({
  office,
  index,
  count,
  photos,
  errors,
  onChange,
  onMove,
  onRemove,
}: {
  office: Office;
  index: number;
  count: number;
  photos: Photo[];
  errors: Record<string, string>;
  onChange: (next: Office) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const text = (key: 'name' | 'address' | 'hours' | 'phone', label: string, hint?: string) => (
    <Field
      label={label}
      htmlFor={`${id}-${key}`}
      hint={hint}
      error={errors[`offices.${index}.${key}`]}
    >
      <Input
        id={`${id}-${key}`}
        value={office[key]}
        onChange={(event) => onChange({ ...office, [key]: event.target.value })}
      />
    </Field>
  );
  const stored = office.imageUrl && !photos.some((photo) => photo.url === office.imageUrl);
  return (
    <li className="flex flex-col gap-3 border-t border-surface-100 pt-3 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Kantor {index + 1}</h3>
        <RowActions
          label={`kantor ${index + 1}`}
          index={index}
          count={count}
          onMove={onMove}
          onRemove={onRemove}
        />
      </div>
      <div className="grid gap-3 tablet:grid-cols-2">
        {text('name', 'Nama kantor')}
        {text('phone', 'Telepon')}
        {text('address', 'Alamat')}
        {text('hours', 'Jam layanan', 'Contoh: Senin–Jumat 08.00–16.00 WIB')}
      </div>
      <Field
        label="Foto kantor (opsional)"
        htmlFor={`${id}-foto`}
        hint="Unggah dulu di Aset Website dengan jenis Foto."
        error={errors[`offices.${index}.imageUrl`]}
      >
        <Select
          id={`${id}-foto`}
          value={office.imageUrl ?? ''}
          onChange={(event) => onChange({ ...office, imageUrl: event.target.value || null })}
        >
          <option value="">Tanpa foto</option>
          {stored ? <option value={office.imageUrl ?? ''}>Foto tersimpan sebelumnya</option> : null}
          {photos.map((photo) => (
            <option key={photo.url} value={photo.url}>
              {photo.name}
            </option>
          ))}
        </Select>
      </Field>
    </li>
  );
}

export function OfficesEditorPage() {
  const assets = useAssets();
  const photos = (assets.data?.data ?? []).filter((asset) => asset.kind === 'foto');
  return (
    <DocumentEditor
      title="Lokasi Kantor"
      description="Alamat, jam layanan, telepon, dan foto kantor. Isi hanya alamat dan kontak resmi."
      query={useCompanySection('offices')}
      save={useSaveCompanySection('offices')}
      schema={companyProfileSections.offices}
      empty={emptySection.offices}
      normalize={(draft) => ({ offices: draft.offices.map(trimOffice) })}
      publicPath="/tentang/kantor"
    >
      {(draft, setDraft, errors) => {
        const set = (offices: Office[]) => setDraft({ offices });
        const blank: Office = {
          id: `kantor-${Date.now()}`,
          name: '',
          address: '',
          hours: '',
          phone: '',
          imageUrl: null,
        };
        return (
          <ListFieldset
            legend="Kantor"
            empty={draft.offices.length === 0}
            addLabel="Tambah kantor"
            onAdd={() => set([...draft.offices, blank])}
          >
            <ol className="flex flex-col gap-4">
              {draft.offices.map((office, index) => (
                <OfficeRow
                  key={office.id}
                  office={office}
                  index={index}
                  count={draft.offices.length}
                  photos={photos}
                  errors={errors}
                  onChange={(next) =>
                    set(draft.offices.map((item, i) => (i === index ? next : item)))
                  }
                  onMove={(delta) => set(moveItem(draft.offices, index, delta))}
                  onRemove={() => set(draft.offices.filter((_, i) => i !== index))}
                />
              ))}
            </ol>
          </ListFieldset>
        );
      }}
    </DocumentEditor>
  );
}
