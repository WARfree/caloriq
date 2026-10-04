import { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Button, Skeleton, Typography } from 'heroui-native';
import { AlertCircle, ChevronLeft, ExternalLink, PackageSearch } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { ProductApiField, ProductDetails } from '@/components/ProductDetails';
import { getOpenFoodFactsProduct, type OpenFoodFactsProduct } from '@/lib/open-food-facts';
import { goBackOrReplace } from '@/lib/navigation';
import { palette } from '@/lib/tracker';

export default function FoodMoreInfo() {
  const params = useLocalSearchParams<{ code?: string }>();
  const code = typeof params.code === 'string' ? params.code : '';
  const [product, setProduct] = useState<OpenFoodFactsProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkError, setLinkError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const back = useCallback(() => goBackOrReplace('/log-food'), []);
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      setProduct(null);
      try {
        if (!/^\d{8,14}$/.test(code))
          throw new Error('Codul produsului nu este valid. Revino la căutare.');
        const result = await getOpenFoodFactsProduct(code);
        if (active) setProduct(result);
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Nu am putut încărca produsul. Încearcă din nou.',
          );
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- attempt intentionally re-fetches the same code when the user retries.
  }, [code, attempt]);
  const openSource = async () => {
    setLinkError('');
    try {
      await Linking.openURL(`https://world.openfoodfacts.org/product/${code}`);
    } catch {
      setLinkError('Pagina Open Food Facts nu a putut fi deschisă. Încearcă din nou.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  const fields = product ? Object.entries(product).sort(([a], [b]) => a.localeCompare(b)) : [];
  return (
    <SafeAreaView edges={['top', 'bottom']} className="bg-background flex-1">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="w-full flex-1 self-center" style={{ maxWidth: 600 }}>
        <View className="flex-row items-center justify-between px-5 pt-3 pb-4">
          <Button isIconOnly size="sm" variant="ghost" accessibilityLabel="Înapoi" onPress={back}>
            <ChevronLeft size={24} color={palette.ink} />
          </Button>
          <Typography.Heading type="h5" weight="semibold">
            More Info
          </Typography.Heading>
          <View style={{ width: 40 }} />
        </View>
        <FlatList
          data={fields}
          keyExtractor={([field]) => field}
          initialNumToRender={6}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            product && !loading ? (
              <View>
                <ProductDetails product={product} code={code} />
                <Button
                  variant="secondary"
                  className="mt-5 rounded-2xl"
                  onPress={() => void openSource()}
                >
                  <Button.Label numberOfLines={1}>Vezi în Open Food Facts</Button.Label>
                  <ExternalLink size={16} color={palette.accent} />
                </Button>
                {!!linkError && (
                  <Typography className="text-danger mt-3" type="body-sm">
                    {linkError}
                  </Typography>
                )}
                <View className="mt-8 mb-4 gap-2">
                  <Typography.Heading type="h4" weight="semibold">
                    Toate datele API
                  </Typography.Heading>
                  <Typography type="body-sm" color="muted">
                    Câmpurile originale, inclusiv detaliile tehnice și informațiile care nu apar pe
                    etichetă.
                  </Typography>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              <View className="gap-5">
                <Skeleton className="h-60 rounded-3xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-64 rounded-3xl" />
                <Skeleton className="h-28 rounded-3xl" />
              </View>
            ) : (
              <View className="bg-surface items-center gap-4 rounded-3xl px-5 py-12">
                {error ? (
                  <AlertCircle color={palette.accent} size={34} />
                ) : (
                  <PackageSearch color={palette.accent} size={34} />
                )}
                <Typography align="center">
                  {error || 'Produsul nu a fost găsit în Open Food Facts.'}
                </Typography>
                <Button
                  variant="secondary"
                  onPress={error ? () => setAttempt((value) => value + 1) : back}
                >
                  <Button.Label>{error ? 'Încearcă din nou' : 'Înapoi la căutare'}</Button.Label>
                </Button>
              </View>
            )
          }
          renderItem={({ item: [field, value] }) => <ProductApiField field={field} value={value} />}
          ListFooterComponent={
            product ? (
              <Typography type="body-xs" color="muted" align="center" className="mt-6">
                Open Food Facts · ODbL · Imagini CC BY-SA
              </Typography>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}
