import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  Skeleton,
  TextField,
  Typography,
} from 'heroui-native';
import { ArrowLeft, Check, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import {
  activityTypes,
  estimateActivityCalories,
  useActivities,
  type ActivityType,
} from '@/lib/activities';
import { useAccount } from '@/lib/account';
import { goBackOrReplace } from '@/lib/navigation';
import { dateKey, fromKey, palette } from '@/lib/tracker';

export default function LogActivity() {
  const { date: requestedDate } = useLocalSearchParams<{ date?: string }>();
  const date = requestedDate || dateKey();
  const [type, setType] = useState<ActivityType>('walk');
  const [duration, setDuration] = useState('30');
  const [validation, setValidation] = useState<string | null>(null);
  const profile = useAccount((state) => state.profile);
  const { ready, busy, error, load, save } = useActivities();
  useEffect(() => {
    if (!useActivities.getState().ready) void load();
  }, [load]);
  const minutes = Number(duration.replace(',', '.'));
  const validMinutes = Number.isFinite(minutes) && minutes >= 1 && minutes <= 1440;
  const calories =
    profile && validMinutes ? estimateActivityCalories(type, minutes, profile.weight) : 0;
  const submit = async () => {
    if (!validMinutes) {
      setValidation('Introdu o durată între 1 și 1440 de minute.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!profile) return;
    setValidation(null);
    const success = await save({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      minutes,
      calories,
      date,
    });
    if (success) goBackOrReplace('/activities');
  };
  return (
    <SafeAreaView edges={['top', 'bottom']} className="bg-background flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 24,
            maxWidth: 600,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <View className="mb-5 flex-row items-center gap-3">
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              accessibilityLabel="Înapoi la activități"
              isDisabled={busy}
              onPress={() => goBackOrReplace('/activities')}
            >
              <ArrowLeft size={22} color={palette.ink} />
            </Button>
            <Typography type="h3" weight="bold" className="flex-1">
              Adaugă activitate
            </Typography>
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
              <View className="gap-3">
                <Skeleton className="h-72 rounded-3xl" />
                <Skeleton className="h-28 rounded-3xl" />
              </View>
            )
          ) : (
            <>
              <Card className="bg-surface mb-5 gap-3 rounded-3xl p-5">
                <Typography type="h4" weight="semibold">
                  Tipul activității
                </Typography>
                {activityTypes.map((activity) => (
                  <Button
                    key={activity.id}
                    variant={type === activity.id ? 'secondary' : 'ghost'}
                    className="justify-between"
                    accessibilityState={{ selected: type === activity.id }}
                    isDisabled={busy}
                    onPress={() => {
                      if (type !== activity.id) {
                        setType(activity.id);
                        void Haptics.selectionAsync();
                      }
                    }}
                  >
                    <Button.Label numberOfLines={1}>{activity.name}</Button.Label>
                    {type === activity.id && <Check size={18} color={palette.accent} />}
                  </Button>
                ))}
              </Card>
              <Card className="bg-surface mb-5 rounded-3xl p-5">
                <TextField isInvalid={!!validation} isDisabled={busy}>
                  <Label>Durată (minute)</Label>
                  <Input
                    keyboardType="decimal-pad"
                    value={duration}
                    onChangeText={(value) => {
                      setDuration(value);
                      setValidation(null);
                    }}
                    accessibilityLabel="Durata în minute"
                  />
                  {validation && <FieldError>{validation}</FieldError>}
                </TextField>
              </Card>
              <Card className="bg-peach gap-3 rounded-3xl p-5">
                <View className="flex-row items-center gap-2">
                  <Flame size={22} color={palette.accent} />
                  <Typography type="h3" weight="bold">
                    {calories} kcal
                  </Typography>
                </View>
                <Typography type="body-sm" weight="normal" color="muted">
                  Estimare pe baza duratei și greutății tale. Ținta calorică zilnică nu se modifică.
                </Typography>
              </Card>
              {error && (
                <Typography type="body-sm" weight="normal" className="text-danger mt-4">
                  {error} Apasă din nou pe Salvează.
                </Typography>
              )}
            </>
          )}
        </ScrollView>
        <View
          className="border-border border-t px-5 py-4"
          style={{ width: '100%', maxWidth: 600, alignSelf: 'center' }}
        >
          <Button isDisabled={busy || !ready} onPress={() => void submit()}>
            <Button.Label>{busy ? 'Se salvează…' : 'Salvează'}</Button.Label>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
