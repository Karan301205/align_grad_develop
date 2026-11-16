import { ExternalLink } from 'lucide-react';
import { safeUrl } from '../utils/format.js';

/** A link to a user-supplied address. Renders nothing unless it is an http(s) URL. */
export default function SafeLink({ href, icon: Icon, title, children, className = '' }) {
  const url = safeUrl(href);
  if (!url) return null;
  return (
    <a
      href={url}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex max-w-full items-center gap-1 font-semibold text-accent-ink hover:underline ${className}`}
    >
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      <span className="truncate">{children}</span>
      <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
    </a>
  );
}
