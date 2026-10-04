import { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { Accordion, Card, Typography } from 'heroui-native';
import { Leaf, Package, ShieldAlert, Utensils } from 'lucide-react-native';
import { palette } from '@/lib/tracker';
import type { OpenFoodFactsProduct } from '@/lib/open-food-facts';

export function productText(product: OpenFoodFactsProduct, ...keys: string[]): string {
  for (const key of keys) {
    const value = product[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
    if (Array.isArray(value) && value.every((item) => typeof item === 'string') && value.length)
      return value.join(', ');
  }
  return '';
}

function tags(product: OpenFoodFactsProduct, key: string): string {
  return productText(product, key)
    .replace(/\b[a-z]{2}:/g, '')
    .replace(/-/g, ' ');
}
function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : {};
}
function number(value: unknown): number | null {
  if ((typeof value !== 'number' && typeof value !== 'string') || value === '') return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}
function format(value: unknown, unit: string): string {
  const numeric = number(value);
  return numeric === null
    ? '—'
    : `${numeric.toLocaleString('ro-RO', { maximumFractionDigits: 2 })} ${unit}`;
}
function ProductImage({ uri, label }: { uri: string; label: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <View
      className="bg-surface items-center justify-center rounded-3xl p-4"
      style={{ width: 240, height: 250 }}
    >
      {failed ? (
        <Package size={48} color={palette.muted} />
      ) : (
        <Image
          source={{ uri }}
          accessibilityLabel={label}
          onError={() => setFailed(true)}
          resizeMode="contain"
          style={{ width: 208, height: 190 }}
        />
      )}
      <Typography type="body-xs" color="muted" className="mt-3">
        {label}
      </Typography>
    </View>
  );
}
function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View className="border-border gap-1 border-b py-3">
      <Typography type="body-xs" color="muted">
        {label}
      </Typography>
      <Typography type="body-sm" selectable>
        {value}
      </Typography>
    </View>
  );
}
const nutrientRows = [
  ['energy-kcal', 'Energie', 'kcal'],
  ['fat', 'Grăsimi', 'g'],
  ['saturated-fat', 'Grăsimi saturate', 'g'],
  ['carbohydrates', 'Carbohidrați', 'g'],
  ['sugars', 'Zaharuri', 'g'],
  ['fiber', 'Fibre', 'g'],
  ['proteins', 'Proteine', 'g'],
  ['salt', 'Sare', 'g'],
  ['sodium', 'Sodiu', 'g'],
] as const;

