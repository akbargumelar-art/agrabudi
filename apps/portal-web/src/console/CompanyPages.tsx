import {
  companyProfileSections,
  pickCompanySection,
  emptyCompanyProfile,
  type CompanyProfile,
} from '@agrabudi/contracts';
import { Field, Input, Textarea } from '@agrabudi/ui';
import { useId } from 'react';
import { useCompanySection, useSaveCompanySection } from './data/queries';
import { DocumentEditor } from './editors';
import { InlineError, ListFieldset, RowActions, TextListField, moveItem } from './list-fields';

export const emptySection = {
  about: pickCompanySection(emptyCompanyProfile, 'about'),
  areas: pickCompanySection(emptyCompanyProfile, 'areas'),
  offices: pickCompanySection(emptyCompanyProfile, 'offices'),
  channels: pickCompanySection(emptyCompanyProfile, 'channels'),
};

export function AboutEditorPage() {
  return (
    <DocumentEditor
      title="Tentang Kami"
      description="Profil, sejarah, visi, dan misi perusahaan. Isi hanya teks yang sudah disahkan."
      query={useCompanySection('about')}
      save={useSaveCompanySection('about')}
      schema={companyProfileSections.about}
      empty={emptySection.about}
      publicPath="/tentang"
    >
      {(draft, setDraft, errors) => (
        <>
          <TextListField
            legend="Profil perusahaan"
            itemLabel="Paragraf"
            items={draft.about}
            onChange={(about) => setDraft({ ...draft, about })}
            errors={errors}
            errorPrefix="about"
          />
          <TextListField
            legend="Sejarah"
            itemLabel="Paragraf"
            items={draft.history}
            onChange={(history) => setDraft({ ...draft, history })}
            errors={errors}
            errorPrefix="history"
          />
          <Field label="Visi" htmlFor="tentang-visi" error={errors.vision}>
            <Textarea
              id="tentang-visi"
              value={draft.vision}
              onChange={(event) => setDraft({ ...draft, vision: event.target.value })}
            />
          </Field>
          <TextListField
            legend="Misi"
            itemLabel="Misi"
            items={draft.missions}
            onChange={(missions) => setDraft({ ...draft, missions })}
            errors={errors}
            errorPrefix="missions"
          />
        </>
      )}
    </DocumentEditor>
  );
}

type Area = CompanyProfile['areas'][number];

function AreaRow({
  area,
  index,
  count,
  errors,
  onChange,
  onMove,
  onRemove,
}: {
  area: Area;
  index: number;
  count: number;
  errors: Record<string, string>;
  onChange: (next: Area) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const id = useId();
  return (
    <li className="flex flex-col gap-3 border-t border-surface-100 pt-3 first:border-t-0 first:pt-0">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Field
            label={`Nama wilayah ${index + 1}`}
            htmlFor={`${id}-nama`}
            error={errors[`areas.${index}.name`]}
          >
            <Input
              id={`${id}-nama`}
              value={area.name}
              onChange={(event) => onChange({ ...area, name: event.target.value })}
            />
          </Field>
        </div>
        <RowActions
          label={`wilayah ${index + 1}`}
          index={index}
          count={count}
          onMove={onMove}
          onRemove={onRemove}
        />
      </div>
      <Field label="Kecamatan" htmlFor={`${id}-kecamatan`} hint="Satu kecamatan per baris.">
        <Textarea
          id={`${id}-kecamatan`}
          value={area.districts.join('\n')}
          onChange={(event) =>
            onChange({
              ...area,
              districts: event.target.value.split('\n').map((line) => line.trimStart()),
            })
          }
        />
      </Field>
    </li>
  );
}

export function AreasEditorPage() {
  return (
    <DocumentEditor
      title="Area Layanan"
      description="Wilayah dan kecamatan layanan yang tampil di website Publik."
      query={useCompanySection('areas')}
      save={useSaveCompanySection('areas')}
      schema={companyProfileSections.areas}
      empty={emptySection.areas}
      normalize={(draft) => ({
        areas: draft.areas.map((area) => ({
          name: area.name.trim(),
          districts: area.districts.map((item) => item.trim()).filter(Boolean),
        })),
      })}
      publicPath="/tentang/area"
    >
      {(draft, setDraft, errors) => {
        const set = (areas: Area[]) => setDraft({ areas });
        return (
          <ListFieldset
            legend="Wilayah"
            empty={draft.areas.length === 0}
            addLabel="Tambah wilayah"
            onAdd={() => set([...draft.areas, { name: '', districts: [] }])}
          >
            <ol className="flex flex-col gap-3">
              {draft.areas.map((area, index) => (
                <AreaRow
                  key={index}
                  area={area}
                  index={index}
                  count={draft.areas.length}
                  errors={errors}
                  onChange={(next) =>
                    set(draft.areas.map((item, i) => (i === index ? next : item)))
                  }
                  onMove={(delta) => set(moveItem(draft.areas, index, delta))}
                  onRemove={() => set(draft.areas.filter((_, i) => i !== index))}
                />
              ))}
            </ol>
            <InlineError message={errors.areas} />
          </ListFieldset>
        );
      }}
    </DocumentEditor>
  );
}
