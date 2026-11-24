import { useCallback, useMemo, useState } from 'react';
import { CircleCheck, Hourglass, Inbox, LifeBuoy, RefreshCw } from 'lucide-react';
import { useAdminData } from '../../app/AdminDataContext.jsx';
import { usePageActive } from '../../app/PageActiveContext.js';
import Button from '../../components/ui/Button.jsx';
import ColumnMenu, { MenuGroup, MenuOption } from '../../components/ui/ColumnMenu.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import KpiCard from '../../components/ui/KpiCard.jsx';
import { LoadError } from '../../components/ui/Notice.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pager from '../../components/ui/Pager.jsx';
import { Panel } from '../../components/ui/Panel.jsx';
import Pill from '../../components/ui/Pill.jsx';
import SearchInput from '../../components/ui/SearchInput.jsx';
import { Loading } from '../../components/ui/States.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import useNow from '../../hooks/useNow.js';
import { paginate } from '../../utils/collections.js';
import { formatDateTime, plural } from '../../utils/format.js';
import { ROLE_FILTERS, SUPPORT_TABS, countTickets, filterTickets, ticketStatusMeta, timeAgo, toSummary } from '../../utils/support.js';
import TicketDrawer from './TicketDrawer.jsx';

const PAGE_SIZE = 10;

const EMPTY = {
  OPEN: 'Nothing needs a reply right now.',
  PENDING: 'No tickets are waiting on a requester.',
  RESOLVED: 'No resolved tickets yet.',
  all: 'No one has raised a ticket yet.'
};

/**
 * Help & support tickets raised by candidates and recruiters in the main app. Opens on the tickets
 * that need a reply; a ticket opens in the drawer to read the conversation, reply (emailed to the
 * requester), resolve or reopen. The list comes from AdminDataContext and refreshes every 30 s.
 */
