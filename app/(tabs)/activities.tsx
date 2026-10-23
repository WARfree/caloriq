import { useState } from 'react';
import { Alert, FlatList, Platform, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Skeleton, Typography } from 'heroui-native';
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Plus,
  Timer,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { Heading } from '@/components/TrackerUI';
import { StepsSummary } from '@/components/StepsSummary';
import { activityTypes, useActivities } from '@/lib/activities';
import { dateKey, fromKey, offsetDate, palette } from '@/lib/tracker';

export default function Activities() {
  const [selected, setSelected] = useState(dateKey());
  const [retryId, setRetryId] = useState<string | null>(null);
  const { entries, ready, busy, error, load, remove } = useActivities();
  const dayEntries = entries.filter((entry) => entry.date === selected);
  const date = fromKey(selected);
  const add = () => router.push({ pathname: '/log-activity', params: { date: selected } });
  const changeDay = (offset: number) => {
    setSelected(dateKey(offsetDate(date, offset)));
    void Haptics.selectionAsync();
  };
  const deleteEntry = async (id: string) => {
    setRetryId(id);
    if (await remove(id)) setRetryId(null);
  };
  const confirmDelete = (id: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Ștergi această activitate?')) void deleteEntry(id);
    } else {
      Alert.alert('Ștergi activitatea?', 'Această acțiune nu poate fi anulată.', [
        { text: 'Anulează', style: 'cancel' },
        { text: 'Șterge', style: 'destructive', onPress: () => void deleteEntry(id) },
      ]);
    }
  };
  return (
    <SafeAreaView edges={['top']} className="bg-background flex-1">
      <FlatList
        data={ready ? dayEntries : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 32,
          width: '100%',
          maxWidth: 600,
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Heading title="Activități" />
            <View className="mb-5 flex-row items-center gap-2">
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                accessibilityLabel="Ziua precedentă"
                onPress={() => changeDay(-1)}
              >
                <ChevronLeft size={20} color={palette.muted} />
              </Button>
              <View className="flex-1 items-center">
                <Typography type="body" weight="semibold" numberOfLines={1}>
                  {selected === dateKey()
                    ? 'Astăzi'
                    : date.toLocaleDateString('ro-RO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                </Typography>
              </View>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                accessibilityLabel="Ziua următoare"
                onPress={() => changeDay(1)}
              >
                <ChevronRight size={20} color={palette.muted} />
              </Button>
            </View>
            <StepsSummary date={selected} />
            {!ready ? (
              error ? (
                <View className="items-center gap-4 py-8">
                  <Dumbbell color={palette.accent} />
                  <Typography type="body" weight="normal" align="center" className="text-danger">
                    {error}
                  </Typography>
                  <Button onPress={() => void load()}>
                    <Button.Label>Încearcă din nou</Button.Label>
                  </Button>
                </View>
              ) : (
                <View className="gap-4">
                  <Skeleton className="h-40 rounded-3xl" />
                  <Skeleton className="h-12 rounded-full" />
                  <Skeleton className="h-24 rounded-3xl" />
                </View>
              )
            ) : (
              <>
                <Card className="bg-surface mb-5 rounded-[28px] p-5">
                  <View className="mb-5 flex-row items-center gap-2">
                    <View className="bg-peach h-9 w-9 items-center justify-center rounded-xl">
                      <Dumbbell size={20} color={palette.accent} />
                    </View>
                    <Typography type="body" weight="semibold">
                      Rezumatul zilei
                    </Typography>
                  </View>
                  <View className="flex-row gap-3">
                    <View className="flex-1 gap-1">
                      <Flame size={20} color={palette.accent} />
                      <Typography type="h2" weight="bold">
                        {dayEntries
                          .reduce((sum, entry) => sum + entry.calories, 0)
                          .toLocaleString('ro-RO')}
                      </Typography>
                      <Typography type="body-sm" weight="normal" color="muted">
                        kcal estimate
                      </Typography>
                    </View>
                    <View className="border-border flex-1 gap-1 border-l pl-4">
                      <Timer size={20} color={palette.muted} />
                      <Typography type="h2" weight="bold">
                        {dayEntries
                          .reduce((sum, entry) => sum + entry.minutes, 0)
                          .toLocaleString('ro-RO')}
                      </Typography>
                      <Typography type="body-sm" weight="normal" color="muted">
                        {dayEntries.reduce((sum, entry) => sum + entry.minutes, 0) === 1
                          ? 'minut'
                          : 'minute'}
                      </Typography>
                    </View>
                  </View>
                </Card>
                <Button className="mb-6" onPress={add} isDisabled={busy}>
                  <Plus size={20} color={palette.white} />
                  <Button.Label>Adaugă activitate</Button.Label>
                </Button>
                {error && (
                  <View className="mb-4 gap-2">
                    <Typography type="body-sm" weight="normal" className="text-danger">
                      {error}
                    </Typography>
                    {retryId && (
                      <Button
                        variant="secondary"
                        size="sm"
                        isDisabled={busy}
                        onPress={() => void deleteEntry(retryId)}
                      >
                        <Button.Label>Încearcă din nou</Button.Label>
                      </Button>
                    )}
                  </View>
                )}
                <Typography type="h4" weight="semibold" className="mb-4">
                  Jurnal de activități
                </Typography>
              </>
            )}
          </>
        }
        ListEmptyComponent={
          ready ? (
            <Card className="bg-surface items-center gap-3 rounded-3xl p-6">
              <View className="bg-peach h-14 w-14 items-center justify-center rounded-2xl">
                <Dumbbell size={25} color={palette.accent} />
              </View>
              <Typography type="body" weight="normal" color="muted" align="center">
                Nicio activitate în această zi.
              </Typography>
              <Button variant="secondary" size="sm" onPress={add}>
                <Button.Label>Înregistrează prima activitate</Button.Label>
              </Button>
            </Card>
          ) : undefined
        }
        renderItem={({ item }) => (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="mb-3"
          >
            <Card className="bg-surface flex-row items-center gap-3 rounded-3xl p-4">
              <View className="bg-peach h-10 w-10 items-center justify-center rounded-2xl">
                <Dumbbell size={20} color={palette.accent} />
              </View>
              <View className="flex-1 gap-1">
                <Typography type="body" weight="semibold">
                  {activityTypes.find((type) => type.id === item.type)?.name}
                </Typography>
                <Typography type="body-sm" weight="normal" color="muted">
                  {item.minutes} min · {item.calories} kcal
                </Typography>
              </View>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                accessibilityLabel="Șterge activitatea"
                isDisabled={busy}
                onPress={() => confirmDelete(item.id)}
              >
                <Trash2 size={18} color={palette.muted} />
              </Button>
            </Card>
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}
