import { useRef } from 'react';
import { MAJOR_INDUSTRIES } from '../../../../constants/industries';
import AccountIcon from '../../components/AccountIcon';
import { MUTED, SECONDARY_BUTTON } from '../../components/accountStyles';
import { COMPANY_SIZES, DESCRIPTION_MAX, companySizeLabel } from '../constants';
import { keepDigits, keepUrlChars, withProtocol } from '../validation';
import LocationInput from './LocationInput';
import { Card, CardTitle, Details, Field, LockedNote } from './ui';
import { SelectControl, Spinner } from '../../components/AccountControls';
import { controlClass, errorProps } from '../../components/formControls';

/** 64px company mark: the uploaded logo, or the first letter of the name on blue. */
function CompanyMark({ name, logoUrl, uploading }) {
  return (
    <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#1447E6] text-[26px] font-bold text-white">
      {logoUrl ? (
        <img src={logoUrl} alt="Company logo" className="size-full border border-[#E4E6EA] bg-white object-contain p-1" />
      ) : (
        <span aria-hidden="true">{(name || '?').trim().charAt(0).toUpperCase() || '?'}</span>
      )}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <Spinner className="border-[#1447E6]" />
        </div>
      )}
    </div>
  );
}

function ReadOnlyCompany({ values, logoUrl, lockedLabel }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <CardTitle id="company-title">Company</CardTitle>
        <LockedNote>{lockedLabel}</LockedNote>
      </div>
      <div className="flex items-center gap-4">
        <CompanyMark name={values.name} logoUrl={logoUrl} />
        <span className={`text-[13px] ${MUTED}`}>{logoUrl ? 'Company logo' : 'No logo uploaded'}</span>
      </div>
      <Details
        items={[
          { label: 'Company name', value: values.name },
          { label: 'Industry', value: values.industry },
          { label: 'Company size', value: companySizeLabel(values.companySize) },
          { label: 'Headquarters location', value: values.location },
          { label: 'Founded', value: values.foundedYear },
          { label: 'Website', value: values.website.replace(/^https?:\/\//i, '').replace(/\/$/, ''), href: withProtocol(values.website) },
          { label: 'About', value: values.description, multiline: true, wide: true }
        ]}
      />
    </>
  );
}

function EditableCompany({ values, setField, errors, logoUrl, uploadingLogo, onLogoUpload }) {
  const logoInput = useRef(null);
  // A company may have a custom industry from the old free-text field; keep it selectable.
  const industries = !values.industry || MAJOR_INDUSTRIES.includes(values.industry)
    ? MAJOR_INDUSTRIES
    : [values.industry, ...MAJOR_INDUSTRIES];
  const text = (id) => ({
    id,
    value: values[id],
    ...errorProps(id, errors[id]),
    className: controlClass(errors[id])
  });

  return (
    <>
      <CardTitle id="company-title">Company</CardTitle>

      <div className="flex flex-wrap items-center gap-4">
        <CompanyMark name={values.name} logoUrl={logoUrl} uploading={uploadingLogo} />
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <input ref={logoInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onLogoUpload} />
          <button type="button" disabled={uploadingLogo} onClick={() => logoInput.current?.click()} className={`${SECONDARY_BUTTON} h-9 px-3`}>
            <AccountIcon name="upload" size={16} />
            {uploadingLogo ? 'Uploading…' : logoUrl ? 'Change logo' : 'Upload logo'}
          </button>
          <span className={`text-[13px] ${MUTED}`}>JPG, PNG or WebP, up to 2MB. Square images work best.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
        <Field id="name" label="Company name" required error={errors.name}>
          <input {...text('name')} type="text" placeholder="e.g. Acme Technologies" onChange={(event) => setField('name', event.target.value)} />
        </Field>
        <Field id="industry" label="Industry" required error={errors.industry}>
          <SelectControl
            id="industry"
            value={values.industry}
            placeholder="Select your industry"
            options={industries.map((name) => [name, name])}
            onChange={(value) => setField('industry', value)}
            error={errors.industry}
          />
        </Field>
        <Field id="companySize" label="Company size" required error={errors.companySize}>
          <SelectControl
            id="companySize"
            value={values.companySize}
            placeholder="Select company size"
            options={COMPANY_SIZES}
            onChange={(value) => setField('companySize', value)}
            error={errors.companySize}
          />
        </Field>
        <Field id="location" label="Headquarters location" required error={errors.location}>
          <LocationInput id="location" value={values.location} error={errors.location} onChange={(value) => setField('location', value)} />
        </Field>
        <Field id="foundedYear" label="Founded" error={errors.foundedYear}>
          <input
            {...text('foundedYear')}
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="e.g. 2019"
            onChange={(event) => setField('foundedYear', keepDigits(event.target.value, 4))}
          />
        </Field>
        <Field id="website" label="Website" required error={errors.website}>
          <input
            {...text('website')}
            type="text"
            inputMode="url"
            placeholder="https://company.com"
            onChange={(event) => setField('website', keepUrlChars(event.target.value))}
          />
        </Field>
      </div>

      <Field
        id="description"
        label="About"
        required
        error={errors.description}
        hint={<span className={`text-right text-xs ${MUTED}`}>{values.description.length}/{DESCRIPTION_MAX}</span>}
      >
        <textarea
          id="description"
          rows={4}
          maxLength={DESCRIPTION_MAX}
          placeholder="What does your company do, and what is it like to work there?"
          value={values.description}
          onChange={(event) => setField('description', event.target.value)}
          {...errorProps('description', errors.description)}
          className={controlClass(errors.description, 'block resize-y px-3 py-2.5 leading-relaxed')}
        />
      </Field>
    </>
  );
}

/** Company card: read-only while under review or approved, a form otherwise. */
export default function CompanyCard({ locked, lockedLabel, ...props }) {
  return (
    <Card labelledBy="company-title" className="gap-[18px]">
      {locked ? <ReadOnlyCompany values={props.values} logoUrl={props.logoUrl} lockedLabel={lockedLabel} /> : <EditableCompany {...props} />}
    </Card>
  );
}
