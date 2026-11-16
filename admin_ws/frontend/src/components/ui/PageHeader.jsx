import { ArrowLeft } from 'lucide-react';
import Button from './Button.jsx';

/** `back` = { label, onClick } shows a "← label" button above the title (detail pages). */
export default function PageHeader({ title, description, actions, back, children }) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {back && (
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={back.onClick} className="-ml-2.5 mb-1">
            {back.label}
          </Button>
        )}
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-muted">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
