import { useEffect, useRef, useState } from 'react';
import { View, FlatList, KeyboardAvoidingView, Linking, Platform, ScrollView } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  PressableFeedback,
  Skeleton,
  Spinner,
  TextField,
  Typography,
} from 'heroui-native';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Minus,
  Utensils,
  X,
  Trash2,
  ScanBarcode,
} from 'lucide-react-native';
import BarcodeScanner from '@/components/BarcodeScanner';
import { getOpenFoodFacts, type CatalogFood } from '@/lib/open-food-facts';
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
  type Meal,
  type Nutrition,
} from '@/lib/tracker';

const back = () => goBackOrReplace('/');
const moreInfo = (code: string) => router.push({ pathname: '/food-more-info', params: { code } });

export default function LogFood() {
  const params = useLocalSearchParams<{ date?: string; meal?: string; id?: string }>();
  const { entries, goal, ready, busy, error, load, save, clearError } = useTracker();
  const existing = entries.find((e) => e.id === params.id);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(!!existing);
  const [selected, setSelected] = useState<CatalogFood | null>(null);
  const [infoCode, setInfoCode] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'manual' | null>(null);
  const [barcode, setBarcode] = useState('');
  const [results, setResults] = useState<CatalogFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searched, setSearched] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextPage, setNextPage] = useState(2);
  const [lastRequest, setLastRequest] = useState<{
    action: 'search' | 'barcode';
    query: string;
    page: number;
  } | null>(null);
  const [nutritionNotice, setNutritionNotice] = useState('');
  const [amount, setAmount] = useState('100');
  const requestId = useRef(0);
  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [],
  );
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
  const choose = (food: CatalogFood) => {
    setInfoCode(food.productCode ?? null);
    const incomplete = !!food.missingNutrition?.length;
    setSelected(incomplete ? null : food);
    setName(food.name);
    setServing(food.serving);
    setQuantity(1);
    setAmount('100');
    setNutritionNotice(
      incomplete
        ? 'Open Food Facts nu are toate valorile nutritive. Completează câmpurile lipsă pentru 100 g/ml înainte de adăugare.'
        : '',
    );
    if (incomplete)
      setNumbers({
        calories: food.missingNutrition?.includes('calories') ? '' : String(food.calories),
        protein: food.missingNutrition?.includes('protein') ? '' : String(food.protein),
        carbs: food.missingNutrition?.includes('carbs') ? '' : String(food.carbs),
        fat: food.missingNutrition?.includes('fat') ? '' : String(food.fat),
      });
    setScanMode(null);
    setValidation('');
    setEditing(true);
    clearError();
  };
  const resetSearch = () => {
    requestId.current += 1;
    setQuery('');
    setResults([]);
    setSearched(false);
    setSearching(false);
    setSearchError('');
    setLastRequest(null);
    setHasMore(false);
  };
  const lookup = async (action: 'search' | 'barcode', text: string, page = 1) => {
    const value = text.trim();
    if (action === 'barcode' ? !/^\d{8,14}$/.test(value) : value.length < 2) {
      setSearchError(
        action === 'barcode'
          ? 'Introdu un cod de bare cu 8–14 cifre.'
          : 'Scrie cel puțin două caractere.',
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const currentRequest = ++requestId.current;
    setScanMode(null);
    setSearching(true);
    setSearchError('');
    setSearched(true);
    setLastRequest({ action, query: value, page });
    if (page === 1) {
      setResults([]);
      setHasMore(false);
    }
    try {
      const response = await getOpenFoodFacts(action, value, page);
      if (currentRequest !== requestId.current) return;
      setResults((previous) =>
        page === 1
          ? response.products
          : [
              ...previous,
              ...response.products.filter((food) => !previous.some((item) => item.id === food.id)),
            ],
      );
      setHasMore(response.hasMore);
      setNextPage(response.page + 1);
      if (action === 'barcode' && response.products[0]) choose(response.products[0]);
    } catch (cause) {
      if (currentRequest !== requestId.current) return;
      setSearchError(
        cause instanceof Error
          ? cause.message
          : 'Nu am putut încărca alimentele. Încearcă din nou.',
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      if (currentRequest === requestId.current) setSearching(false);
    }
  };
  const custom = () => {
    requestId.current += 1;
    setSearching(false);
    setScanMode(null);
    setNutritionNotice('');
    setSelected(null);
    setInfoCode(null);
    setName(lastRequest?.action === 'barcode' ? '' : query);
    setServing('1 serving');
    setQuantity(1);
    setNumbers({ calories: '', protein: '', carbs: '', fat: '' });
    setValidation('');
    setEditing(true);
    clearError();
  };
  const portion =
    selected?.source === 'open-food-facts' ? Number(amount.replace(',', '.')) / 100 : quantity;
  const submit = async () => {
    const nutrition: Nutrition = selected
      ? {
          calories: Math.round(selected.calories * portion),
          protein: Math.round(selected.protein * portion * 10) / 10,
          carbs: Math.round(selected.carbs * portion * 10) / 10,
          fat: Math.round(selected.fat * portion * 10) / 10,
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
      (!!nutritionNotice && Object.values(numbers).some((value) => !value.trim())) ||
      (selected && (!Number.isFinite(portion) || portion <= 0 || portion > 100)) ||
      nutrition.calories < 0 ||
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
      serving:
        selected?.source === 'open-food-facts'
          ? `${Number(amount.replace(',', '.'))} ${selected.serving.endsWith('ml') ? 'ml' : 'g'}`
          : selected
            ? `${quantity} × ${serving}`
            : serving.trim(),
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
  const list: CatalogFood[] = searched ? results : foods;
  const openSource = () => {
    void Linking.openURL('https://world.openfoodfacts.org/terms-of-use').catch(() => {
      setSearchError('Nu am putut deschide informațiile despre Open Food Facts.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    });
  };
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
                if (scanMode) {
                  setScanMode(null);
                  setSearchError('');
                } else if (editing && !existing) {
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
          ) : scanMode ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
            >
              {scanMode === 'camera' ? (
                <BarcodeScanner
                  onScan={(code) => {
                    setBarcode(code);
                    void lookup('barcode', code);
                  }}
                  onManual={() => setScanMode('manual')}
                />
              ) : (
                <Card className="gap-4 rounded-3xl p-5">
                  <TextField isInvalid={!!searchError}>
                    <Label>Cod de bare</Label>
                    <Input
                      value={barcode}
                      onChangeText={(value) => {
                        setBarcode(value.replace(/\D/g, ''));
                        setSearchError('');
                      }}
                      keyboardType="number-pad"
                      maxLength={14}
                      placeholder="8–14 cifre"
                      returnKeyType="search"
                      onSubmitEditing={() => void lookup('barcode', barcode)}
                    />
                    {!!searchError && <FieldError>{searchError}</FieldError>}
                  </TextField>
                  <Button isDisabled={searching} onPress={() => void lookup('barcode', barcode)}>
                    <Button.Label>Caută produsul</Button.Label>
                  </Button>
                </Card>
              )}
            </ScrollView>
          ) : !editing ? (
            <>
              <View className="mb-4 gap-3 px-5">
                <View className="bg-surface flex-row items-center rounded-2xl px-3">
                  <Search size={19} color={palette.muted} />
                  <Input
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Caută în Open Food Facts"
                    returnKeyType="search"
                    onSubmitEditing={() => {
                      if (!searching) void lookup('search', query);
                    }}
                    maxLength={100}
                    className="flex-1 border-0 bg-transparent"
                    accessibilityLabel="Caută alimente"
                  />
                  {(!!query || searched) && (
                    <Button
                      isIconOnly
                      variant="ghost"
                      size="sm"
                      accessibilityLabel="Șterge căutarea"
                      onPress={resetSearch}
                    >
                      <X size={16} color={palette.muted} />
                    </Button>
                  )}
                </View>
                <View className="flex-row gap-2">
                  <Button
                    className="flex-1 rounded-2xl"
                    isDisabled={searching || query.trim().length < 2}
                    onPress={() => void lookup('search', query)}
                  >
                    {searching && <Spinner size="sm" color={palette.white} />}
                    <Button.Label numberOfLines={1}>
                      {searching ? 'Se caută…' : 'Caută'}
                    </Button.Label>
                  </Button>
                  <Button
                    className="flex-1 rounded-2xl"
                    variant="secondary"
                    isDisabled={searching}
                    onPress={() => {
                      setSearchError('');
                      setScanMode('camera');
                    }}
                  >
                    <ScanBarcode size={18} color={palette.accent} />
                    <Button.Label numberOfLines={1}>Scanează</Button.Label>
                  </Button>
                </View>
              </View>
              <View className="mb-3 flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5">
                <Typography type="body" weight="semibold">
                  {searched ? 'Open Food Facts' : 'Everyday foods'}
                </Typography>
                <Typography type="body-xs" weight="normal" color="muted">
                  {searched ? 'Valori per 100 g/ml' : 'Estimates per serving'}
                </Typography>
              </View>
              <FlatList
                data={list}
                keyExtractor={(f) => f.id}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={
                  searchError ? (
                    <View className="mb-4 items-center gap-3">
                      <Typography align="center" className="text-danger">
                        {searchError}
                      </Typography>
                      {lastRequest && (
                        <Button
                          variant="secondary"
                          isDisabled={searching}
                          onPress={() =>
                            void lookup(lastRequest.action, lastRequest.query, lastRequest.page)
                          }
                        >
                          <Button.Label>Încearcă din nou</Button.Label>
                        </Button>
                      )}
                    </View>
                  ) : undefined
                }
                ListEmptyComponent={
                  searching ? (
                    <View className="gap-2">
                      {[0, 1, 2, 3].map((key) => (
                        <Skeleton key={key} className="h-20 rounded-2xl" />
                      ))}
                    </View>
                  ) : searchError ? undefined : (
                    <Empty
                      text={
                        lastRequest?.action === 'barcode'
                          ? 'Codul nu a fost găsit în Open Food Facts'
                          : 'Niciun aliment găsit'
                      }
                      action={
                        lastRequest?.action === 'barcode' ? 'Adaugă manual' : 'Șterge căutarea'
                      }
                      onPress={lastRequest?.action === 'barcode' ? custom : resetSearch}
                    />
                  )
                }
                ListFooterComponent={
                  hasMore && lastRequest?.action === 'search' ? (
                    <Button
                      className="mt-3"
                      variant="secondary"
                      isDisabled={searching}
                      onPress={() => void lookup('search', lastRequest.query, nextPage)}
                    >
                      <Button.Label>
                        {searching ? 'Se încarcă…' : 'Mai multe rezultate'}
                      </Button.Label>
                    </Button>
                  ) : undefined
                }
                renderItem={({ item }) => (
                  <View className="bg-surface mb-2 rounded-2xl">
                    <PressableFeedback
                      className="rounded-2xl"
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${item.name}`}
                      onPress={() => choose(item)}
                    >
                      <Card className="bg-surface flex-row items-center gap-3 rounded-2xl p-4">
                        <View className="bg-peach h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                          <Utensils size={18} color={palette.accent} />
                        </View>
                        <View className="min-w-0 flex-1 shrink">
                          <Typography type="body-sm" weight="semibold" numberOfLines={2}>
                            {item.name}
                          </Typography>
                          <Typography
                            type="body-xs"
                            weight="normal"
                            color="muted"
                            className="mt-1"
                            numberOfLines={1}
                          >
                            {item.source ? `${item.category} · ${item.serving}` : item.serving}
                          </Typography>
                          {!!item.missingNutrition?.length && (
                            <Typography type="body-xs" color="muted">
                              Valori incomplete
                            </Typography>
                          )}
                        </View>
                        <Typography type="body-sm" weight="medium" className="shrink-0">
                          {item.missingNutrition?.includes('calories')
                            ? '—'
                            : Math.round(item.calories)}
                        </Typography>
                        <ChevronRight size={16} color={palette.muted} />
                      </Card>
                    </PressableFeedback>
                    {item.productCode && (
                      <View className="px-4 pb-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-xl"
                          onPress={() => moreInfo(item.productCode!)}
                        >
                          <Button.Label>More Info</Button.Label>
                          <ChevronRight size={16} color={palette.accent} />
                        </Button>
                      </View>
                    )}
                  </View>
                )}
              />
              <View className="border-border gap-1 border-t px-5 py-3">
                <Button variant="ghost" size="sm" onPress={openSource}>
                  <Button.Label className="text-muted" numberOfLines={1}>
                    Open Food Facts · ODbL
                  </Button.Label>
                </Button>
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
                {infoCode && (
                  <Button
                    variant="secondary"
                    className="mb-4 rounded-2xl"
                    onPress={() => moreInfo(infoCode)}
                  >
                    <Button.Label>More Info</Button.Label>
                    <ChevronRight size={17} color={palette.accent} />
                  </Button>
                )}
                {selected ? (
                  <Card className="mb-5 rounded-3xl p-5">
                    <Typography.Heading type="h4" weight="bold">
                      {selected.name}
                    </Typography.Heading>
                    <Typography type="body-sm" weight="normal" color="muted" className="mt-1">
                      {selected.serving}
                    </Typography>
                    {selected.source === 'open-food-facts' ? (
                      <View className="mt-5 gap-3">
                        <TextField>
                          <Label> Cantitate ({selected.serving.endsWith('ml') ? 'ml' : 'g'})</Label>
                          <Input
                            value={amount}
                            onChangeText={(value) => {
                              setAmount(value);
                              setValidation('');
                            }}
                            keyboardType="decimal-pad"
                            maxLength={7}
                            accessibilityLabel="Cantitate consumată"
                          />
                        </TextField>
                        <Typography type="body-xs" color="muted">
                          Verifică valorile cu eticheta produsului.
                        </Typography>
                      </View>
                    ) : (
                      <View className="mt-6 flex-row items-center justify-between">
                        <Typography type="body-sm" weight="medium">
                          Servings
                        </Typography>
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
                          <Typography type="body" weight="semibold">
                            {quantity}
                          </Typography>
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
                    )}
                    <View className="items-center py-7">
                      <Typography type="h1" weight="bold" style={{ fontSize: 48, lineHeight: 48 }}>
                        {Math.round(selected.calories * (Number.isFinite(portion) ? portion : 0))}
                      </Typography>
                      <Typography type="body-sm" weight="normal" color="muted" className="mt-1">
                        kcal
                      </Typography>
                    </View>
                    <View className="flex-row gap-3">
                      {(['protein', 'carbs', 'fat'] as const).map((k) => (
                        <View className="flex-1 items-center" key={k}>
                          <Typography type="body" weight="semibold">
                            {Math.round(
                              selected[k] * (Number.isFinite(portion) ? portion : 0) * 10,
                            ) / 10}
                            g
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
                    {!!nutritionNotice && (
                      <Typography type="body-sm" color="muted">
                        {nutritionNotice}
                      </Typography>
                    )}
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
                {!!error && (
                  <Typography
                    type="body-sm"
                    weight="normal"
                    style={{ color: palette.accent }}
                    className="mt-3"
                  >
                    {error}
                  </Typography>
                )}
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
