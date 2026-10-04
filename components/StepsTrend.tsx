import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Skeleton, Typography } from 'heroui-native';
import { Footprints } from 'lucide-react-native';
import { useSteps } from '@/lib/steps';
import { dateKey, offsetDate, palette } from '@/lib/tracker';

export function StepsTrend({ start }: { start: Date }) {
  const { entries, ready, error, load } = useSteps();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = offsetDate(start, index);
    const entry = entries.find((item) => item.date === dateKey(date));
    return { date, entry, count: entry?.count ?? 0 };
  });
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const recorded = days.filter((day) => day.entry).length;
  const max = Math.max(...days.map((day) => day.count));
  return (
    <Card className="mb-5 gap-4 rounded-[28px] p-5">
      <View className="flex-row items-center gap-2">
        <Footprints size={20} color={palette.accent} />
        <Typography type="body" weight="semibold">
          Pași săptămânali
        </Typography>
      </View>
      {!ready ? (
        error ? (
          <>
            <Typography type="body-sm" weight="normal" className="text-danger">
              {error}
            </Typography>
            <Button variant="secondary" onPress={() => void load()}>
              <Button.Label>Încearcă din nou</Button.Label>
            </Button>
          </>
        ) : (
          <Skeleton className="h-56 rounded-2xl" />
        )
      ) : recorded === 0 ? (
        <View className="items-center gap-3 py-4">
          <Typography type="body-sm" weight="normal" color="muted" align="center">
            Niciun pas înregistrat în această săptămână.
          </Typography>
          <Button
            variant="secondary"
            onPress={() =>
              router.push({ pathname: '/log-steps', params: { date: dateKey(start) } })
            }
          >
            <Button.Label>Adaugă pași</Button.Label>
          </Button>
        </View>
      ) : (
        <>
          <View>
            <Typography type="h2" weight="bold">
              {total.toLocaleString('ro-RO')}
            </Typography>
            <Typography type="body-xs" weight="normal" color="muted">
              {total === 1 ? 'pas în total' : 'pași în total'} ·{' '}
              {Math.round(total / recorded).toLocaleString('ro-RO')} / zi înregistrată
            </Typography>
          </View>
          <View>
            <View className="mb-3 flex-row justify-between">
              <Typography type="body-xs" weight="normal" color="muted">
                0
              </Typography>
              <Typography type="body-xs" weight="normal" color="muted">
                {max.toLocaleString('ro-RO')} pași
              </Typography>
            </View>
            <View className="border-border h-40 flex-row items-end gap-2 border-b">
              {days.map((day) => (
                <View
                  key={dateKey(day.date)}
                  className="h-full flex-1 items-center justify-end"
                  accessible
                  accessibilityLabel={`${day.date.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}: ${day.entry ? `${day.count} ${day.count === 1 ? 'pas' : 'pași'}` : 'neînregistrat'}`}
                >
                  <Typography
                    type="body-xs"
                    weight="normal"
                    color="muted"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {day.entry ? day.count.toLocaleString('ro-RO') : '–'}
                  </Typography>
                  <View
                    style={{
                      height: (day.count / (max || 1)) * 125,
                      width: '75%',
                      backgroundColor: palette.accent,
                      borderTopLeftRadius: 6,
                      borderTopRightRadius: 6,
                    }}
                  />
                </View>
              ))}
            </View>
            <View className="mt-3 flex-row gap-2">
              {days.map((day) => (
                <View key={dateKey(day.date)} className="flex-1 items-center">
                  <Typography type="body-xs" weight="normal" color="muted" numberOfLines={1}>
                    {day.date.toLocaleDateString('ro-RO', { weekday: 'short' }).replace('.', '')}
                  </Typography>
                </View>
              ))}
            </View>
          </View>
        </>
      )}
    </Card>
  );
}
