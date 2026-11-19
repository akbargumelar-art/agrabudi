import { companyProfileSections, type CompanyProfile } from '@agrabudi/contracts';
import { Field, Input, Select } from '@agrabudi/ui';
import { useId } from 'react';
import { emptySection } from './CompanyPages';
import { useCompanySection, useSaveCompanySection } from './data/queries';
import { DocumentEditor } from './editors';
import { InlineError, ListFieldset, RowActions, moveItem } from './list-fields';

type Channel = CompanyProfile['channels'][number];

const channelKindLabel: Record<Channel['kind'], string> = {
  whatsapp: 'WhatsApp',
  phone: 'Telepon',
  email: 'Email',
  instagram: 'Instagram',
  facebook: 'Facebook',
  website: 'Website',
};

function ChannelRow({
  channel,
  index,
  count,
  errors,
  onChange,
  onMove,
  onRemove,
}: {
  channel: Channel;
  index: number;
  count: number;
  errors: Record<string, string>;
  onChange: (next: Channel) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const id = useId();
  return (
    <li className="grid gap-3 border-t border-surface-100 pt-3 first:border-t-0 first:pt-0 tablet:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_auto] tablet:items-end">
      <Field label="Jenis" htmlFor={`${id}-jenis`}>
        <Select
          id={`${id}-jenis`}
          value={channel.kind}
          onChange={(event) =>
            onChange({ ...channel, kind: event.target.value as Channel['kind'] })
          }
        >
          {Object.entries(channelKindLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Label" htmlFor={`${id}-label`} error={errors[`channels.${index}.label`]}>
        <Input
          id={`${id}-label`}
          value={channel.label}
          onChange={(event) => onChange({ ...channel, label: event.target.value })}
        />
      </Field>
      <Field
        label="Nomor atau alamat"
        htmlFor={`${id}-nilai`}
        error={errors[`channels.${index}.value`]}
      >
        <Input
          id={`${id}-nilai`}
          value={channel.value}
          onChange={(event) => onChange({ ...channel, value: event.target.value })}
        />
      </Field>
      <RowActions
        label={`kanal ${index + 1}`}
        index={index}
        count={count}
        onMove={onMove}
        onRemove={onRemove}
      />
    </li>
  );
}

export function ChannelsEditorPage() {
  return (
    <DocumentEditor
      title="Hubungi Kami"
      description="Kanal resmi yang tampil di halaman kontak. Satu jenis kanal satu kali."
      query={useCompanySection('channels')}
      save={useSaveCompanySection('channels')}
      schema={companyProfileSections.channels}
      empty={emptySection.channels}
      normalize={(draft) => ({
        channels: draft.channels.map((item) => ({
          ...item,
          label: item.label.trim(),
          value: item.value.trim(),
        })),
      })}
      publicPath="/kontak"
    >
      {(draft, setDraft, errors) => {
        const set = (channels: Channel[]) => setDraft({ channels });
        const unused = (Object.keys(channelKindLabel) as Channel['kind'][]).find(
          (kind) => !draft.channels.some((item) => item.kind === kind),
        );
        return (
          <ListFieldset
            legend="Kanal resmi"
            empty={draft.channels.length === 0}
            addLabel="Tambah kanal"
            onAdd={() =>
              set([...draft.channels, { kind: unused ?? 'whatsapp', label: '', value: '' }])
            }
          >
            <ol className="flex flex-col gap-3">
              {draft.channels.map((channel, index) => (
                <ChannelRow
                  key={index}
                  channel={channel}
                  index={index}
                  count={draft.channels.length}
                  errors={errors}
                  onChange={(next) =>
                    set(draft.channels.map((item, i) => (i === index ? next : item)))
                  }
                  onMove={(delta) => set(moveItem(draft.channels, index, delta))}
                  onRemove={() => set(draft.channels.filter((_, i) => i !== index))}
                />
              ))}
            </ol>
            <InlineError message={errors.channels} />
          </ListFieldset>
        );
      }}
    </DocumentEditor>
  );
}
