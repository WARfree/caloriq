import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { create } from 'zustand';
import { z } from 'zod';
import { useAccount } from '@/lib/account';

export const stepCountSchema = z.number().int().min(0).max(200000);
export const stepCaloriesSchema = z.number().min(0).max(50000);
export const stepDurationSchema = z.number().positive().max(1440);
const entrySchema = z.object({
  date: z.string(),
  count: stepCountSchema,
  calories: stepCaloriesSchema.optional(),
  duration: stepDurationSchema.optional(),
  calorieSource: z.enum(['manual', 'estimated']).optional(),
});
export type StepEntry = z.infer<typeof entrySchema>;
type StepsStore = {
  entries: StepEntry[];
  ready: boolean;
  busy: boolean;
  error: string | null;
  load: () => Promise<void>;
  save: (entry: StepEntry) => Promise<boolean>;
};
const initialState = { entries: [] as StepEntry[], ready: false, busy: false, error: null };
export const useSteps = create<StepsStore>((set, get) => ({
  ...initialState,
  load: async () => {
    const userId = useAccount.getState().session?.user.id;
    if (!userId) return;
    set({ ...initialState });
    try {
      const raw = await AsyncStorage.getItem(`nourish-steps-v1:${userId}`);
      const entries = raw ? z.array(entrySchema).parse(JSON.parse(raw)) : [];
      if (useAccount.getState().session?.user.id !== userId) return;
      set({ entries, ready: true });
    } catch {
      if (useAccount.getState().session?.user.id !== userId) return;
      set({ error: 'Pașii nu au putut fi încărcați.' });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
  save: async (entry) => {
    const userId = useAccount.getState().session?.user.id;
    if (!userId || !get().ready || get().busy) return false;
    if (!entrySchema.safeParse(entry).success) {
      set({ error: 'Verifică pașii, caloriile și durata introduse.' });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
    set({ busy: true, error: null });
    const entries = [entry, ...get().entries.filter((item) => item.date !== entry.date)];
    try {
      await AsyncStorage.setItem(`nourish-steps-v1:${userId}`, JSON.stringify(entries));
      if (useAccount.getState().session?.user.id !== userId) return false;
      set({ entries, busy: false });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch {
      if (useAccount.getState().session?.user.id !== userId) return false;
      set({ busy: false, error: 'Pașii nu au putut fi salvați. Încearcă din nou.' });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  },
}));
export function resetSteps() {
  useSteps.setState({ ...initialState });
}
