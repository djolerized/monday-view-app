import { FileGroup } from '../types';
import { GROUP_LABELS, GROUP_ORDER, GROUP_COLORS } from '../utils/fileTypes';

interface Props {
  totalCount: number;
  groupCounts: Partial<Record<FileGroup, number>>;
}

export function MetaSummary({ totalCount, groupCounts }: Props) {
  return (
    <div className="meta-summary">
      <span className="meta-total">{totalCount} file{totalCount !== 1 ? 's' : ''}</span>
      {GROUP_ORDER.filter(g => groupCounts[g]).map(group => (
        <span
          key={group}
          className="meta-chip"
          style={{ backgroundColor: GROUP_COLORS[group] + '20', color: GROUP_COLORS[group] }}
        >
          {groupCounts[group]} {GROUP_LABELS[group]}
        </span>
      ))}
    </div>
  );
}
