import { useMemo, useState } from 'react';
import { Database, DollarSign, Files, HardDrive, RefreshCw } from 'lucide-react';
import { adminApi } from '../../api/adminApi.js';
import useResource from '../../hooks/useResource.js';
import Button from '../../components/ui/Button.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import KpiCard from '../../components/ui/KpiCard.jsx';
import Notice, { LoadError } from '../../components/ui/Notice.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pager from '../../components/ui/Pager.jsx';
import { Panel, PanelHeader } from '../../components/ui/Panel.jsx';
import Pill from '../../components/ui/Pill.jsx';
import SearchInput from '../../components/ui/SearchInput.jsx';
import { Loading } from '../../components/ui/States.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import SafeLink from '../../components/SafeLink.jsx';
import { matchesQuery, paginate } from '../../utils/collections.js';
import { formatDateTime, plural, usd } from '../../utils/format.js';

const PAGE_SIZE = 10;

function S3Section({ storage }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const files = useMemo(() => storage.files || [], [storage.files]);
  const matching = useMemo(() => files.filter((file) => matchesQuery([file.key, file.name, file.category], query)), [files, query]);
  const info = paginate(matching, page, PAGE_SIZE);
  const categories = Object.entries(storage.categories || {});

  return (
    <div className="space-y-4">
      <section aria-label="S3 totals" className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Total space used" value={storage.formattedTotalBytes || '0 Bytes'} hint="All files in the bucket" icon={HardDrive} />
        <KpiCard label="Estimated monthly bill" value={usd(storage.estimatedMonthlyBill)} hint="At the Standard S3 rate ($0.023/GB)" icon={DollarSign} tone="ok" />
        <KpiCard label="Objects stored" value={storage.totalFiles || 0} hint="Files in the bucket" icon={Files} tone="info" />
      </section>

      <Panel>
        <PanelHeader title="Usage by category" subtitle="Bucket files grouped by what they are" />
        <DataTable
          caption="S3 usage by category"
          rows={categories}
          rowKey={([key]) => key}
          empty="No files are stored yet."
          columns={[
            { header: 'Asset type', render: ([, c]) => <span className="font-semibold">{c.name}</span> },
            { header: 'Files', align: 'right', render: ([, c]) => c.count },
            { header: 'Space', align: 'right', render: ([, c]) => c.formattedBytes },
            { header: 'Est. cost / month', align: 'right', render: ([, c]) => usd(c.cost, 6) }
          ]}
        />
      </Panel>

      <Panel>
        <PanelHeader title="Bucket files" subtitle={`${plural(files.length, 'file')} in ${storage.bucketName || 'the bucket'}`} />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <SearchInput
            className="w-full sm:w-80"
            value={query}
            onChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            placeholder="Search file name or folder"
          />
          <span className="text-[12.5px] text-muted">{plural(matching.length, 'file')}</span>
        </div>
        <DataTable
          caption="Bucket files"
          rows={info.rows}
          rowKey={(file) => file.key}
          empty={files.length === 0 ? 'No files are stored yet.' : 'No files match this search.'}
          columns={[
            {
              header: 'File',
              render: (file) => (
                <span className="block max-w-xs truncate font-semibold" title={file.key}>
                  {file.name}
                </span>
              )
            },
            { header: 'Category', render: (file) => <Pill tone="accent">{file.category}</Pill> },
            { header: 'Size', align: 'right', render: (file) => file.formattedSize },
            { header: 'Last modified', render: (file) => formatDateTime(file.lastModified) || '—' },
            {
              header: 'Actions',
              hideHeader: true,
              align: 'right',
              render: (file) => <SafeLink href={file.url}>Open file</SafeLink>
            }
          ]}
        />
        <Pager info={info} onPage={setPage} />
      </Panel>
    </div>
  );
}

function DatabaseSection({ storage }) {
  const db = storage.databaseStats;
  if (!db) {
    return (
      <Panel>
        <PanelHeader title="PostgreSQL" />
        <Notice tone="info" className="m-4">
          Database figures aren’t available right now.
        </Notice>
      </Panel>
    );
  }
  return (
    <div className="space-y-4">
      <section aria-label="Database totals" className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Database size" value={db.formattedStorageSize || '0 Bytes'} hint="Disk used by table data" icon={Database} />
        <KpiCard label="Estimated monthly bill" value={usd(db.estimatedMonthlyBill)} hint="At a reference rate of $0.10/GB" icon={DollarSign} tone="ok" />
        <KpiCard label="Index size" value={db.formattedIndexSize || '0 Bytes'} hint="Lookup indexes" icon={HardDrive} tone="info" />
      </section>

      <Panel>
        <PanelHeader title="Usage by table" subtitle={`${db.dbName || 'Database'} · ${plural(db.totalDocuments || 0, 'row')} in total`} />
        <DataTable
          caption="Database usage by table"
          rows={db.collections || []}
          rowKey={(table) => table.name}
          empty="No tables were found."
          columns={[
            { header: 'Table', render: (t) => <span className="font-semibold">{t.name}</span> },
            { header: 'Rows', align: 'right', render: (t) => t.count },
            { header: 'Data size', align: 'right', render: (t) => t.formattedSize },
            { header: 'Index size', align: 'right', render: (t) => t.formattedIndexSize },
            { header: 'Est. cost / month', align: 'right', render: (t) => usd(t.cost, 6) }
          ]}
        />
      </Panel>
    </div>
  );
}

export default function StoragePage() {
  const storage = useResource(adminApi.getStorage);
  const [tab, setTab] = useState('s3');
  const data = storage.data;

  return (
    <>
      <PageHeader
        title="Storage explorer"
        description={
          data
            ? `AWS S3 bucket ${data.bucketName || '—'} (${data.region || '—'}) and the PostgreSQL database, with estimated monthly costs.`
            : 'What the platform stores in AWS S3 and PostgreSQL, with estimated monthly costs.'
        }
        actions={
          <Button icon={RefreshCw} loading={storage.loading} onClick={storage.reload}>
            Refresh
          </Button>
        }
      />

      {storage.error && <LoadError className="mb-4" what="the storage details" message={storage.error} onRetry={storage.reload} />}
      {data?.s3Unavailable && (
        <Notice tone="warning" className="mb-4">
          S3 details aren’t available right now, so the file figures below are empty.
        </Notice>
      )}

      {storage.loading && !data ? (
        <Loading>Analysing storage…</Loading>
      ) : (
        data && (
          <>
            <Panel className="mb-4">
              <Tabs
                label="Storage sections"
                value={tab}
                onChange={setTab}
                tabs={[
                  { key: 's3', label: 'AWS S3 files', count: data.totalFiles || 0 },
                  { key: 'database', label: 'PostgreSQL database' }
                ]}
              />
            </Panel>
            <div role="tabpanel" aria-label={tab === 's3' ? 'AWS S3 files' : 'PostgreSQL database'}>
              {tab === 's3' ? <S3Section storage={data} /> : <DatabaseSection storage={data} />}
            </div>
          </>
        )
      )}
    </>
  );
}
