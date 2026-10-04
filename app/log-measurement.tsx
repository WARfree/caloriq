import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  Button,
  Card,
  Description,
  FieldError,
  Input,
  Label,
  TextField,
  Typography,
} from 'heroui-native';
import { ArrowLeft, Ruler } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import MeasurementDatePicker from '@/components/MeasurementDatePicker';
import MeasurementLoadState from '@/components/MeasurementLoadState';
import {
  isMeasurementType,
  measurementDateSchema,
  measurements,
  useLoadMeasurements,
  useMeasurements,
} from '@/lib/measurements';
import { dateKey, palette } from '@/lib/tracker';
import { goBackOrReplace } from '@/lib/navigation';

export default function LogMeasurement() {
  const params = useLocalSearchParams<{ type?: string; date?: string }>();
  useLoadMeasurements();
  const { entries, ready, busy, error, save } = useMeasurements();
  const [date, setDate] = useState(() =>
    measurementDateSchema.safeParse(params.date).success ? params.date! : dateKey(),
  );
  const [draft, setDraft] = useState<{ date: string; value: string } | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  if (!isMeasurementType(params.type))
    return (
      <SafeAreaView className="bg-background flex-1 justify-center gap-4 p-5">
        <Typography type="body" weight="normal">
          Măsurătoarea nu există.
        </Typography>
        <Button onPress={() => goBackOrReplace('/measurements')}>
          <Button.Label>Înapoi la măsurători</Button.Label>
        </Button>
      </SafeAreaView>
    );
  const type = params.type;
  const info = measurements[type];
  const existing = entries.find((entry) => entry.type === type && entry.date === date);
  const value = draft?.date === date ? draft.value : existing ? String(existing.value) : '';
  const fallback = { pathname: '/measurement/[type]' as const, params: { type } };
  const submit = async () => {
    const normalized = value.trim().replace(',', '.');
    const numeric = Number(normalized);
    if (!/^\d+(\.\d{1,2})?$/.test(normalized) || numeric < info.min || numeric > info.max) {
      setValidation(
        `Introdu o valoare între ${info.min} și ${info.max} ${info.unit}, cu cel mult două zecimale.`,
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setValidation(null);
    if (await save({ type, date, value: numeric })) goBackOrReplace(fallback);
  };
  return (
    <SafeAreaView edges={['top', 'bottom']} className="bg-background flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, maxWidth: 600, width: '100%', alignSelf: 'center' }}
        >
          <View className="mb-6 flex-row items-center gap-3">
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              accessibilityLabel="Înapoi"
              isDisabled={busy}
              onPress={() => goBackOrReplace(fallback)}
            >
              <ArrowLeft size={22} color={palette.ink} />
            </Button>
            <Typography type="h3" weight="bold" className="flex-1">
              {info.label}
            </Typography>
          </View>
          {!ready ? (
            <MeasurementLoadState />
          ) : (
            <Card className="bg-surface gap-5 rounded-[28px] p-5">
              <View className="bg-peach h-12 w-12 items-center justify-center rounded-2xl">
                <Ruler size={24} color={palette.accent} />
              </View>
              <MeasurementDatePicker
                value={date}
                disabled={busy}
                onChange={(next) => {
                  setDate(next);
                  setDraft(null);
                  setValidation(null);
                }}
              />
              <TextField isInvalid={!!validation} isDisabled={busy}>
                <Label>Valoare ({info.unit})</Label>
                <Input
                  value={value}
                  keyboardType="decimal-pad"
                  placeholder={type === 'weight' ? 'Ex. 72,5' : 'Ex. 35,5'}
                  accessibilityLabel={`${info.label} în ${info.unit}`}
                  onChangeText={(next) => {
                    setDraft({ date, value: next });
                    setValidation(null);
                  }}
                />
                {existing && (
                  <Description>Salvarea înlocuiește valoarea din această zi.</Description>
                )}
                {validation && <FieldError>{validation}</FieldError>}
              </TextField>
              {error && (
                <Typography type="body-sm" weight="normal" className="text-danger">
                  {error} Apasă din nou pe Salvează.
                </Typography>
              )}
            </Card>
          )}
        </ScrollView>
        <View
          className="border-border border-t px-5 py-4"
          style={{ width: '100%', maxWidth: 600, alignSelf: 'center' }}
        >
          <Button isDisabled={!ready || busy} onPress={() => void submit()}>
            <Button.Label>{busy ? 'Se salvează…' : 'Salvează'}</Button.Label>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
