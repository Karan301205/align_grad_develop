import { useState } from 'react';
import AccountIcon from '../../components/AccountIcon';
import { FieldError } from '../../components/AccountControls';
import { MUTED, SECONDARY_BUTTON } from '../../components/accountStyles';
import { controlClass, errorProps } from '../../components/formControls';
import ScreeningEditor from '../components/ScreeningEditor';
import { Field, StepFooter, StepPanel, SubSection } from '../components/ui';

function Rounds({ rounds, onChange }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [problem, setProblem] = useState('');

  const add = () => {
    if (!name.trim() || !desc.trim()) return setProblem('Add both the round name and what happens in it.');
    onChange([...rounds, { name: name.trim(), description: desc.trim() }]);
    setName('');
    setDesc('');
    setProblem('');
    return undefined;
  };
  const onEnter = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      add();
    }
  };

  return (
    <SubSection id="rounds-title" title="Selection rounds" note="optional" intro="In the order candidates go through them.">
      {rounds.length > 0 && (
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {rounds.map((round, index) => (
            <li key={`${round.name}-${index}`} className="flex items-start gap-3 rounded-[10px] border border-[#E4E6EA] px-4 py-3">
              <span className="pt-px text-[13px] font-bold text-[#0F7A55]">#{index + 1}</span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="break-words font-semibold">{round.name}</span>
                <span className={`break-words text-[13px] ${MUTED}`}>{round.description}</span>
              </div>
              <button
                type="button"
                onClick={() => onChange(rounds.filter((_, i) => i !== index))}
                aria-label={`Remove ${round.name}`}
                className="flex size-9 shrink-0 items-center justify-center rounded-[8px] text-[#B91C1C] hover:bg-[#FEF2F2]"
              >
                <AccountIcon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ol>
      )}
      <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Round name</span>
          <input type="text" maxLength={120} placeholder={`e.g. Round ${rounds.length + 1} · Manager`} value={name} onChange={(event) => setName(event.target.value)} onKeyDown={onEnter} className={controlClass(problem && !name.trim())} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">What happens</span>
          <input type="text" maxLength={300} placeholder="e.g. 30-minute case discussion" value={desc} onChange={(event) => setDesc(event.target.value)} onKeyDown={onEnter} className={controlClass(problem && !desc.trim())} />
        </label>
        <button type="button" onClick={add} className={`${SECONDARY_BUTTON} h-11 px-4`}>
          + Add round
        </button>
      </div>
      {problem && <FieldError id="rounds-error">{problem}</FieldError>}
    </SubSection>
  );
}

export default function ProcessStep({ form }) {
  const { values: v, setField, errors } = form;
  return (
    <StepPanel
      id="step-title"
      title="How will you hire?"
      intro="Candidates see the job description and rounds before they apply. The rounds also show up when you track each applicant."
    >
      <div className="flex flex-col gap-4">
        <Field id="description" label="What the job is about" required error={errors.description} hint="Two or three lines a fresher will understand.">
          <textarea
            id="description"
            rows={3}
            maxLength={5000}
            value={v.description}
            placeholder="What will this person work on, and with whom?"
            onChange={(event) => setField('description', event.target.value)}
            {...errorProps('description', errors.description)}
            className={controlClass(errors.description, 'resize-y px-3 py-2.5 leading-relaxed')}
          />
        </Field>
        <Field id="responsibilities" label="Day-to-day responsibilities" required error={errors.responsibilities} hint="One per line. Candidates see each on its own line.">
          <textarea
            id="responsibilities"
            rows={5}
            maxLength={5000}
            value={v.responsibilities}
            placeholder={'Clean and combine data from spreadsheets\nBuild weekly dashboards'}
            onChange={(event) => setField('responsibilities', event.target.value)}
            {...errorProps('responsibilities', errors.responsibilities)}
            className={controlClass(errors.responsibilities, 'resize-y px-3 py-2.5 leading-relaxed')}
          />
        </Field>
      </div>

      <Rounds rounds={v.rounds} onChange={(rounds) => setField('rounds', rounds)} />

      <SubSection
        id="questions-title"
        title="Screening questions"
        note="optional"
        intro="Candidates answer these when they apply. You’ll see the answers on each applicant."
      >
        <div id="field-screeningQuestions" className="flex flex-col gap-2">
          <ScreeningEditor questions={v.screeningQuestions} onChange={(questions) => setField('screeningQuestions', questions)} />
          {errors.screeningQuestions && <FieldError id="screeningQuestions-error">{errors.screeningQuestions}</FieldError>}
        </div>
      </SubSection>

      <StepFooter onBack={form.back} nextLabel="Continue to review" onNext={form.next} />
    </StepPanel>
  );
}
