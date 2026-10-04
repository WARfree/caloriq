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
import { stepCountSchema, useSteps } from '@/lib/steps';
import { goBackOrReplace } from '@/lib/navigation';
import { dateKey, fromKey, palette } from '@/lib/tracker';

export default function LogSteps() {
  const { date: requestedDate } = useLocalSearchParams<{ date?: string }>();
  const date = requestedDate || dateKey();
  const { entries, ready, busy, error, load, save } = useSteps();
  const existing = entries.find((entry) => entry.date === date);
  const [draft, setDraft] = useState<{ date: string; count: string } | null>(null);
  const count = draft?.date === date ? draft.count : existing ? String(existing.count) : '';
  const [validation, setValidation] = useState<string | null>(null);
  useEffect(() => {
    if (!useSteps.getState().ready) void load();
  }, [load]);
  const submit = async () => {
    const parsed = stepCountSchema.safeParse(Number(count));
    if (!/^\d+$/.test(count.trim()) || !parsed.success) {
      setValidation('Introdu un număr întreg între 0 și 200.000 de pași.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setValidation(null);
    if (await save({ date, count: parsed.data })) goBackOrReplace('/activities');
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
          <View className="mb-5 flex-row items-center gap-3">
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
              <Skeleton className="h-48 rounded-3xl" />
            )
          ) : (
            <Card className="bg-surface gap-4 rounded-3xl p-5">
              <View className="bg-peach h-12 w-12 items-center justify-center rounded-2xl">
                <Footprints size={24} color={palette.accent} />
              </View>
              <TextField isInvalid={!!validation} isDisabled={busy}>
                <Label>Total pași în această zi</Label>
                <Input
                  keyboardType="number-pad"
                  value={count}
                  placeholder="Ex. 8000"
                  accessibilityLabel="Total pași în această zi"
                  onChangeText={(value) => {
                    setDraft({ date, count: value });
                    setValidation(null);
                  }}
                />
                <Description>
                  Introdu totalul zilei. Salvarea înlocuiește valoarea anterioară.
                </Description>
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
