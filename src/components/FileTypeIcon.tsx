import { FileGroup } from '../types';
import { GROUP_ICONS, GROUP_COLORS } from '../utils/fileTypes';

interface Props {
  group: FileGroup;
  size?: number;
}

export function FileTypeIcon({ group, size = 36 }: Props) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        backgroundColor: GROUP_COLORS[group] + '20',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.5,
        flexShrink: 0,
      }}
    >
      {GROUP_ICONS[group]}
    </div>
  );
}
