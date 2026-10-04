import { View } from 'react-native';
import { Typography } from 'heroui-native';
import { Circle, Path, Svg } from '@/components/ui/primitives/Svg';
import { formatMeasurement, measurementDate, type MeasurementEntry } from '@/lib/measurements';
import { fromKey, palette } from '@/lib/tracker';

export default function MeasurementChart({
  entries,
  unit,
}: {
  entries: MeasurementEntry[];
  unit: string;
}) {
  const values = entries.map((entry) => entry.value);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const padding = Math.max((high - low) * 0.2, 0.5);
  const min = Math.max(0, low - padding);
  const max = high + padding;
  const first = fromKey(entries[0].date).getTime();
  const last = fromKey(entries[entries.length - 1].date).getTime();
  const points = entries.map((entry) => ({
    x: last === first ? 160 : 10 + ((fromKey(entry.date).getTime() - first) / (last - first)) * 300,
    y: 180 - ((entry.value - min) / (max - min)) * 160,
  }));
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  return (
    <View
      className="gap-3"
      accessible
      accessibilityLabel={`Grafic cu ${entries.length} ${entries.length === 1 ? 'înregistrare' : 'înregistrări'}, de la ${formatMeasurement(entries[0].value)} la ${formatMeasurement(entries[entries.length - 1].value)} ${unit}`}
    >
      <View className="flex-row gap-2">
        <View className="justify-between py-4" style={{ width: 46, height: 200 }}>
          {[max, (min + max) / 2, min].map((value) => (
            <Typography key={value} type="body-xs" weight="normal" color="muted" numberOfLines={1}>
              {formatMeasurement(value)}
            </Typography>
          ))}
        </View>
        <View className="flex-1" style={{ height: 200 }}>
          <Svg width="100%" height={200} viewBox="0 0 320 200" preserveAspectRatio="none">
            {[20, 100, 180].map((y) => (
              <Path
                key={y}
                d={`M 0 ${y} L 320 ${y}`}
                stroke={palette.border}
                strokeWidth={1}
                strokeDasharray="4 6"
              />
            ))}
            {points.length > 1 && (
              <Path
                d={`${path} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`}
                fill={palette.peach}
              />
            )}
            <Path
              d={path}
              fill="none"
              stroke={palette.accent}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((point, index) => (
              <Circle
                key={entries[index].date}
                cx={point.x}
                cy={point.y}
                r={4}
                fill={palette.white}
                stroke={palette.accent}
                strokeWidth={2}
              />
            ))}
          </Svg>
        </View>
      </View>
      <View className="flex-row justify-between gap-2">
        <Typography type="body-xs" weight="normal" color="muted">
          {measurementDate(entries[0].date)}
        </Typography>
        {entries.length > 1 && (
          <Typography type="body-xs" weight="normal" color="muted">
            {measurementDate(entries[entries.length - 1].date)}
          </Typography>
        )}
      </View>
      {entries.length === 1 && (
        <Typography type="body-sm" weight="normal" color="muted">
          Adaugă încă o valoare pentru a vedea evoluția.
        </Typography>
      )}
    </View>
  );
}
