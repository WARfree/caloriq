import { useState } from 'react';
import { View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Input, Label, TextField, Typography } from 'heroui-native';
import { ArrowLeft, ArrowRight, Check, Target } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AccountScreen } from '@/components/AccountScreen';
import { useAccount } from '@/lib/account';
import { activityOptions, calculateCalories, profileSchema } from '@/lib/calorie-profile';
import { palette } from '@/lib/tracker';

const questions = [
  { field: 'goal', title: 'Care este obiectivul tău?' },
  { field: 'sex', title: 'Care este sexul tău biologic?' },
  { field: 'age', title: 'Câți ani ai?' },
  { field: 'height', title: 'Ce înălțime ai?' },
  { field: 'weight', title: 'Cât cântărești?' },
  { field: 'activity', title: 'Cât de activ ești?' },
] as const;
const limits = {
  age: { min: 18, max: 100, label: 'Vârstă', unit: 'ani', hint: '18–100' },
  height: { min: 120, max: 230, label: 'Înălțime', unit: 'cm', hint: '120–230' },
  weight: { min: 35, max: 300, label: 'Greutate', unit: 'kg', hint: '35–300' },
};
export default function OnboardingRoute() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const index = Number(step) - 1;
  const draft = useAccount((state) => state.draft);
  if (!Number.isInteger(index) || index < 0 || index > 5) return <Redirect href="/onboarding/1" />;
  const missing = questions.findIndex(
    (question, position) => position < index && draft[question.field] === undefined,
  );
  if (missing !== -1)
    return (
      <Redirect href={{ pathname: '/onboarding/[step]', params: { step: String(missing + 1) } }} />
    );
  return <QuestionPage key={index} index={index} />;
}
function QuestionPage({ index }: { index: number }) {
  const { draft, setDraft, saveProfile, error: saveError } = useAccount();
  const { field, title } = questions[index];
  const initialValue = draft[field];
  const [value, setValue] = useState(typeof initialValue === 'number' ? String(initialValue) : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const parsed = profileSchema.safeParse(draft);
  const estimate = parsed.success ? calculateCalories(parsed.data) : null;
  const options =
    field === 'goal'
      ? [
          { value: 'lose', label: 'Slăbire', detail: 'Un deficit caloric moderat' },
          { value: 'maintain', label: 'Menținere', detail: 'Păstrează greutatea actuală' },
          { value: 'gain', label: 'Masă musculară', detail: 'Un surplus caloric moderat' },
        ]
      : field === 'sex'
        ? [
            { value: 'female', label: 'Feminin', detail: '' },
            { value: 'male', label: 'Masculin', detail: '' },
          ]
        : field === 'activity'
          ? activityOptions
          : [];
  const numeric = field === 'age' || field === 'height' || field === 'weight';
  const select = (selection: string) => {
    if (field === 'goal') {
      const result = profileSchema.shape.goal.safeParse(selection);
      if (result.success) setDraft({ goal: result.data });
    }
    if (field === 'sex') {
      const result = profileSchema.shape.sex.safeParse(selection);
      if (result.success) setDraft({ sex: result.data });
    }
    if (field === 'activity') {
      const result = profileSchema.shape.activity.safeParse(selection);
      if (result.success) setDraft({ activity: result.data });
    }
    setError('');
    void Haptics.selectionAsync();
  };
  const next = async () => {
    setError('');
    if (numeric) {
      const number = Number(value.replace(',', '.'));
      const range = limits[field];
      if (
        !value.trim() ||
        !Number.isFinite(number) ||
        number < range.min ||
        number > range.max ||
        (field === 'age' && !Number.isInteger(number))
      ) {
        setError(
          field === 'age'
            ? 'Introdu o vârstă între 18 și 100 de ani. Planul este destinat adulților.'
            : `Introdu o valoare între ${range.min} și ${range.max} ${range.unit}.`,
        );
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      setDraft({ [field]: number });
    } else if (!draft[field]) {
      setError('Alege o opțiune pentru a continua.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (index < 5) {
      router.push({ pathname: '/onboarding/[step]', params: { step: String(index + 2) } });
    } else {
      setBusy(true);
      await saveProfile();
      setBusy(false);
    }
  };
  const leave = async () => {
    setBusy(true);
    setError('');
    try {
      const { bilt } = await import('@/lib/bilt');
      const { error: failure } = await bilt.auth.signOut();
      if (failure) throw failure;
      useAccount.getState().setSession(null);
    } catch {
      setError('Nu am putut închide sesiunea. Încearcă din nou.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(false);
    }
  };
  return (
    <AccountScreen
      footer={
        <View className="gap-3">
          {!!(error || saveError) && (
            <Typography
              type="body-sm"
              weight="normal"
              className="text-danger"
              accessibilityRole="alert"
            >
              {error || saveError}
            </Typography>
          )}
          <Button isDisabled={busy} onPress={() => void next()} className="h-14 rounded-2xl">
            <Button.Label>
              {busy ? 'Se salvează…' : index === 5 ? 'Salvează planul' : 'Continuă'}
            </Button.Label>
            {!busy && <ArrowRight size={19} color={palette.white} />}
          </Button>
        </View>
      }
    >
      <View className="mb-5 flex-row items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          isDisabled={busy}
          onPress={() =>
            index > 0
              ? router.replace({ pathname: '/onboarding/[step]', params: { step: String(index) } })
              : void leave()
          }
        >
          <ArrowLeft size={17} color={palette.ink} />
          <Button.Label>{index > 0 ? 'Înapoi' : 'Ieșire'}</Button.Label>
        </Button>
        <Typography type="body-sm" weight="medium" color="muted">
          {index + 1} din 6
        </Typography>
      </View>
      <View className="mb-8 flex-row gap-1.5" accessibilityLabel={`Pasul ${index + 1} din 6`}>
        {questions.map((question, position) => (
          <View
            key={question.field}
            className={`h-1.5 flex-1 rounded-full ${position <= index ? 'bg-accent' : 'bg-border'}`}
          />
        ))}
      </View>
      <Typography.Heading type="h2" weight="bold" className="mb-7 tracking-tight">
        {title}
      </Typography.Heading>
      {field === 'sex' && (
        <Typography type="body-sm" weight="normal" color="muted" className="mb-5">
          Formula calorică folosește sexul biologic pentru estimarea metabolismului.
        </Typography>
      )}
      {numeric ? (
        <Card className="rounded-[28px] p-6">
          <TextField isInvalid={!!error} isDisabled={busy}>
            <Label>
              {limits[field].label} ({limits[field].unit})
            </Label>
            <Input
              value={value}
              onChangeText={(text) => {
                setValue(text);
                setError('');
              }}
              keyboardType={field === 'age' ? 'number-pad' : 'decimal-pad'}
              placeholder={limits[field].hint}
              maxLength={6}
              className="bg-background mt-2 h-20 rounded-2xl text-4xl font-semibold"
              onSubmitEditing={() => void next()}
            />
          </TextField>
        </Card>
      ) : (
        <View className="gap-3">
          {options.map((option) => {
            const selected = draft[field] === option.value;
            return (
              <Button
                key={option.value}
                variant="secondary"
                isDisabled={busy}
                onPress={() => select(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                className={`h-auto min-h-20 justify-start rounded-3xl border p-5 ${selected ? 'bg-peach border-accent' : 'bg-surface border-border'}`}
              >
                <View className="flex-1 gap-1">
                  <Button.Label className="text-foreground text-left" numberOfLines={1}>
                    {option.label}
                  </Button.Label>
                  {!!option.detail && (
                    <Typography type="body-sm" weight="normal" color="muted">
                      {option.detail}
                    </Typography>
                  )}
                </View>
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full border ${selected ? 'bg-accent border-accent' : 'border-border'}`}
                >
                  {selected && <Check size={15} color={palette.white} />}
                </View>
              </Button>
            );
          })}
        </View>
      )}
      {index === 5 && estimate && (
        <Card className="mt-6 rounded-[28px] p-5">
          <View className="mb-3 flex-row items-center gap-2">
            <Target size={20} color={palette.accent} />
            <Typography type="body" weight="semibold">
              Planul tău zilnic
            </Typography>
          </View>
          <Typography.Heading type="h1" weight="bold">
            {estimate.calories.toLocaleString('ro-RO')} kcal
          </Typography.Heading>
          <Typography type="body-sm" weight="normal" color="muted" className="mt-2">
            Menținere estimată: {estimate.maintenance.toLocaleString('ro-RO')} kcal/zi
          </Typography>
          <Typography type="body-xs" weight="normal" color="muted" className="mt-4">
            Estimare Mifflin–St Jeor, nu recomandare medicală. Pentru sarcină, alăptare sau
            afecțiuni medicale, cere sfatul unui specialist. Creșterea masei musculare necesită și
            antrenament de forță.
          </Typography>
        </Card>
      )}
    </AccountScreen>
  );
}
