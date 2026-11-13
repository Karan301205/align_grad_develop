import { useRef } from 'react';
import AccountIcon from '../../components/AccountIcon';
import { MUTED } from '../../components/accountStyles';
import { MAX_OFFICE_PHOTOS } from '../constants';
import { keepUrlChars, withProtocol } from '../validation';
import { Card, Details, Field } from './ui';
import { Spinner } from '../../components/AccountControls';
import { controlClass, errorProps } from '../../components/formControls';

// Empty grey tiles after "Add photos" so a short gallery keeps the design's 3-up row.
const MIN_TILES = 3;

function PhotoTile({ url, index, removing, onRemove }) {
  return (
    <li className="group relative h-[110px] overflow-hidden rounded-[10px] bg-[#F1F3F6]">
      <img src={url} alt={`Office photo ${index + 1}`} className="size-full object-cover" />
      <button
        type="button"
        onClick={() => onRemove(url)}
        disabled={removing}
        aria-label={`Remove office photo ${index + 1}`}
        className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/95 text-[#B91C1C] opacity-0 shadow-sm transition-opacity hover:bg-white focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[#1447E6] group-hover:opacity-100 disabled:opacity-100"
      >
        {removing ? <Spinner className="border-[#B91C1C]" /> : <AccountIcon name="close" size={16} strokeWidth={2} />}
      </button>
    </li>
  );
}

/**
 * LinkedIn page + office photos. Photos save immediately (PUT /recruiter/company/photos)
 * and stay editable in every state; LinkedIn is part of the profile, so it saves on
 * submit and locks with the rest of the details.
 */
export default function ShowcaseCard({ linkedin, onLinkedinChange, linkedinError, locked, photos, uploading, removingUrl, onUpload, onRemove }) {
  const fileInput = useRef(null);
  const canAdd = photos.length < MAX_OFFICE_PHOTOS;
  const fillers = Math.max(0, MIN_TILES - photos.length - (canAdd ? 1 : 0));

  return (
    <Card labelledBy="showcase-title" className="gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 id="showcase-title" className="m-0 text-base leading-[1.45] tracking-normal text-[#0F172A]">
          <span className="font-semibold">Show candidates where they’ll work</span>
        </h2>
        <span className={MUTED}>Office photos save straight away and can be changed any time, even during review.</span>
      </div>

      {locked ? (
        <Details items={[{ label: 'Company LinkedIn page', value: linkedin.replace(/^https?:\/\//i, ''), href: withProtocol(linkedin), wide: true }]} />
      ) : (
        <Field id="linkedin" label="Company LinkedIn page" error={linkedinError}>
          <input
            id="linkedin"
            type="text"
            inputMode="url"
            placeholder="https://linkedin.com/company/…"
            value={linkedin}
            onChange={(event) => onLinkedinChange(keepUrlChars(event.target.value))}
            {...errorProps('linkedin', linkedinError)}
            className={controlClass(linkedinError)}
          />
        </Field>
      )}

      <div className="flex flex-col gap-2">
        <span className="font-semibold">Office photos</span>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={onUpload} />
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-2.5 p-0">
          {photos.map((url, index) => (
            <PhotoTile key={url} url={url} index={index} removing={removingUrl === url} onRemove={onRemove} />
          ))}
          {canAdd && (
            <li>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="flex h-[110px] w-full flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#9CA3AF] bg-[#F8F8F6] font-(family-name:--font-headline) text-sm font-semibold text-[#334155] transition-colors hover:bg-[#F1F3F6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1447E6] disabled:cursor-wait"
              >
                {uploading ? <Spinner className="size-5 border-[#1447E6]" /> : <AccountIcon name="plus" size={22} />}
                {uploading ? 'Uploading…' : 'Add photos'}
              </button>
            </li>
          )}
          {Array.from({ length: fillers }, (_, index) => (
            <li key={`filler-${index}`} aria-hidden="true" className="hidden h-[110px] rounded-[10px] bg-[#F1F3F6] sm:block" />
          ))}
        </ul>
        <span className={`text-[13px] ${MUTED}`}>
          {photos.length} of {MAX_OFFICE_PHOTOS} photos. Show your workspace, team and building entrance. JPG, PNG or WebP, up to 10MB each.
        </span>
      </div>
    </Card>
  );
}