export function ProductDetails({ product, code }: { product: OpenFoodFactsProduct; code: string }) {
  const nutriments = object(product.nutriments);
  const kcal = number(nutriments['energy-kcal_100g']);
  const kj = number(nutriments['energy-kj_100g']) ?? number(nutriments.energy_100g);
  const energy = kcal ?? (kj === null ? null : kj / 4.184);
  const unit =
    productText(product, 'product_quantity_unit') === 'ml' ||
    /\bml\b/i.test(productText(product, 'serving_size'))
      ? 'ml'
      : 'g';
  const ingredientText = productText(
    product,
    'ingredients_text_ro',
    'ingredients_text',
    'ingredients_text_en',
  );
  const allergens = productText(product, 'allergens') || tags(product, 'allergens_tags');
  const traces = productText(product, 'traces') || tags(product, 'traces_tags');
  const photos = [
    ['image_front_url', 'Produs'],
    ['image_ingredients_url', 'Ingrediente'],
    ['image_nutrition_url', 'Etichetă nutritivă'],
    ['image_packaging_url', 'Ambalaj'],
  ]
    .map(([key, label]) => ({ uri: productText(product, key), label }))
    .filter((photo) => photo.uri.startsWith('https://'));
  if (!photos.length) {
    const uri = productText(product, 'image_url');
    if (uri.startsWith('https://')) photos.push({ uri, label: 'Produs' });
  }
  const nutri = productText(product, 'nutriscore_grade', 'nutrition_grades');
  const green = productText(product, 'ecoscore_grade');
  const nova = productText(product, 'nova_group');
  const scores = [
    { label: 'Nutri-Score', value: /^[a-e]$/i.test(nutri) ? nutri.toUpperCase() : '—' },
    { label: 'NOVA', value: /^[1-4]$/.test(nova) ? nova : '—' },
    { label: 'Green-Score', value: /^[a-e]$/i.test(green) ? green.toUpperCase() : '—' },
  ];
  const novaLabels: Record<string, string> = {
    '1': 'Alimente neprocesate sau minim procesate',
    '2': 'Ingrediente culinare procesate',
    '3': 'Alimente procesate',
    '4': 'Alimente ultraprocesate',
  };
  return (
    <View className="gap-5">
      {photos.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          {photos.map((photo) => (
            <ProductImage key={photo.uri} {...photo} />
          ))}
        </ScrollView>
      ) : (
        <View className="bg-peach h-44 items-center justify-center gap-3 rounded-3xl">
          <Package size={44} color={palette.accent} />
          <Typography type="body-sm" color="muted">
            Fotografie indisponibilă
          </Typography>
        </View>
      )}
      <View className="gap-2">
        {!!productText(product, 'brands') && (
          <Typography type="body-sm" className="text-accent" weight="semibold">
            {productText(product, 'brands')}
          </Typography>
        )}
        <Typography.Heading type="h2" weight="bold" style={{ fontSize: 28, lineHeight: 35 }}>
          {productText(product, 'product_name_ro', 'product_name', 'product_name_en') ||
            `Produs ${code}`}
        </Typography.Heading>
        {!!productText(product, 'quantity') && (
          <Typography color="muted" type="body-sm">
            {productText(product, 'quantity')}
          </Typography>
        )}
      </View>
      <Card className="gap-5 rounded-3xl p-5">
        <View className="flex-row items-center justify-between gap-3">
          <View className="bg-peach h-10 w-10 items-center justify-center rounded-xl">
            <Utensils size={20} color={palette.accent} />
          </View>
          <Typography type="body-sm" color="muted">
            Per 100 {unit}
          </Typography>
        </View>
        <View className="flex-row items-baseline gap-2">
          <Typography weight="bold" style={{ fontSize: 44, lineHeight: 52 }}>
            {energy === null ? '—' : Math.round(energy).toLocaleString('ro-RO')}
          </Typography>
          <Typography type="body" color="muted">
            kcal
          </Typography>
        </View>
        <View className="flex-row gap-2">
          {(
            [
              ['proteins', 'Proteine', 'text-protein'],
              ['carbohydrates', 'Carbohidrați', 'text-carbs'],
              ['fat', 'Grăsimi', 'text-fat'],
            ] as const
          ).map(([key, label, color]) => (
            <View className="bg-background flex-1 gap-2 rounded-2xl px-2 py-3" key={key}>
              <Typography type="body-sm" weight="semibold" className={color}>
                {format(nutriments[`${key}_100g`], 'g')}
              </Typography>
              <Typography type="body-xs" color="muted" numberOfLines={1}>
                {label}
              </Typography>
            </View>
          ))}
        </View>
      </Card>
      <View className="flex-row gap-2">
        {scores.map((score) => (
          <Card className="flex-1 items-center gap-2 rounded-2xl px-1 py-4" key={score.label}>
            <Typography type="h2" weight="bold" className="text-accent">
              {score.value}
            </Typography>
            <Typography type="body-xs" numberOfLines={1} color="muted">
              {score.label}
            </Typography>
          </Card>
        ))}
      </View>
      {!!novaLabels[nova] && (
        <Typography type="body-sm" color="muted">
          {novaLabels[nova]}
        </Typography>
      )}
      <Card className="gap-3 rounded-3xl p-5">
        <Typography.Heading type="h4" weight="semibold">
          Valori nutritive
        </Typography.Heading>
        {!!productText(product, 'serving_size') && (
          <Typography type="body-sm" color="muted">
            Porție: {productText(product, 'serving_size')}
          </Typography>
        )}
        <View className="flex-row gap-2 pb-1">
          <View className="flex-1" />
          <Typography type="body-xs" color="muted" style={{ width: 72, textAlign: 'right' }}>
            100 {unit}
          </Typography>
          <Typography type="body-xs" color="muted" style={{ width: 72, textAlign: 'right' }}>
            Porție
          </Typography>
        </View>
        {nutrientRows.map(([key, label, nutrientUnit]) => (
          <View className="border-border flex-row items-center gap-2 border-t py-3" key={key}>
            <Typography type="body-sm" className="flex-1">
              {label}
            </Typography>
            <Typography type="body-sm" style={{ width: 72, textAlign: 'right' }}>
              {format(key === 'energy-kcal' ? energy : nutriments[`${key}_100g`], nutrientUnit)}
            </Typography>
            <Typography type="body-sm" style={{ width: 72, textAlign: 'right' }}>
              {format(nutriments[`${key}_serving`], nutrientUnit)}
            </Typography>
          </View>
        ))}
        <Typography type="body-xs" color="muted">
          „—” înseamnă că informația nu este disponibilă. Verifică valorile cu eticheta produsului.
        </Typography>
      </Card>
      <Card className="gap-4 rounded-3xl p-5">
        <View className="flex-row items-center gap-3">
          <Leaf size={20} color={palette.fat} />
          <Typography.Heading type="h4" weight="semibold">
            Ingrediente
          </Typography.Heading>
        </View>
        <Typography type="body-sm" selectable>
          {ingredientText || 'Ingredientele nu sunt disponibile.'}
        </Typography>
        <View className="bg-peach gap-2 rounded-2xl p-4">
          <View className="flex-row items-center gap-2">
            <ShieldAlert size={18} color={palette.accent} />
            <Typography type="body-sm" weight="semibold">
              Alergeni
            </Typography>
          </View>
          <Typography type="body-sm" selectable>
            {allergens || 'Alergenii nu sunt declarați în baza de date. Verifică eticheta.'}
          </Typography>
          {!!traces && (
            <Typography type="body-sm" selectable>
              Poate conține urme de: {traces}
            </Typography>
          )}
        </View>
        {!!tags(product, 'additives_tags') && (
          <InfoRow label="Aditivi" value={tags(product, 'additives_tags')} />
        )}
        {!!tags(product, 'ingredients_analysis_tags') && (
          <InfoRow
            label="Analiza ingredientelor"
            value={tags(product, 'ingredients_analysis_tags')}
          />
        )}
      </Card>
      <Card className="rounded-3xl p-5">
        <Typography.Heading type="h4" weight="semibold">
          Despre produs
        </Typography.Heading>
        <InfoRow label="Cod de bare" value={code} />
        <InfoRow label="Categorii" value={productText(product, 'categories')} />
        <InfoRow label="Etichete și certificări" value={productText(product, 'labels')} />
        <InfoRow label="Originea ingredientelor" value={productText(product, 'origins')} />
        <InfoRow label="Locuri de producție" value={productText(product, 'manufacturing_places')} />
        <InfoRow label="Țări de comercializare" value={productText(product, 'countries')} />
        <InfoRow label="Magazine" value={productText(product, 'stores')} />
        <InfoRow
          label="Ambalaj"
          value={productText(product, 'packaging_text_ro', 'packaging_text', 'packaging')}
        />
        <InfoRow label="Mărci de identificare" value={productText(product, 'emb_codes')} />
        <InfoRow
          label="Ultima actualizare"
          value={
            number(product.last_modified_t) === null
              ? ''
              : new Date(Number(product.last_modified_t) * 1000).toLocaleDateString('ro-RO')
          }
        />
      </Card>
    </View>
  );
}

export function ProductApiField({ field, value }: { field: string; value: unknown }) {
  return (
    <Accordion selectionMode="single" variant="surface" className="mb-2 rounded-2xl">
      <Accordion.Item value={field}>
        <Accordion.Trigger>
          <Typography type="body-sm" className="flex-1 pr-3" selectable>
            {field}
          </Typography>
          <Accordion.Indicator />
        </Accordion.Trigger>
        <Accordion.Content>
          <Typography
            type="body-xs"
            selectable
            className="px-4 pb-4"
            style={{ fontFamily: 'monospace' }}
          >
            {typeof value === 'string' ? value || '""' : JSON.stringify(value, null, 2)}
          </Typography>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}
