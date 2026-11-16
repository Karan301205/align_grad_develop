import { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import BarRow from '../../components/ui/BarRow.jsx';
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel.jsx';
import { EmptyState } from '../../components/ui/States.jsx';

const TOP = 8;

/** A ranked list of skills. Bars are scaled to the top skill so small shares stay readable. */
export default function SkillRanking({ title, subtitle, items, unit, tone, empty }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? items : items.slice(0, TOP);
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <Panel>
      <PanelHeader title={title} subtitle={subtitle} />
      {items.length === 0 ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
        <>
          <PanelBody className="space-y-3.5">
            {shown.map((item) => (
              <BarRow
                key={item.name}
                label={item.name}
                display={`${item.count} ${item.count === 1 ? unit.one : unit.many} · ${item.percentage}%`}
                percent={(item.count / max) * 100}
                tone={tone}
              />
            ))}
          </PanelBody>
          {items.length > TOP && (
            <div className="border-t border-line px-4 py-3 text-center">
              <Button size="sm" onClick={() => setShowAll((value) => !value)}>
                {showAll ? `Show top ${TOP} only` : `Show all ${items.length} skills`}
              </Button>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
