import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, FieldError, Input, Label, TextField, Typography } from 'heroui-native';
import { Target, ShieldCheck, Heart, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Heading, Screen, LoadState } from '@/components/TrackerUI';
import { palette, useTracker } from '@/lib/tracker';
import { useAccount } from '@/lib/account';
import { resetSteps } from '@/lib/steps';
import { resetMeasurements } from '@/lib/measurements';
import { bilt } from '@/lib/bilt';
import { goalLabels, calculateCalories } from '@/lib/calorie-profile';

export default function Settings() {
  const { goal, entries, ready, busy, error, save, clearError } = useTracker();
  const [value, setValue] = useState(String(goal));
  const [validation, setValidation] = useState('');
  const [saved, setSaved] = useState(false);
  const [previousGoal, setPreviousGoal] = useState(goal);
  const { session, profile } = useAccount();
  const [signingOut, setSigningOut] = useState(false);
  const [accountError, setAccountError] = useState('');
  const signOut = async () => {
    setSigningOut(true);
    setAccountError('');
    try {
      const { error: failure } = await bilt.auth.signOut();
      if (failure) throw failure;
      useTracker.setState({ entries: [], goal: 2000, ready: false, busy: false, error: null });
      resetSteps();
      resetMeasurements();
      useAccount.getState().setSession(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setAccountError('Deconectarea nu a reușit. Încearcă din nou.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSigningOut(false);
    }
  };
  if (goal !== previousGoal) {
    setPreviousGoal(goal);
    setValue(String(goal));
  }
  const change = (text: string) => {
    setValue(text);
    setValidation('');
    setSaved(false);
    clearError();
  };
  const submit = async () => {
    const next = Number(value);
    if (!Number.isInteger(next) || next < 500 || next > 10000) {
      setValidation('Enter a goal between 500 and 10,000 calories.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (await save({ goal: next, entries })) setSaved(true);
  };
  return (
    <Screen>
      <Heading title="Settings" />
      {!ready ? (
        <LoadState />
      ) : (
        <>
          <Card className="mb-6 rounded-[28px] p-5">
            <View className="mb-5 flex-row items-center gap-3">
              <View className="bg-peach h-10 w-10 items-center justify-center rounded-xl">
                <Target size={22} color={palette.accent} />
              </View>
              <Typography.Heading type="h5" weight="semibold">
                Daily calorie goal
              </Typography.Heading>
            </View>
            <TextField isInvalid={!!validation}>
              <Label>Calories per day</Label>
              <Input
                value={value}
                onChangeText={change}
                keyboardType="number-pad"
                maxLength={5}
                className="bg-background h-16 rounded-2xl text-2xl font-semibold"
              />
              <FieldError>{validation}</FieldError>
            </TextField>
            <View className="mt-4 mb-5 flex-row gap-2">
              {[1600, 2000, 2400].map((n) => (
                <Button
                  key={n}
                  size="sm"
                  className="flex-1 rounded-xl"
                  variant={Number(value) === n ? 'primary' : 'secondary'}
                  onPress={() => {
                    change(String(n));
                    void Haptics.selectionAsync();
                  }}
                >
                  <Button.Label>{n.toLocaleString()}</Button.Label>
                </Button>
              ))}
            </View>
            {error && (
              <Typography
                type="body-sm"
                weight="normal"
                style={{ color: palette.accent }}
                className="mb-3"
              >
                {error}
              </Typography>
            )}
            <Button onPress={() => void submit()} isDisabled={busy} className="rounded-2xl">
              {saved && <Check size={18} color={palette.white} />}
              <Button.Label>{busy ? 'Saving…' : saved ? 'Goal saved' : 'Save goal'}</Button.Label>
            </Button>
            <Typography type="body-xs" weight="normal" color="muted" className="mt-4">
              Your goal is personal. The default is a starting point, not medical advice.
            </Typography>
          </Card>
          <Typography.Heading type="h4" weight="bold" className="mb-3">
            Macro balance
          </Typography.Heading>
          <Card className="mb-6 rounded-3xl p-5">
            {[
              {
                label: 'Protein',
                percent: 25,
                grams: Math.round((goal * 0.25) / 4),
                color: palette.protein,
              },
              {
                label: 'Carbs',
                percent: 45,
                grams: Math.round((goal * 0.45) / 4),
                color: palette.carbs,
              },
              {
                label: 'Fat',
                percent: 30,
                grams: Math.round((goal * 0.3) / 9),
                color: palette.fat,
              },
            ].map((m, i) => (
              <View key={m.label} className={`flex-row items-center gap-3 ${i ? 'mt-4' : ''}`}>
                <View style={{ backgroundColor: m.color, width: 9, height: 9, borderRadius: 5 }} />
                <Typography type="body-sm" weight="normal" className="flex-1">
                  {m.label}
                </Typography>
                <Typography type="body-sm" weight="normal" color="muted">
                  {m.percent}%
                </Typography>
                <Typography type="body-sm" weight="semibold" align="end" className="w-14">
                  {m.grams}g
                </Typography>
              </View>
            ))}
          </Card>
          <Card className="mb-6 gap-4 rounded-3xl p-5">
            <View className="flex-row items-center gap-3">
              <ShieldCheck size={23} color={palette.fat} />
              <Typography type="body" weight="semibold">
                Contul tău
              </Typography>
            </View>
            <Typography type="body-sm" weight="normal" numberOfLines={1}>
              {session?.user.email}
            </Typography>
            {profile && (
              <>
                <Typography type="body-sm" weight="semibold">
                  {goalLabels[profile.goal]} ·{' '}
                  {calculateCalories(profile).calories.toLocaleString('ro-RO')} kcal/zi
                </Typography>
                <Typography type="body-xs" weight="normal" color="muted">
                  Estimarea inițială a planului tău
                </Typography>
              </>
            )}
            <Typography type="body-sm" weight="normal" color="muted">
              Profilul este păstrat în cont. Jurnalul alimentar rămâne pe acest dispozitiv, separat
              pentru fiecare cont.
            </Typography>
            {!!accountError && (
              <Typography
                type="body-sm"
                weight="normal"
                className="text-danger"
                accessibilityRole="alert"
              >
                {accountError}
              </Typography>
            )}
            <Button
              variant="secondary"
              isDisabled={signingOut || busy}
              onPress={() => void signOut()}
              className="rounded-2xl"
            >
              <Button.Label>{signingOut ? 'Se deconectează…' : 'Deconectare'}</Button.Label>
            </Button>
          </Card>
          <View className="mt-9 flex-row items-center justify-center gap-1.5">
            <Heart size={14} color={palette.accent} />
            <Typography type="body-xs" weight="normal" color="muted">
              nourish
            </Typography>
          </View>
        </>
      )}
    </Screen>
  );
}
