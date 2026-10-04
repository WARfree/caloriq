import { View } from 'react-native';
import { Label } from 'heroui-native';
import * as Haptics from 'expo-haptics';
import { dateKey, palette } from '@/lib/tracker';
import { measurementDateSchema } from '@/lib/measurements';

type Props = { value: string; onChange: (value: string) => void; disabled?: boolean };
export default function MeasurementDatePicker({ value, onChange, disabled }: Props) {
  return (
    <View className="gap-2">
      <Label>Data măsurătorii</Label>
      <input
        type="date"
        aria-label="Data măsurătorii"
        value={value}
        max={dateKey()}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          if (next !== value && measurementDateSchema.safeParse(next).success) {
            void Haptics.selectionAsync();
            onChange(next);
          }
        }}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          minHeight: 48,
          borderRadius: 16,
          padding: '12px 14px',
          border: `1px solid ${palette.border}`,
          color: palette.ink,
          background: palette.background,
          font: 'inherit',
          colorScheme: 'light',
        }}
      />
    </View>
  );
}
