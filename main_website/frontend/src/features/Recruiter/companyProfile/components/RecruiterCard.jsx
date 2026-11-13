import { keepEmailChars, keepLetters } from '../validation';
import { Card, CardTitle, Details, Field, LockedNote } from './ui';
import { controlClass, errorProps } from '../../components/formControls';

const FIELDS = [
  { id: 'recruiterName', label: 'Name', placeholder: 'e.g. Riya Sharma', filter: keepLetters, type: 'text', autoComplete: 'name' },
  { id: 'recruiterDesignation', label: 'Designation', placeholder: 'e.g. Talent acquisition lead', filter: keepLetters, type: 'text', autoComplete: 'organization-title' },
  { id: 'officialEmail', label: 'Work email', placeholder: 'you@gmail.com', filter: keepEmailChars, type: 'email', autoComplete: 'email' }
];

/** The person hiring for the company: read-only while locked, a form otherwise. */
export default function RecruiterCard({ values, setField, errors, locked, lockedLabel }) {
  return (
    <Card labelledBy="recruiter-title" className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <CardTitle id="recruiter-title">Recruiter</CardTitle>
        {locked && <LockedNote>{lockedLabel}</LockedNote>}
      </div>
      {locked ? (
        <Details items={FIELDS.map(({ id, label }) => ({ label, value: values[id] }))} />
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          {FIELDS.map((field) => (
            <Field key={field.id} id={field.id} label={field.label} required error={errors[field.id]}>
              <input
                id={field.id}
                type={field.type}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                value={values[field.id]}
                onChange={(event) => setField(field.id, field.filter(event.target.value))}
                {...errorProps(field.id, errors[field.id])}
                className={controlClass(errors[field.id])}
              />
            </Field>
          ))}
        </div>
      )}
    </Card>
  );
}
