import {
  companyProfileSections,
  pickCompanySection,
  emptyCompanyProfile,
  type CompanyProfile,
} from '@agrabudi/contracts';
import { Field, Input, Textarea } from '@agrabudi/ui';
import { useEffect, useId, useState } from 'react';
import { useCompanySection, useSaveCompanySection } from './data/queries';
import { DocumentEditor } from './editors';
import { InlineError, ListFieldset, RowActions, TextListField, moveItem } from './list-fields';
import { PhotoField, usePhotoAssets, type Photo } from './photo-field';

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

/** Teks isian → angka. Kosong = `null`; teks bukan angka = `NaN` supaya skema menolaknya. */
function parseCoordinate(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  // Koma desimal ("-6,73") diterima seperti titik.
  return /^-?\d+([.,]\d+)?$/.test(trimmed) ? Number(trimmed.replace(',', '.')) : Number.NaN;
}

/** "-6.7320, 108.5523" seperti yang disalin dari Google Maps. */
function parseCoordinatePair(text: string): { latitude: number; longitude: number } | null {
  const match = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(text);
  return match ? { latitude: Number(match[1]), longitude: Number(match[2]) } : null;
}

function CoordinateInput({
  id,
  value,
  onChange,
  onPastePair,
}: {
  id: string;
  value: number | null;
  onChange: (next: number | null) => void;
  onPastePair: (pair: { latitude: number; longitude: number }) => void;
}) {
  const [text, setText] = useState(value === null ? '' : String(value));
  // Ikuti nilai dari luar (muat ulang, tempel pasangan) tanpa menimpa ketikan yang setara.
  useEffect(() => {
    setText((current) =>
      Object.is(parseCoordinate(current), value) ? current : value === null ? '' : String(value),
    );
  }, [value]);
  return (
    <Input
      id={id}
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onPaste={(event) => {
        const pair = parseCoordinatePair(event.clipboardData.getData('text'));
        if (pair) {
          event.preventDefault();
          onPastePair(pair);
        }
      }}
      onChange={(event) => {
        setText(event.target.value);
        onChange(parseCoordinate(event.target.value));
      }}
    />
  );
}

function AreaRow({
  area,
  index,
  count,
  photos,
  errors,
  onChange,
  onMove,
  onRemove,
}: {
  area: Area;
  index: number;
  count: number;
  photos: Photo[];
  errors: Record<string, string>;
  onChange: (next: Area) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const pastePair = (pair: { latitude: number; longitude: number }) =>
    onChange({ ...area, ...pair });
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
      <div className="grid gap-3 tablet:grid-cols-2">
        <Field
          label="Lintang / latitude (opsional)"
          htmlFor={`${id}-lat`}
          hint='Contoh -6.7320. Bisa tempel "-6.7320, 108.5523" dari Google Maps.'
          error={errors[`areas.${index}.latitude`]}
        >
          <CoordinateInput
            id={`${id}-lat`}
            value={area.latitude}
            onChange={(latitude) => onChange({ ...area, latitude })}
            onPastePair={pastePair}
          />
        </Field>
        <Field
          label="Bujur / longitude (opsional)"
          htmlFor={`${id}-lng`}
          hint="Contoh 108.5523."
          error={errors[`areas.${index}.longitude`]}
        >
          <CoordinateInput
            id={`${id}-lng`}
            value={area.longitude}
            onChange={(longitude) => onChange({ ...area, longitude })}
            onPastePair={pastePair}
          />
        </Field>
      </div>
      <PhotoField
        id={`${id}-foto`}
        label="Foto wilayah (opsional)"
        value={area.imageUrl}
        photos={photos}
        error={errors[`areas.${index}.imageUrl`]}
        onChange={(imageUrl) => onChange({ ...area, imageUrl })}
      />
    </li>
  );
}

export function AreasEditorPage() {
  const photos = usePhotoAssets();
  return (
    <DocumentEditor
      title="Area Layanan"
      description="Wilayah, kecamatan, titik koordinat, dan foto wilayah yang tampil di website Publik."
      query={useCompanySection('areas')}
      save={useSaveCompanySection('areas')}
      schema={companyProfileSections.areas}
      empty={emptySection.areas}
      normalize={(draft) => ({
        areas: draft.areas.map((area) => ({
          ...area,
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
            onAdd={() =>
              set([
                ...draft.areas,
                { name: '', districts: [], latitude: null, longitude: null, imageUrl: null },
              ])
            }
          >
            <ol className="flex flex-col gap-3">
              {draft.areas.map((area, index) => (
                <AreaRow
                  key={index}
                  area={area}
                  index={index}
                  count={draft.areas.length}
                  photos={photos}
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
