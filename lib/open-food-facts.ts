import { FunctionsHttpError } from '@biltme/backend';
import { z } from 'zod';
import { bilt } from '@/lib/bilt';
import type { Food, Nutrition } from '@/lib/tracker';

export type CatalogFood = Food & {
  source?: 'open-food-facts';
  missingNutrition?: (keyof Nutrition)[];
};
const productSchema = z.object({
  code: z.string(),
  product_name: z.string().optional(),
  product_name_ro: z.string().optional(),
  product_name_en: z.string().optional(),
  brands: z.union([z.string(), z.array(z.string())]).optional(),
  nutriments: z.record(z.string(), z.unknown()).optional(),
  product_quantity_unit: z.string().optional(),
  serving_size: z.string().optional(),
});
const responseSchema = z.object({
  products: z.array(z.unknown()),
  page: z.number(),
  hasMore: z.boolean(),
});
function nutrient(value: unknown): number | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  if (value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 10000 ? number : undefined;
}
export function toCatalogFood(raw: unknown): CatalogFood | null {
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return null;
  const product = parsed.data;
  const name =
    product.product_name_ro?.trim() ||
    product.product_name?.trim() ||
    product.product_name_en?.trim();
  if (!name) return null;
  const n = product.nutriments ?? {};
  const kj = nutrient(n['energy-kj_100g']) ?? nutrient(n.energy_100g);
  const nutrition = {
    calories: nutrient(n['energy-kcal_100g']) ?? (kj === undefined ? undefined : kj / 4.184),
    protein: nutrient(n.proteins_100g),
    carbs: nutrient(n.carbohydrates_100g),
    fat: nutrient(n.fat_100g),
  };
  const unit =
    product.product_quantity_unit === 'ml' || /\bml\b/i.test(product.serving_size ?? '')
      ? 'ml'
      : 'g';
  const nutritionKeys: (keyof Nutrition)[] = ['calories', 'protein', 'carbs', 'fat'];
  const missingNutrition = nutritionKeys.filter((key) => nutrition[key] === undefined);
  const brand = Array.isArray(product.brands) ? product.brands.join(', ') : product.brands;
  return {
    id: `off-${product.code}`,
    name,
    serving: `100 ${unit}`,
    category: brand ?? 'Open Food Facts',
    calories: nutrition.calories ?? 0,
    protein: nutrition.protein ?? 0,
    carbs: nutrition.carbs ?? 0,
    fat: nutrition.fat ?? 0,
    source: 'open-food-facts',
    missingNutrition,
  };
}
export async function getOpenFoodFacts(action: 'search' | 'barcode', query: string, page = 1) {
  const { data, error } = await bilt.functions.invoke('open-food-facts', {
    body: { action, query, page },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body: unknown = await error.context.json();
      const message = z.object({ error: z.string() }).safeParse(body);
      if (message.success) throw new Error(message.data.error);
    }
    throw new Error(error.message);
  }
  const response = responseSchema.safeParse(data);
  if (!response.success)
    throw new Error('Răspunsul Open Food Facts nu poate fi citit. Încearcă din nou.');
  const products = response.data.products
    .map(toCatalogFood)
    .filter((food): food is CatalogFood => food !== null);
  return { products, page: response.data.page, hasMore: response.data.hasMore };
}
