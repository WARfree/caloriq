import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { create } from 'zustand';

export const palette = {
  accent: '#E94C5C',
  ink: '#23252C',
  muted: '#777984',
  white: '#FFFFFF',
  background: '#F5F5F8',
  border: '#E7E7ED',
  peach: '#FDEEF0',
  protein: '#9270CE',
  carbs: '#DDA03D',
  fat: '#42A58F',
  track: '#FBE3E7',
};
export const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const;
export type Meal = (typeof meals)[number];
export type Nutrition = { calories: number; protein: number; carbs: number; fat: number };
export type Food = Nutrition & { id: string; name: string; serving: string; category: string };
export type Entry = Nutrition & {
  id: string;
  name: string;
  serving: string;
  meal: Meal;
  date: string;
};
type Data = { goal: number; entries: Entry[] };
type Tracker = Data & {
  ready: boolean;
  busy: boolean;
  error: string | null;
  load: () => Promise<void>;
  save: (data: Data) => Promise<boolean>;
  clearError: () => void;
};
const key = 'nourish-tracker-v1';
export const useTracker = create<Tracker>((set) => ({
  goal: 2000,
  entries: [],
  ready: false,
  busy: false,
  error: null,
  clearError: () => set({ error: null }),
  load: async () => {
    set({ error: null });
    try {
      const raw = await AsyncStorage.getItem(key);
      const data: Data = raw ? JSON.parse(raw) : { goal: 2000, entries: [] };
      set({ ...data, ready: true });
    } catch {
      set({ error: 'Your food diary couldn’t be opened. Please try again.' });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
  save: async (data) => {
    set({ busy: true, error: null });
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
      set({ ...data, busy: false });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch {
      set({ busy: false, error: 'Your changes couldn’t be saved. Please try again.' });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  },
}));
export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function fromKey(keyValue: string) {
  const [y, m, d] = keyValue.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function offsetDate(date: Date, offset: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
}
export function totals(entries: Entry[]): Nutrition {
  return entries.reduce(
    (sum, e) => ({
      calories: sum.calories + e.calories,
      protein: sum.protein + e.protein,
      carbs: sum.carbs + e.carbs,
      fat: sum.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
export const foods: Food[] = [
  {
    id: 'oats',
    name: 'Oatmeal',
    serving: '1 cup, cooked',
    category: 'Grains',
    calories: 154,
    protein: 6,
    carbs: 27,
    fat: 3,
  },
  {
    id: 'eggs',
    name: 'Scrambled eggs',
    serving: '2 large eggs',
    category: 'Protein',
    calories: 182,
    protein: 12,
    carbs: 2,
    fat: 14,
  },
  {
    id: 'toast',
    name: 'Avocado toast',
    serving: '1 slice',
    category: 'Breakfast',
    calories: 230,
    protein: 6,
    carbs: 24,
    fat: 13,
  },
  {
    id: 'yogurt',
    name: 'Greek yogurt',
    serving: '170 g, plain',
    category: 'Dairy',
    calories: 100,
    protein: 17,
    carbs: 6,
    fat: 1,
  },
  {
    id: 'banana',
    name: 'Banana',
    serving: '1 medium',
    category: 'Fruit',
    calories: 105,
    protein: 1,
    carbs: 27,
    fat: 0,
  },
  {
    id: 'chicken',
    name: 'Grilled chicken breast',
    serving: '100 g',
    category: 'Protein',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 4,
  },
  {
    id: 'rice',
    name: 'Brown rice',
    serving: '1 cup, cooked',
    category: 'Grains',
    calories: 216,
    protein: 5,
    carbs: 45,
    fat: 2,
  },
  {
    id: 'salmon',
    name: 'Baked salmon',
    serving: '100 g',
    category: 'Protein',
    calories: 206,
    protein: 22,
    carbs: 0,
    fat: 12,
  },
  {
    id: 'apple',
    name: 'Apple',
    serving: '1 medium',
    category: 'Fruit',
    calories: 95,
    protein: 0,
    carbs: 25,
    fat: 0,
  },
  {
    id: 'almonds',
    name: 'Almonds',
    serving: '28 g',
    category: 'Nuts',
    calories: 164,
    protein: 6,
    carbs: 6,
    fat: 14,
  },
  {
    id: 'salad',
    name: 'Mixed green salad',
    serving: '2 cups, no dressing',
    category: 'Vegetables',
    calories: 35,
    protein: 2,
    carbs: 7,
    fat: 0,
  },
  {
    id: 'coffee',
    name: 'Coffee with milk',
    serving: '1 cup',
    category: 'Drinks',
    calories: 30,
    protein: 2,
    carbs: 3,
    fat: 1,
  },
];
