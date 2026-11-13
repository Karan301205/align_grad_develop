import { useState } from 'react';
import { INDIAN_STATES } from '../../../../constants/indianStates';
import { controlClass } from '../../components/formControls';

/** Free-text location with a list of Indian cities/states to pick from. */
export default function LocationInput({ id, value, onChange, readOnly, error }) {
  const [open, setOpen] = useState(false);
  const query = value.trim().toLowerCase();
  const matches = INDIAN_STATES.filter((place) => place.toLowerCase().includes(query));
  const showList = open && !readOnly;
  const listId = `${id}-options`;

  const choose = (place) => {
    onChange(place);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete="off"
        readOnly={readOnly}
        placeholder="e.g. Bengaluru, Karnataka"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
        className={controlClass(error)}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-[8px] border border-[#E4E6EA] bg-white p-1 shadow-lg shadow-slate-200/60"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[#4B5563]">No matching places. Keep typing to use your own.</li>
          ) : (
            matches.map((place) => (
              <li key={place} role="option" aria-selected={place === value}>
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(place)}
                  className={`w-full rounded-[6px] px-3 py-2 text-left font-(family-name:--font-headline) text-sm transition-colors ${
                    place === value ? 'bg-[#EEF2FE] font-semibold text-[#1447E6]' : 'font-normal text-[#334155] hover:bg-[#F8F8F6]'
                  }`}
                >
                  {place}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
