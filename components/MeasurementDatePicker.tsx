import { useState } from 'react';
import { Platform, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Button, Label } from 'heroui-native';
import { CalendarDays } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { dateKey, fromKey, palette } from '@/lib/tracker';
import { measurementDate } from '@/lib/measurements';

type Props = { value: string; onChange: (value: string) => void; disabled?: boolean };
export default function MeasurementDatePicker({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const change = (date: Date) => {
    const next = dateKey(date);
    if (next !== value) {
      void Haptics.selectionAsync();
      onChange(next);
    }
  };
  return (
    <View className="gap-2">
      <Label>Data măsurătorii</Label>
      <Button
        variant="secondary"
        isDisabled={disabled}
        onPress={() => {
          if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
              value: fromKey(value),
              mode: 'date',
              maximumDate: new Date(),
              onChange: (event, date) => {
                if (event.type === 'set' && date) change(date);
              },
            });
          } else setOpen((current) => !current);
        }}
      >
        <CalendarDays size={18} color={palette.accent} />
        <Button.Label>{measurementDate(value)}</Button.Label>
      </Button>
      {open && Platform.OS === 'ios' && (
        <DateTimePicker
          value={fromKey(value)}
          mode="date"
          display="inline"
          themeVariant="light"
          maximumDate={new Date()}
          onChange={(_event, date) => {
            if (date) {
              change(date);
              setOpen(false);
            }
          }}
        />
      )}
    </View>
  );
}
