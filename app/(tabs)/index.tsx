import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Typography } from 'heroui-native';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Flame,
  Coffee,
  Sun,
  Moon,
  Apple,
  Heart,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Screen, Heading, LoadState, Ring } from '@/components/TrackerUI';
import {
  dateKey,
  fromKey,
  offsetDate,
  meals,
  palette,
  totals,
  useTracker,
  type Meal,
} from '@/lib/tracker';

const mealIcons = [Coffee, Sun, Moon, Apple];
export default function Today() {
  const [selected, setSelected] = useState(dateKey());
  const { entries, goal, ready } = useTracker();
  const date = fromKey(selected);
  const dayEntries = entries.filter((e) => e.date === selected);
  const total = totals(dayEntries);
  const monday = offsetDate(date, -((date.getDay() + 6) % 7));
  const changeDate = (key: string) => {
    setSelected(key);
    void Haptics.selectionAsync();
  };
  const add = (meal?: Meal) =>
    router.push({ pathname: '/log-food', params: { date: selected, ...(meal ? { meal } : {}) } });
  const macroGoals = [
    Math.round((goal * 0.25) / 4),
    Math.round((goal * 0.45) / 4),
    Math.round((goal * 0.3) / 9),
  ];
  return (
    <Screen>
      <View className="mb-3 flex-row items-center gap-1.5">
        <Heart size={16} color={palette.accent} fill={palette.accent} />
        <Typography type="body-sm" weight="semibold" style={{ color: palette.accent }}>
          nourish
        </Typography>
      </View>
      <Heading
        title={
          selected === dateKey()
            ? 'Today'
            : date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
        }
        action={
          <Button
            isIconOnly
            size="sm"
            variant="secondary"
            accessibilityLabel="Edit calorie goal"
            onPress={() => router.push('/settings')}
            className="h-10 w-10 rounded-full"
          >
            <SlidersIcon />
          </Button>
        }
      />
      <View className="mb-4 flex-row items-center justify-between">
        <Typography type="body-sm" weight="medium" color="muted">
          {date.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
        </Typography>
        <View className="flex-row gap-1">
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            accessibilityLabel="Previous week"
            onPress={() => changeDate(dateKey(offsetDate(date, -7)))}
          >
            <ChevronLeft size={18} color={palette.muted} />
          </Button>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            accessibilityLabel="Next week"
            onPress={() => changeDate(dateKey(offsetDate(date, 7)))}
          >
            <ChevronRight size={18} color={palette.muted} />
          </Button>
        </View>
      </View>
      <View className="mb-6 flex-row gap-1">
        {Array.from({ length: 7 }, (_, i) => {
          const day = offsetDate(monday, i);
          const key = dateKey(day);
          const active = key === selected;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={day.toDateString()}
              accessibilityState={{ selected: active }}
              onPress={() => changeDate(key)}
              className={`flex-1 items-center gap-2 rounded-2xl py-2.5 ${active ? 'bg-accent' : ''}`}
            >
              <Typography
                type="body-xs"
                weight="normal"
                color={active ? 'default' : 'muted'}
                style={{
                  fontSize: 11,
                  lineHeight: 16,
                  ...(active ? { color: palette.white } : {}),
                }}
              >
                {day.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1)}
              </Typography>
              <Typography
                type="body"
                weight="semibold"
                style={active ? { color: palette.white } : undefined}
              >
                {day.getDate()}
              </Typography>
              <View
                className={`h-1 w-1 rounded-full ${active ? 'bg-accent-foreground' : key === dateKey() ? 'bg-accent' : 'bg-transparent'}`}
              />
            </Pressable>
          );
        })}
      </View>
      {!ready ? (
        <LoadState />
      ) : (
        <>
          <Card className="bg-surface mb-4 rounded-[28px] p-5">
            <View className="flex-row items-center gap-2">
              <View className="bg-peach h-8 w-8 items-center justify-center rounded-xl">
                <Flame size={18} color={palette.accent} />
              </View>
              <Typography type="body" weight="semibold">
                Daily calories
              </Typography>
            </View>
            <View className="items-center py-3">
              <Ring value={total.calories} goal={goal} />
            </View>
            <View className="border-border flex-row border-t pt-4">
              <View className="flex-1 items-center">
                <Typography type="h4" weight="semibold">
                  {total.calories.toLocaleString()}
                </Typography>
                <Typography type="body-xs" weight="normal" color="muted" className="mt-1">
                  Eaten
                </Typography>
              </View>
              <View className="bg-border w-px" />
              <View className="flex-1 items-center">
                <Typography type="h4" weight="semibold">
                  {goal.toLocaleString()}
                </Typography>
                <Typography type="body-xs" weight="normal" color="muted" className="mt-1">
                  Daily goal
                </Typography>
              </View>
            </View>
          </Card>
          <Card className="bg-surface mb-6 rounded-[24px] p-5">
            <View className="flex-row gap-5">
              {(['Protein', 'Carbs', 'Fat'] as const).map((label, i) => {
                const value = [total.protein, total.carbs, total.fat][i];
                const color = [palette.protein, palette.carbs, palette.fat][i];
                return (
                  <View key={label} className="flex-1 gap-2">
                    <Typography type="body-xs" weight="medium">
                      {label}
                    </Typography>
                    <View className="bg-background h-1.5 overflow-hidden rounded-full">
                      <View
                        style={{
                          backgroundColor: color,
                          height: '100%',
                          width: `${Math.min(value / macroGoals[i], 1) * 100}%`,
                        }}
                      />
                    </View>
                    <Typography type="body-xs" weight="normal">
                      <Typography type="body-xs" weight="semibold">
                        {Math.round(value)}g
                      </Typography>
                      <Typography type="body-xs" weight="normal" color="muted">
                        {' '}
                        / {macroGoals[i]}g
                      </Typography>
                    </Typography>
                  </View>
                );
              })}
            </View>
          </Card>
          <View className="mb-3 flex-row items-center justify-between">
            <Typography.Heading type="h4" weight="bold">
              Food diary
            </Typography.Heading>
            <Typography type="body-xs" weight="normal" color="muted">
              {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
            </Typography>
          </View>
          <Card className="bg-surface mb-5 rounded-[24px] p-0">
            {meals.map((meal, i) => {
              const Icon = mealIcons[i];
              const list = dayEntries.filter((e) => e.meal === meal);
              return (
                <View key={meal} className={`px-4 py-3 ${i !== 0 ? 'border-border border-t' : ''}`}>
                  <View className="flex-row items-center gap-3">
                    <View className="bg-background h-10 w-10 items-center justify-center rounded-xl">
                      <Icon size={20} color={palette.muted} />
                    </View>
                    <View className="flex-1">
                      <Typography type="body-sm" weight="semibold">
                        {meal}
                      </Typography>
                      <Typography type="body-xs" weight="normal" color="muted" className="mt-1">
                        {list.length ? `${totals(list).calories} kcal` : 'Nothing logged yet'}
                      </Typography>
                    </View>
                    <Button
                      isIconOnly
                      variant="ghost"
                      size="sm"
                      accessibilityLabel={`Add ${meal.toLowerCase()}`}
                      onPress={() => add(meal)}
                    >
                      <Plus size={20} color={palette.accent} />
                    </Button>
                  </View>
                  {list.map((entry) => (
                    <Animated.View
                      entering={FadeIn.duration(200)}
                      exiting={FadeOut.duration(200)}
                      key={entry.id}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${entry.name}`}
                        onPress={() =>
                          router.push({
                            pathname: '/log-food',
                            params: { id: entry.id, date: selected, meal },
                          })
                        }
                        className="ml-13 flex-row items-center gap-3 pt-3"
                      >
                        <View className="flex-1">
                          <Typography type="body-sm" weight="normal">
                            {entry.name}
                          </Typography>
                          <Typography type="body-xs" weight="normal" color="muted">
                            {entry.serving}
                          </Typography>
                        </View>
                        <Typography type="body-sm" weight="medium">
                          {entry.calories}
                        </Typography>
                        <ChevronRight size={14} color={palette.muted} />
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              );
            })}
          </Card>
          <Button className="h-13 rounded-2xl" onPress={() => add()}>
            <Plus size={20} color={palette.white} />
            <Button.Label>Log food</Button.Label>
          </Button>
        </>
      )}
    </Screen>
  );
}
function SlidersIcon() {
  return (
    <View className="items-center justify-center">
      <View className="bg-accent mb-1.5 h-px w-4" />
      <View className="bg-accent h-px w-4" />
      <View className="bg-accent absolute h-1.5 w-1.5 rounded-full" style={{ top: -2, left: 3 }} />
      <View
        className="bg-accent absolute h-1.5 w-1.5 rounded-full"
        style={{ bottom: -2, right: 3 }}
      />
    </View>
  );
}
