import { digiposInfoSchema, type DigiposInfo } from '@agrabudi/contracts';
import { useDigiposInfo, useSaveDigiposInfo } from './data/queries';
import { DocumentEditor } from './editors';
import { TextListField } from './list-fields';

const empty: DigiposInfo = { requirements: [], steps: [] };

/**
 * Teks halaman Daftar Digipos di website Publik. Data pendaftar dan verifikasinya tetap
 * milik Admin operasional (menu Pendaftaran Digipos), tidak tampil di sini.
 */
export function DigiposInfoPage() {
  return (
    <DocumentEditor
      title="Daftar Digipos"
      description="Syarat dan langkah pendaftaran yang tampil di website Publik. Data pendaftar tidak dikelola di sini."
      query={useDigiposInfo()}
      save={useSaveDigiposInfo()}
      schema={digiposInfoSchema}
      empty={empty}
      normalize={(draft) => ({
        requirements: draft.requirements.map((item) => item.trim()).filter(Boolean),
        steps: draft.steps.map((item) => item.trim()).filter(Boolean),
      })}
      publicPath="/digipos"
    >
      {(draft, setDraft, errors) => (
        <>
          <TextListField
            legend="Syarat pendaftaran"
            itemLabel="Syarat"
            items={draft.requirements}
            onChange={(requirements) => setDraft({ ...draft, requirements })}
            errors={errors}
            errorPrefix="requirements"
          />
          <TextListField
            legend="Langkah pendaftaran"
            hint="Ditampilkan berurutan dengan nomor."
            itemLabel="Langkah"
            items={draft.steps}
            onChange={(steps) => setDraft({ ...draft, steps })}
            errors={errors}
            errorPrefix="steps"
          />
        </>
      )}
    </DocumentEditor>
  );
}
