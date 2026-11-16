import { Briefcase, Building2, CalendarDays, FileText, Files, Globe, UserRound } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import DetailList from '../../components/ui/DetailList.jsx';
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel.jsx';
import { EmptyState } from '../../components/ui/States.jsx';
import SafeLink from '../../components/SafeLink.jsx';
import { formatDate, formatDateTime, isEmail, safeUrl } from '../../utils/format.js';
import DecisionCard from './DecisionCard.jsx';

// A plain address becomes a mail link; anything else is shown as text so it can't alter the link.
const mail = (address) => (isEmail(address) ? <a href={`mailto:${address.trim()}`} className="break-all font-semibold text-accent-ink hover:underline">{address}</a> : address);
const link = (url) => (safeUrl(url) ? <SafeLink href={url}>{url}</SafeLink> : '');

// One row of the "At a glance" list: an icon, a small label over the value, and an optional action.
// (A plain list: a <dl> may only hold <dt>/<dd> directly, and these rows also hold an icon and a button.)
function Fact({ icon: Icon, label, value, action }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-subtle text-ink-2">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-muted">{label}</span>
        <span className="block text-sm font-semibold">{value}</span>
      </div>
      {action}
    </li>
  );
}

/**
 * The Overview tab, in one column so it fits the drawer: the decision card first (the only place the
 * approve / reject buttons live), the numbers at a glance, then the sections (about, profile, contact,
 * online presence). `onDraftChange(true)` is called while a rejection reason is being typed.
 */
export default function CompanyOverview({ company, onUpdated, onOpenTab, onDraftChange }) {
  const info = company.company;
  const jobs = (company.jobs || []).length;
  const docs = (company.verificationDocs || []).length;
  const reviewedAt = formatDateTime(company.verificationReviewedAt);

  return (
    <div className="space-y-4">
      <DecisionCard company={company} onUpdated={onUpdated} onDraftChange={onDraftChange} />

      <Panel>
        <PanelHeader icon={CalendarDays} title="At a glance" />
        <ul className="divide-y divide-line">
          <Fact
            icon={Briefcase}
            label="Jobs posted"
            value={jobs}
            action={jobs > 0 && <Button size="sm" variant="ghost" onClick={() => onOpenTab('jobs')}>View</Button>}
          />
          <Fact
            icon={Files}
            label="Documents uploaded"
            value={docs}
            action={docs > 0 && <Button size="sm" variant="ghost" onClick={() => onOpenTab('verification')}>View</Button>}
          />
          <Fact icon={CalendarDays} label="Registered" value={formatDate(company.registeredAt) || '—'} />
          <Fact icon={CalendarDays} label="Documents submitted" value={formatDateTime(company.verificationSubmittedAt) || 'Not yet'} />
          <Fact icon={CalendarDays} label="Last decision" value={reviewedAt ? `${reviewedAt}${company.verificationReviewedBy ? ` by ${company.verificationReviewedBy}` : ''}` : 'No decision yet'} />
        </ul>
      </Panel>

      {!info ? (
        <Panel>
          <EmptyState icon={Building2}>This recruiter has not created a company profile yet.</EmptyState>
        </Panel>
      ) : (
        <>
          <Panel>
            <PanelHeader icon={FileText} title="About the company" subtitle="In the company's own words" />
            <PanelBody>
              {info.description ? (
                <p className="whitespace-pre-line break-words text-sm leading-relaxed text-ink-2">{info.description}</p>
              ) : (
                <p className="text-sm text-muted">The company has not written a description yet.</p>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader icon={Building2} title="Company profile" subtitle="The basics" />
            <PanelBody>
              <DetailList
                items={[
                  ['Industry', info.industry],
                  ['Company size', info.companySize],
                  ['Founded', info.foundedYear],
                  ['Headquarters', info.location]
                ]}
              />
            </PanelBody>
          </Panel>

          <div className="grid gap-4 md:grid-cols-2">
            <Panel>
              <PanelHeader icon={UserRound} title="Contact" subtitle="Who to reach" />
              <PanelBody>
                <DetailList
                  columns={1}
                  items={[
                    ['Recruiter', info.recruiterName],
                    ['Designation', info.recruiterDesignation],
                    ['Official email', mail(info.officialEmail)],
                    ['Sign-in email', mail(company.email)]
                  ]}
                />
              </PanelBody>
            </Panel>
            <Panel>
              <PanelHeader icon={Globe} title="Online presence" subtitle="Check these match the documents" />
              <PanelBody>
                <DetailList
                  columns={1}
                  items={[
                    ['Website', link(info.website)],
                    ['LinkedIn', link(info.linkedin)]
                  ]}
                />
              </PanelBody>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
