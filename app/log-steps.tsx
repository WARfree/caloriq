import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  Button,
  Card,
  Description,
  FieldError,
  Input,
  Label,
  Skeleton,
  TextField,
  Typography,
} from 'heroui-native';
import { ArrowLeft, Footprints } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { StepsCalorieInfo } from '@/components/StepsCalorieInfo';
import { stepCountSchema, stepCaloriesSchema, stepDurationSchema, useSteps } from '@/lib/steps';
import { estimateStepEnergy } from '@/lib/step-energy';
import { useAccount } from '@/lib/account';
import { goBackOrReplace } from '@/lib/navigation';
import { dateKey, fromKey, palette } from '@/lib/tracker';

type Draft = { date: string; count: string; calories: string; duration: string };
type Validation = Partial<Record<'count' | 'calories' | 'duration' | 'profile', string>>;
const isDecimal = (value: string) => /^\d+(?:[.,]\d+)?$/.test(value.trim());
const decimal = (value: string) => Number(value.trim().replace(',', '.'));

export default function LogSteps() {
  const { date: requestedDate } = useLocalSearchParams<{ date?: string }>();
  const date = requestedDate || dateKey();
  const { entries, ready, busy, error, load, save } = useSteps();
  const profile = useAccount((state) => state.profile);
  const existing = entries.find((entry) => entry.date === date);
  const [draft, setDraft] = useState<Draft | null>(null);
  const values: Draft =
    draft?.date === date
      ? draft
      : {
          date,
          count: existing ? String(existing.count) : '',
          calories:
            existing?.calories !== undefined && existing.calorieSource !== 'estimated'
              ? String(existing.calories)
              : '',
          duration: existing?.duration !== undefined ? String(existing.duration) : '',
        };
  const [validation, setValidation] = useState<Validation>({});
  const countResult = stepCountSchema.safeParse(Number(values.count));
  const validCount = /^\d+$/.test(values.count.trim()) && countResult.success;
  const estimate = validCount && profile ? estimateStepEnergy(Number(values.count), profile) : null;
  const manualCalories =
    isDecimal(values.calories) && stepCaloriesSchema.safeParse(decimal(values.calories)).success;
  const hasManualCalories = values.calories.trim() !== '';
  const displayedCalories = hasManualCalories
    ? manualCalories
      ? Math.round(decimal(values.calories))
      : null
    : (estimate?.calories ?? null);
  const validDuration =
    isDecimal(values.duration) && stepDurationSchema.safeParse(decimal(values.duration)).success;
  const pace =
    validCount && validDuration
      ? Math.round(Number(values.count) / decimal(values.duration))
      : null;
  const update = (field: 'count' | 'calories' | 'duration', value: string) => {
    setDraft({ ...values, [field]: value });
    setValidation({});
  };
  useEffect(() => {
    if (!useSteps.getState().ready) void load();
  }, [load]);
  const submit = async () => {
    const errors: Validation = {};
    if (!validCount) errors.count = 'Introdu un număr întreg între 0 și 200.000 de pași.';
    if (hasManualCalories && !manualCalories)
      errors.calories = 'Introdu o valoare între 0 și 50.000 kcal sau lasă câmpul gol.';
    if (values.duration.trim() !== '' && !validDuration)
      errors.duration = 'Introdu o durată mai mare de 0 și de cel mult 1.440 minute.';
    if (!hasManualCalories && !profile)
      errors.profile =
        'Completează greutatea și înălțimea în profil pentru estimare sau introdu caloriile.';
    setValidation(errors);
    if (Object.keys(errors).length > 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const calories = hasManualCalories ? decimal(values.calories) : estimate?.calories;
    if (
      await save({
        date,
        count: Number(values.count),
        calories,
        calorieSource: hasManualCalories ? 'manual' : 'estimated',
        ...(validDuration ? { duration: decimal(values.duration) } : {}),
      })
    )
      goBackOrReplace('/activities');
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
          <View className="mb-5 flex-row items-center gap-2">
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              accessibilityLabel="Înapoi"
              isDisabled={busy}
              onPress={() => goBackOrReplace('/activities')}
            >
              <ArrowLeft size={22} color={palette.ink} />
            </Button>
            <Typography type="h3" weight="bold" className="flex-1">
              {existing ? 'Editează pașii' : 'Adaugă pași'}
            </Typography>
            <StepsCalorieInfo />
          </View>
          <Typography type="body-sm" weight="normal" color="muted" className="mb-5">
            {fromKey(date).toLocaleDateString('ro-RO', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Typography>
          {!ready ? (
            error ? (
              <View className="gap-3">
                <Typography type="body" weight="normal" className="text-danger">
                  {error}
                </Typography>
                <Button onPress={() => void load()}>
                  <Button.Label>Încearcă din nou</Button.Label>
                </Button>
              </View>
            ) : (
              <Skeleton className="h-80 rounded-3xl" />
            )
          ) : (
            <Card className="bg-surface gap-5 rounded-3xl p-5">
              <Footprints size={24} color={palette.accent} />
              <TextField isInvalid={!!validation.count} isDisabled={busy}>
                <Label>Total pași în această zi</Label>
                <Input
                  keyboardType="number-pad"
                  value={values.count}
                  placeholder="Ex. 8000"
                  accessibilityLabel="Total pași în această zi"
                  onChangeText={(value) => update('count', value)}
                />
                <Description>
                  Introdu totalul zilei. Salvarea înlocuiește valoarea anterioară.
                </Description>
                {validation.count && <FieldError>{validation.count}</FieldError>}
              </TextField>
              <TextField isInvalid={!!validation.duration} isDisabled={busy}>
                <Label>Durata activității (minute)</Label>
                <Input
                  keyboardType="decimal-pad"
                  value={values.duration}
                  placeholder="Opțional, ex. 60"
                  accessibilityLabel="Durata activității în minute, opțional"
                  onChangeText={(value) => update('duration', value)}
                />
                {validation.duration && <FieldError>{validation.duration}</FieldError>}
              </TextField>
              <TextField isInvalid={!!validation.calories} isDisabled={busy}>
                <Label>Calorii active arse (kcal)</Label>
                <Input
                  keyboardType="decimal-pad"
                  value={values.calories}
                  placeholder="Opțional"
                  accessibilityLabel="Calorii active arse, opțional"
                  onChangeText={(value) => update('calories', value)}
                />
                <Description>Lasă gol pentru estimare automată.</Description>
                {validation.calories && <FieldError>{validation.calories}</FieldError>}
              </TextField>
              {displayedCalories !== null && (
                <View
                  className="border-border gap-1 border-t pt-4"
                  accessibilityLiveRegion="polite"
                >
                  <Typography type="body" weight="semibold">
                    {displayedCalories.toLocaleString('ro-RO')} kcal{' '}
                    {hasManualCalories ? 'introduse' : 'estimate'}
                  </Typography>
                  {estimate && (
                    <Typography type="body-sm" weight="normal" color="muted">
                      ≈ {estimate.distanceKm.toLocaleString('ro-RO', { maximumFractionDigits: 2 })}{' '}
                      km de mers
                    </Typography>
                  )}
                  {pace !== null && (
                    <Typography type="body-sm" weight="normal" color="muted">
                      Ritm mediu: {pace.toLocaleString('ro-RO')}{' '}
                      {pace === 1 ? 'pas/minut' : 'pași/minut'}
                    </Typography>
                  )}
                </View>
              )}
              {(validation.profile || error) && (
                <Typography type="body-sm" weight="normal" className="text-danger">
                  {validation.profile || error}
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
