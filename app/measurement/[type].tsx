import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Dialog, Typography } from 'heroui-native';
import { ArrowLeft, Pencil, Plus, Ruler, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import MeasurementChart from '@/components/MeasurementChart';
import MeasurementLoadState from '@/components/MeasurementLoadState';
import {
  formatMeasurement,
  isMeasurementType,
  measurementDate,
  measurements,
  useLoadMeasurements,
  useMeasurements,
  type MeasurementEntry,
} from '@/lib/measurements';
import { dateKey, offsetDate, palette } from '@/lib/tracker';
import { goBackOrReplace } from '@/lib/navigation';

const periods = [
  { label: '30 zile', days: 30 },
  { label: '90 zile', days: 90 },
  { label: 'Tot', days: 0 },
] as const;
export default function MeasurementDetail() {
  const { type: requestedType } = useLocalSearchParams<{ type: string }>();
  useLoadMeasurements();
  const { entries, ready, busy, error, remove } = useMeasurements();
  const [period, setPeriod] = useState<number>(0);
  const [pendingDelete, setPendingDelete] = useState<MeasurementEntry | null>(null);
  if (!isMeasurementType(requestedType))
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
  const type = requestedType;
  const info = measurements[type];
  const history = entries
    .filter((entry) => entry.type === type)
    .sort((a, b) => b.date.localeCompare(a.date));
  const cutoff = period ? dateKey(offsetDate(new Date(), -(period - 1))) : '';
  const filtered = history.filter((entry) => !cutoff || entry.date >= cutoff);
  const chartEntries = filtered.slice().sort((a, b) => a.date.localeCompare(b.date));
  const latest = history[0];
  const change =
    chartEntries.length > 1
      ? chartEntries[chartEntries.length - 1].value - chartEntries[0].value
      : null;
  const add = (date?: string) =>
    router.push({ pathname: '/log-measurement', params: { type, ...(date ? { date } : {}) } });
  return (
    <SafeAreaView edges={['top', 'bottom']} className="bg-background flex-1">
      <FlatList
        data={ready ? filtered : []}
        keyExtractor={(entry) => entry.date}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 32,
          maxWidth: 600,
          width: '100%',
          alignSelf: 'center',
        }}
        ListHeaderComponent={
          <View className="gap-5">
            <View className="flex-row items-center gap-3">
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                accessibilityLabel="Înapoi la măsurători"
                onPress={() => goBackOrReplace('/measurements')}
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
              <>
                <Card className="bg-surface gap-4 rounded-[28px] p-5">
                  <View className="flex-row items-center justify-between">
                    <Typography type="body-sm" weight="normal" color="muted">
                      Ultima valoare
                    </Typography>
                    <Ruler size={23} color={palette.accent} />
                  </View>
                  <View className="flex-row items-baseline gap-2">
                    <Typography type="h1" weight="bold">
                      {latest ? formatMeasurement(latest.value) : '—'}
                    </Typography>
                    <Typography type="body" weight="normal" color="muted">
                      {info.unit}
                    </Typography>
                  </View>
                  {latest && (
                    <Typography type="body-sm" weight="normal" color="muted">
                      {measurementDate(latest.date)}
                    </Typography>
                  )}
                  <Button onPress={() => add()}>
                    <Plus size={19} color={palette.white} />
                    <Button.Label>Adaugă valoare</Button.Label>
                  </Button>
                </Card>
                <View className="flex-row gap-2">
                  {periods.map((item) => (
                    <Button
                      key={item.days}
                      className="flex-1"
                      size="sm"
                      variant={period === item.days ? 'primary' : 'secondary'}
                      onPress={() => {
                        if (period !== item.days) {
                          setPeriod(item.days);
                          void Haptics.selectionAsync();
                        }
                      }}
                    >
                      <Button.Label numberOfLines={1}>{item.label}</Button.Label>
                    </Button>
                  ))}
                </View>
                {filtered.length > 0 && (
                  <Card className="bg-surface gap-4 rounded-[28px] p-5">
                    <View className="flex-row items-center justify-between gap-2">
                      <Typography type="h4" weight="semibold">
                        Evoluție
                      </Typography>
                      {change !== null && (
                        <Typography type="body-sm" weight="semibold" className="text-accent">
                          {change > 0 ? '+' : ''}
                          {formatMeasurement(change)} {info.unit}
                        </Typography>
                      )}
                    </View>
                    <MeasurementChart entries={chartEntries} unit={info.unit} />
                    {change !== null && (
                      <Typography type="body-xs" weight="normal" color="muted">
                        Diferență față de prima valoare din perioada aleasă.
                      </Typography>
                    )}
                  </Card>
                )}
                {filtered.length > 0 && (
                  <View className="mb-3 flex-row items-center justify-between">
                    <Typography type="h4" weight="semibold">
                      Istoric
                    </Typography>
                    <Typography type="body-sm" weight="normal" color="muted">
                      {filtered.length} {filtered.length === 1 ? 'înregistrare' : 'înregistrări'}
                    </Typography>
                  </View>
                )}
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          ready ? (
            <View className="items-center gap-3 py-8">
              <Ruler size={30} color={palette.accent} />
              <Typography type="body" weight="normal" align="center" color="muted">
                {history.length
                  ? 'Nicio valoare în această perioadă.'
                  : 'Nu ai înregistrat încă o valoare.'}
              </Typography>
              <Button
                variant="secondary"
                onPress={() => {
                  if (history.length) {
                    setPeriod(0);
                    void Haptics.selectionAsync();
                  } else add();
                }}
              >
                <Button.Label>
                  {history.length ? 'Arată tot istoricul' : 'Adaugă prima valoare'}
                </Button.Label>
              </Button>
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="mb-3"
          >
            <Card className="bg-surface flex-row items-center gap-2 rounded-3xl p-4">
              <View className="flex-1 gap-1">
                <Typography type="body" weight="semibold">
                  {formatMeasurement(item.value)} {info.unit}
                </Typography>
                <Typography type="body-xs" weight="normal" color="muted">
                  {measurementDate(item.date)}
                </Typography>
              </View>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                isDisabled={busy}
                accessibilityLabel={`Editează valoarea din ${measurementDate(item.date)}`}
                onPress={() => add(item.date)}
              >
                <Pencil size={18} color={palette.muted} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                isDisabled={busy}
                accessibilityLabel={`Șterge valoarea din ${measurementDate(item.date)}`}
                onPress={() => setPendingDelete(item)}
              >
                <Trash2 size={18} color={palette.accent} />
              </Button>
            </Card>
          </Animated.View>
        )}
      />
      <Dialog
        isOpen={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open && !busy) setPendingDelete(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="gap-4 rounded-3xl">
            <Dialog.Title>Ștergi această valoare?</Dialog.Title>
            <Dialog.Description>
              {pendingDelete
                ? `${formatMeasurement(pendingDelete.value)} ${info.unit} · ${measurementDate(pendingDelete.date)}`
                : ''}
            </Dialog.Description>
            {error && (
              <Typography type="body-sm" weight="normal" className="text-danger">
                {error}
              </Typography>
            )}
            <Button
              variant="danger"
              isDisabled={busy}
              onPress={() => {
                if (pendingDelete)
                  void remove(pendingDelete).then((success) => {
                    if (success) setPendingDelete(null);
                  });
              }}
            >
              <Button.Label>{busy ? 'Se șterge…' : 'Șterge'}</Button.Label>
            </Button>
            <Button variant="ghost" isDisabled={busy} onPress={() => setPendingDelete(null)}>
              <Button.Label>Anulează</Button.Label>
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </SafeAreaView>
  );
}
