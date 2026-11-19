import { companyProfileSections, type CompanyProfile } from '@agrabudi/contracts';
import { Field, Input } from '@agrabudi/ui';
import { useId } from 'react';
import { emptySection } from './CompanyPages';
import { useCompanySection, useSaveCompanySection } from './data/queries';
import { DocumentEditor } from './editors';
import { ListFieldset, RowActions, moveItem } from './list-fields';
import { PhotoField, usePhotoAssets, type Photo } from './photo-field';

type Office = CompanyProfile['offices'][number];

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
      <PhotoField
        id={`${id}-foto`}
        label="Foto kantor (opsional)"
        value={office.imageUrl}
        photos={photos}
        error={errors[`offices.${index}.imageUrl`]}
        onChange={(imageUrl) => onChange({ ...office, imageUrl })}
      />
    </li>
  );
}

export function OfficesEditorPage() {
  const photos = usePhotoAssets();
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