export default function SupportPage() {
  const { supportTickets } = useAdminData();
  const active = usePageActive();
  const now = useNow(30000);
  const [tab, setTab] = useState('OPEN');
  const [role, setRole] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const [order, setOrder] = useState(null); // ids the drawer steps through, fixed when it opened

  const list = useMemo(() => supportTickets.data || [], [supportTickets.data]);
  const counts = useMemo(() => countTickets(list), [list]);
  const filtered = useMemo(() => filterTickets(list, { tab, role, query }), [list, tab, role, query]);
  const info = paginate(filtered, page, PAGE_SIZE);

  // As on Companies: a ticket that leaves the tab because it was just answered or resolved stays in the
  // drawer, and Next still goes to the next one that was in the list when the drawer opened.
  const filteredIds = useMemo(() => filtered.map((t) => t.id), [filtered]);
  const sequence = order || filteredIds;
  const openIndex = openId ? sequence.indexOf(openId) : -1;
  const openTicket = openIndex >= 0 ? list.find((t) => t.id === openId) || null : null;

  const openDrawer = (id) => {
    setOrder(filteredIds);
    setOpenId(id);
  };
  const closeDrawer = () => {
    setOpenId(null);
    setOrder(null);
  };
  const goTo = (index) => {
    setOpenId(sequence[index]);
    setPage(Math.floor(index / PAGE_SIZE) + 1);
  };
  const changeTab = (key) => { setTab(key); setPage(1); };
  const changeRole = (key) => { setRole(key); setPage(1); };
  const changeQuery = (value) => { setQuery(value); setPage(1); };

  const { setData } = supportTickets;
  const updateTicket = useCallback(
    (ticket) => {
      const summary = toSummary(ticket);
      setData((current) => (current || []).map((t) => (t.id === summary.id ? { ...t, ...summary } : t)));
    },
    [setData]
  );

  const columns = [
    {
      header: 'Ticket',
      headerClassName: 'font-bold',
      render: (t) => (
        <div className="min-w-0 max-w-[320px]">
          <div className="truncate font-semibold" title={t.subject}>{t.subject}</div>
          <div className="truncate text-xs text-muted">{t.reference} · {t.categoryLabel}</div>
        </div>
      )
    },
    {
      header: 'From',
      headerClassName: 'font-bold',
      headerNode: (
        <ColumnMenu label="From" active={role !== 'all'}>
          <MenuGroup title="Show">
            {ROLE_FILTERS.map((r) => (
              <MenuOption key={r.key} name="support-from" checked={role === r.key} onSelect={() => changeRole(r.key)}>
                {r.label}
              </MenuOption>
            ))}
          </MenuGroup>
        </ColumnMenu>
      ),
      render: (t) => (
        <div className="min-w-0 max-w-[240px]">
          <div className="flex items-center gap-1.5">
            <span className="truncate" title={t.requester.name || t.requester.email}>{t.requester.name || t.requester.email || '—'}</span>
            <Pill tone={t.role === 'RECRUITER' ? 'accent' : 'neutral'}>{t.roleLabel}</Pill>
          </div>
          <div className="truncate text-xs text-muted" title={t.requester.email}>{t.requester.companyName || t.requester.email}</div>
        </div>
      )
    },
    {
      header: 'Status',
      headerClassName: 'font-bold',
      render: (t) => {
        const meta = ticketStatusMeta(t.status);
        return <Pill tone={meta.tone}>{meta.label}</Pill>;
      }
    },
    {
      header: 'Last activity',
      headerClassName: 'font-bold',
      render: (t) => (
        <div className="whitespace-nowrap">
          <div title={formatDateTime(t.lastMessageAt)}>{timeAgo(t.lastMessageAt, now)}</div>
          <div className="text-xs text-muted">{t.lastAuthor === 'ADMIN' ? 'You replied' : 'From the requester'}</div>
        </div>
      )
    },
    {
      header: 'Actions',
      hideHeader: true,
      align: 'right',
      render: (t) => (
        <Button size="sm" variant={t.status === 'OPEN' ? 'primary' : 'default'} aria-label={`${t.status === 'OPEN' ? 'Reply to' : 'Open'} ${t.reference}`} onClick={() => openDrawer(t.id)}>
          {t.status === 'OPEN' ? 'Reply' : 'Open'}
        </Button>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="Support tickets"
        description="Requests from candidates and companies. Open a ticket to read the conversation, reply by email, and resolve it."
        actions={
          <Button icon={RefreshCw} loading={supportTickets.loading} onClick={() => supportTickets.reload()}>
            Refresh
          </Button>
        }
      />

      {supportTickets.error && <LoadError className="mb-4" what="the support tickets" message={supportTickets.error} onRetry={() => supportTickets.reload()} />}

      <section aria-label="Ticket totals" className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Needs reply" value={counts.OPEN} hint="New, or the requester wrote again" icon={Inbox} tone="info" />
        <KpiCard label="Waiting on requester" value={counts.PENDING} hint="You replied last" icon={Hourglass} tone="warn" />
        <KpiCard label="Resolved" value={counts.RESOLVED} hint="Reopen if the requester writes again" icon={CircleCheck} tone="ok" />
        <KpiCard label="All tickets" value={counts.all} hint="Raised by candidates and companies" icon={LifeBuoy} />
      </section>

      <Panel>
        <Tabs label="Ticket status" value={tab} onChange={changeTab} tabs={SUPPORT_TABS.map((t) => ({ key: t.key, label: t.label, count: counts[t.key] ?? 0 }))} />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <SearchInput className="w-full sm:w-96" value={query} onChange={changeQuery} placeholder="Search subject, SUP number, name or email" />
          <span className="text-[12.5px] text-muted">{plural(filtered.length, 'ticket')} · latest activity first</span>
        </div>
        {supportTickets.loading && !supportTickets.data ? (
          <Loading>Loading tickets…</Loading>
        ) : (
          <>
            <DataTable
              caption="Support tickets"
              columns={columns}
              rows={info.rows}
              rowKey={(t) => t.id}
              onRowClick={(t) => openDrawer(t.id)}
              empty={list.length === 0 ? EMPTY.all : query || role !== 'all' ? 'No tickets match these filters.' : EMPTY[tab]}
            />
            <Pager info={info} onPage={setPage} />
          </>
        )}
      </Panel>

      {openTicket && active && (
        <TicketDrawer
          summary={openTicket}
          position={openIndex + 1}
          total={sequence.length}
          onPrev={() => goTo(openIndex - 1)}
          onNext={() => goTo(openIndex + 1)}
          onClose={closeDrawer}
          onUpdated={updateTicket}
        />
      )}
    </>
  );
}
