import { useEffect, useState } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Button, Card, FieldError, Input, Label, PressableFeedback, TextField, Typography } from 'heroui-native';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Minus,
  Utensils,
  X,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { Empty, LoadState } from '@/components/TrackerUI';
import { goBackOrReplace } from '@/lib/navigation';
import {
  dateKey,
  foods,
  meals,
  palette,
  useTracker,
  type Food,
  type Meal,
  type Nutrition,
} from '@/lib/tracker';

const back = () => goBackOrReplace('/');

export default function LogFood() {
  const params = useLocalSearchParams<{ date?: string; meal?: string; id?: string }>();
  const { entries, goal, ready, busy, error, load, save, clearError } = useTracker();
  const existing = entries.find((e) => e.id === params.id);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(!!existing);
  const [selected, setSelected] = useState<Food | null>(null);
  const [meal, setMeal] = useState<Meal>(
    existing?.meal ?? meals.find((m) => m === params.meal) ?? 'Breakfast',
  );
  const [name, setName] = useState(existing?.name ?? '');
  const [serving, setServing] = useState(existing?.serving ?? '1 serving');
  const [quantity, setQuantity] = useState(1);
  const [numbers, setNumbers] = useState({
    calories: existing ? String(existing.calories) : '',
    protein: existing ? String(existing.protein) : '',
    carbs: existing ? String(existing.carbs) : '',
    fat: existing ? String(existing.fat) : '',
  });
  const [validation, setValidation] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (!ready) void load();
  }, [ready, load]);
  const [previousExisting, setPreviousExisting] = useState(existing);
  if (existing !== previousExisting) {
    setPreviousExisting(existing);
    if (existing) {
      setName(existing.name);
      setServing(existing.serving);
      setMeal(existing.meal);
      setNumbers({
        calories: String(existing.calories),
        protein: String(existing.protein),
        carbs: String(existing.carbs),
        fat: String(existing.fat),
      });
      setEditing(true);
    }
  }
  const choose = (food: Food) => {
    setSelected(food);
    setName(food.name);
    setServing(food.serving);
    setQuantity(1);
    setValidation('');
    setEditing(true);
    clearError();
  };
  const custom = () => {
    setSelected(null);
    setName(query);
    setServing('1 serving');
    setQuantity(1);
    setNumbers({ calories: '', protein: '', carbs: '', fat: '' });
    setValidation('');
    setEditing(true);
    clearError();
  };
  const submit = async () => {
    const nutrition: Nutrition = selected
      ? {
          calories: Math.round(selected.calories * quantity),
          protein: Math.round(selected.protein * quantity),
          carbs: Math.round(selected.carbs * quantity),
          fat: Math.round(selected.fat * quantity),
        }
      : {
          calories: Number(numbers.calories),
          protein: Number(numbers.protein),
          carbs: Number(numbers.carbs),
          fat: Number(numbers.fat),
        };
    if (
      !name.trim() ||
      !serving.trim() ||
      (!selected && !numbers.calories.trim()) ||
      nutrition.calories <= 0 ||
      nutrition.calories > 10000 ||
      Object.values(nutrition).some((n) => !Number.isFinite(n) || n < 0 || n > 10000)
    ) {
      setValidation(
        'Add a food name, serving, and valid calories. Nutrients must be positive numbers or zero.',
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const entry = {
      id: existing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      serving: selected ? `${quantity} × ${serving}` : serving.trim(),
      meal,
      date: params.date ?? dateKey(),
      ...nutrition,
    };
    const next = existing
      ? entries.map((e) => (e.id === existing.id ? entry : e))
      : [...entries, entry];
    if (await save({ goal, entries: next })) back();
  };
  const remove = async () => {
    if (existing && (await save({ goal, entries: entries.filter((e) => e.id !== existing.id) })))
      back();
  };
  const list = foods.filter((f) =>
    `${f.name} ${f.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <SafeAreaView edges={['top', 'bottom']} className="bg-background flex-1">
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="w-full flex-1 self-center" style={{ maxWidth: 600 }}>
          <View className="flex-row items-center justify-between px-5 pt-3 pb-4">
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              accessibilityLabel="Back"
              onPress={() => {
                if (editing && !existing) {
                  setEditing(false);
                  setValidation('');
                  clearError();
                } else back();
              }}
            >
              <ChevronLeft size={24} color={palette.ink} />
            </Button>
            <Typography.Heading type="h5" weight="semibold">
              {existing ? 'Edit food' : 'Log food'}
            </Typography.Heading>
            <Button isIconOnly variant="ghost" size="sm" accessibilityLabel="Close" onPress={back}>
              <X size={21} color={palette.muted} />
            </Button>
          </View>
          {!ready ? (
            <View className="px-5">
              <LoadState />
            </View>
          ) : !editing ? (
            <>
              <View className="mb-4 px-5">
                <View className="bg-surface flex-row items-center rounded-2xl px-3">
                  <Search size={19} color={palette.muted} />
                  <Input
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search foods"
                    className="flex-1 border-0 bg-transparent"
                    accessibilityLabel="Search foods"
                  />
                  {!!query && (
                    <Button
                      isIconOnly
                      variant="ghost"
                      size="sm"
                      accessibilityLabel="Clear search"
                      onPress={() => setQuery('')}
                    >
                      <X size={16} color={palette.muted} />
                    </Button>
                  )}
                </View>
              </View>
              <View className="mb-3 flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5">
                <Typography type="body" weight="semibold">
                  {query ? 'Search results' : 'Everyday foods'}
                </Typography>
                <Typography type="body-xs" weight="normal" color="muted">
                  Estimates per serving
                </Typography>
              </View>
              <FlatList
                data={list}
                keyExtractor={(f) => f.id}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Empty
                    text="No matching foods"
                    action="Clear search"
                    onPress={() => setQuery('')}
                  />
                }
                renderItem={({ item }) => (
                  <PressableFeedback
                    className="mb-2 rounded-2xl"
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${item.name}`}
                    onPress={() => choose(item)}
                  >
                    <Card className="bg-surface flex-row items-center gap-3 rounded-2xl p-4">
                      <View className="bg-peach h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                        <Utensils size={18} color={palette.accent} />
                      </View>
                      <View className="min-w-0 flex-1 shrink">
                        <Typography type="body-sm" weight="semibold" numberOfLines={2}>{item.name}</Typography>
                        <Typography type="body-xs" weight="normal" color="muted" className="mt-1">{item.serving}</Typography>
                      </View>
                      <Typography type="body-sm" weight="medium" className="shrink-0">{item.calories}</Typography>
                      <ChevronRight size={16} color={palette.muted} />
                    </Card>
                  </PressableFeedback>
                )}
              />
              <View className="border-border border-t px-5 py-4">
                <Button variant="secondary" className="rounded-2xl" onPress={custom}>
                  <Plus color={palette.accent} size={20} />
                  <Button.Label>Add custom food</Button.Label>
                </Button>
              </View>
            </>
          ) : (
            <>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
              >
                <View className="mb-5 flex-row flex-wrap gap-2">
                  {meals.map((m) => (
                    <Button
                      key={m}
                      variant={m === meal ? 'primary' : 'secondary'}
                      size="sm"
                      className="rounded-full"
                      onPress={() => {
                        setMeal(m);
                        void Haptics.selectionAsync();
                      }}
                    >
                      <Button.Label numberOfLines={1}>{m}</Button.Label>
                    </Button>
                  ))}
                </View>
                {selected ? (
                  <Card className="mb-5 rounded-3xl p-5">
                    <Typography.Heading type="h4" weight="bold">
                      {selected.name}
                    </Typography.Heading>
                    <Typography type="body-sm" weight="normal" color="muted" className="mt-1">
                      {selected.serving}
                    </Typography>
                    <View className="mt-6 flex-row items-center justify-between">
                      <Typography type="body-sm" weight="medium">Servings</Typography>
                      <View className="flex-row items-center gap-4">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="secondary"
                          accessibilityLabel="Fewer servings"
                          isDisabled={quantity <= 0.5}
                          onPress={() => {
                            setQuantity(quantity - 0.5);
                            void Haptics.selectionAsync();
                          }}
                        >
                          <Minus size={18} color={palette.accent} />
                        </Button>
                        <Typography type="body" weight="semibold">{quantity}</Typography>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="secondary"
                          accessibilityLabel="More servings"
                          isDisabled={quantity >= 20}
                          onPress={() => {
                            setQuantity(quantity + 0.5);
                            void Haptics.selectionAsync();
                          }}
                        >
                          <Plus size={18} color={palette.accent} />
                        </Button>
                      </View>
                    </View>
                    <View className="items-center py-7">
                      <Typography type="h1" weight="bold" style={{ fontSize: 48, lineHeight: 48 }}>
                        {Math.round(selected.calories * quantity)}
                      </Typography>
                      <Typography type="body-sm" weight="normal" color="muted" className="mt-1">
                        kcal
                      </Typography>
                    </View>
                    <View className="flex-row gap-3">
                      {(['protein', 'carbs', 'fat'] as const).map((k) => (
                        <View className="flex-1 items-center" key={k}>
                          <Typography type="body" weight="semibold">
                            {Math.round(selected[k] * quantity)}g
                          </Typography>
                          <Typography type="body-xs" weight="normal" color="muted" className="mt-1">
                            {k === 'protein' ? 'Protein' : k === 'carbs' ? 'Carbs' : 'Fat'}
                          </Typography>
                        </View>
                      ))}
                    </View>
                  </Card>
                ) : (
                  <Card className="gap-4 rounded-3xl p-5">
                    <TextField>
                      <Label>Food name</Label>
                      <Input
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Homemade pasta"
                        autoCapitalize="sentences"
                        maxLength={80}
                      />
                    </TextField>
                    <TextField>
                      <Label>Serving</Label>
                      <Input
                        value={serving}
                        onChangeText={setServing}
                        placeholder="e.g. 1 bowl"
                        maxLength={80}
                      />
                    </TextField>
                    {(['calories', 'protein', 'carbs', 'fat'] as const).map((k) => (
                      <TextField key={k}>
                        <Label>
                          {k === 'calories'
                            ? 'Calories (kcal)'
                            : `${k[0].toUpperCase()}${k.slice(1)} (g)`}
                        </Label>
                        <Input
                          value={numbers[k]}
                          onChangeText={(value) => {
                            setNumbers({ ...numbers, [k]: value });
                            setValidation('');
                          }}
                          keyboardType="decimal-pad"
                          placeholder={k === 'calories' ? 'Required' : '0'}
                          maxLength={7}
                        />
                      </TextField>
                    ))}
                  </Card>
                )}
                {!!validation && <FieldError className="mt-3">{validation}</FieldError>}
                {!!error && <Typography type="body-sm" weight="normal" style={{ color: palette.accent }} className="mt-3">{error}</Typography>}
                {existing && (
                  <View className="mt-5">
                    {confirmDelete ? (
                      <Card className="gap-3 rounded-2xl">
                        <Typography>Remove this food from your diary?</Typography>
                        <View className="flex-row gap-2">
                          <Button
                            className="flex-1"
                            variant="secondary"
                            onPress={() => setConfirmDelete(false)}
                          >
                            <Button.Label>Keep</Button.Label>
                          </Button>
                          <Button
                            className="flex-1"
                            variant="danger"
                            isDisabled={busy}
                            onPress={() => void remove()}
                          >
                            <Button.Label>{busy ? 'Removing…' : 'Remove'}</Button.Label>
                          </Button>
                        </View>
                      </Card>
                    ) : (
                      <Button variant="ghost" onPress={() => setConfirmDelete(true)}>
                        <Trash2 size={17} color={palette.accent} />
                        <Button.Label className="text-accent">Remove food</Button.Label>
                      </Button>
                    )}
                  </View>
                )}
              </ScrollView>
              <View className="border-border border-t px-5 py-4">
                <Button isDisabled={busy} className="rounded-2xl" onPress={() => void submit()}>
                  <Button.Label>
                    {busy ? 'Saving…' : existing ? 'Save changes' : 'Add to diary'}
                  </Button.Label>
                </Button>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
