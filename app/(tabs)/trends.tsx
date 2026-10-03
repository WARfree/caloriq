import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Typography } from 'heroui-native';
import { ChevronLeft, ChevronRight, ChartNoAxesColumn } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Screen, Heading, LoadState, Empty } from '@/components/TrackerUI';
import { dateKey, offsetDate, totals, useTracker, palette } from '@/lib/tracker';

export default function Trends() {
  const { entries, goal, ready } = useTracker();
  const [week, setWeek] = useState(0);
  const start = offsetDate(new Date(), -((new Date().getDay() + 6) % 7) + week * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = offsetDate(start, i);
    const list = entries.filter((e) => e.date === dateKey(date));
    return { date, list, total: totals(list).calories };
  });
  const loggedDays = days.filter((d) => d.list.length);
  const sum = days.reduce((s, d) => s + d.total, 0);
  const average = loggedDays.length ? Math.round(sum / loggedDays.length) : 0;
  const max = Math.max(goal, ...days.map((d) => d.total));
  const change = (delta: number) => {
    setWeek(week + delta);
    void Haptics.selectionAsync();
  };
  return (
    <Screen>
      <Heading title="Trends" />
      <View className="mb-5 flex-row items-center justify-between">
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          accessibilityLabel="Previous week"
          onPress={() => change(-1)}
        >
          <ChevronLeft size={20} color={palette.muted} />
        </Button>
        <Typography type="body-sm" weight="semibold">
          {start.toLocaleDateString('en', { month: 'short', day: 'numeric' })} –{' '}
          {offsetDate(start, 6).toLocaleDateString('en', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Typography>
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          accessibilityLabel="Next week"
          isDisabled={week === 0}
          onPress={() => change(1)}
        >
          <ChevronRight size={20} color={palette.muted} />
        </Button>
      </View>
      {!ready ? (
        <LoadState />
      ) : (
        <>
          <Card className="mb-4 rounded-[28px] p-5">
            <View className="mb-4 flex-row items-center gap-2">
              <ChartNoAxesColumn size={19} color={palette.accent} />
              <Typography type="body" weight="semibold">
                Weekly calories
              </Typography>
            </View>
            <Typography type="h1" weight="bold" className="tracking-tight">
              {average.toLocaleString()}
              <Typography type="body-sm" weight="normal" color="muted">
                {' '}
                kcal
              </Typography>
            </Typography>
            <Typography type="body-xs" weight="normal" color="muted" className="mt-1">
              Average per logged day
            </Typography>
            <View className="mt-7 mb-2">
              <View className="mb-3 flex-row items-center justify-between">
                <Typography type="body-xs" weight="normal" color="muted">
                  Daily goal
                </Typography>
                <Typography type="body-xs" weight="normal" color="muted">
                  {goal.toLocaleString()} kcal
                </Typography>
              </View>
              <View className="border-border h-40 flex-row items-end gap-3 border-b">
                {days.map((d) => (
                  <View key={dateKey(d.date)} className="h-full flex-1 items-center justify-end">
                    <View
                      style={{
                        height: Math.max((d.total / max) * 140, 4),
                        width: '75%',
                        backgroundColor:
                          d.date.getDay() === new Date().getDay() && week === 0
                            ? palette.accent
                            : palette.track,
                        borderTopLeftRadius: 6,
                        borderTopRightRadius: 6,
                      }}
                      accessibilityLabel={`${d.date.toDateString()}: ${d.total} calories`}
                    />
                  </View>
                ))}
              </View>
              <View className="mt-3 flex-row gap-3">
                {days.map((d) => (
                  <View key={dateKey(d.date)} className="flex-1 items-center">
                    <Typography type="body-xs" weight="normal" color="muted">
                      {d.date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1)}
                    </Typography>
                  </View>
                ))}
              </View>
            </View>
          </Card>
          <View className="mb-6 flex-row gap-3">
            <Card className="flex-1 rounded-2xl p-4">
              <Typography type="body-xs" weight="normal" color="muted">
                Days logged
              </Typography>
              <Typography type="h3" weight="bold" className="mt-2">
                {loggedDays.length}
                <Typography type="body-sm" weight="normal" color="muted">
                  {' '}
                  / 7
                </Typography>
              </Typography>
            </Card>
            <Card className="flex-1 rounded-2xl p-4">
              <Typography type="body-xs" weight="normal" color="muted">
                Total calories
              </Typography>
              <Typography type="h3" weight="bold" className="mt-2">
                {sum.toLocaleString()}
              </Typography>
            </Card>
          </View>
          <Typography.Heading type="h4" weight="bold" className="mb-3">
            This week
          </Typography.Heading>
          <Card className="rounded-3xl p-0">
            {loggedDays.length === 0 ? (
              <Empty
                text="No meals logged this week"
                action="Log food"
                onPress={() => router.push({ pathname: '/log-food', params: { date: dateKey() } })}
              />
            ) : (
              days
                .filter((d) => d.list.length)
                .map((d, i) => (
                  <View
                    key={dateKey(d.date)}
                    className={`flex-row items-center p-4 ${i ? 'border-border border-t' : ''}`}
                  >
                    <View className="flex-1">
                      <Typography type="body-sm" weight="medium">
                        {d.date.toLocaleDateString('en', { weekday: 'long' })}
                      </Typography>
                      <Typography type="body-xs" weight="normal" color="muted" className="mt-1">
                        {d.list.length} {d.list.length === 1 ? 'entry' : 'entries'}
                      </Typography>
                    </View>
                    <Typography type="body-sm" weight="semibold">
                      {d.total.toLocaleString()}
                      <Typography type="body-xs" weight="normal" color="muted">
                        {' '}
                        kcal
                      </Typography>
                    </Typography>
                  </View>
                ))
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}
