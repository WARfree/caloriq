import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { create } from 'zustand';
import { z } from 'zod';
import { useAccount } from '@/lib/account';

export const activityTypes = [
  { id: 'walk', name: 'Mers pe jos', met: 3.5 },
  { id: 'run', name: 'Alergare', met: 8 },
  { id: 'cycle', name: 'Ciclism', met: 6.8 },
  { id: 'strength', name: 'Antrenament de forță', met: 3.5 },
  { id: 'swim', name: 'Înot', met: 6 },
  { id: 'yoga', name: 'Yoga', met: 2.5 },
  { id: 'dance', name: 'Dans', met: 5 },
] as const;
export type ActivityType = (typeof activityTypes)[number]['id'];
const entrySchema = z.object({
  id: z.string(),
  type: z.enum(['walk', 'run', 'cycle', 'strength', 'swim', 'yoga', 'dance']),
  date: z.string(),
  minutes: z.number().positive().max(1440),
  calories: z.number().nonnegative(),
});
export type ActivityEntry = z.infer<typeof entrySchema>;
export function estimateActivityCalories(type: ActivityType, minutes: number, weight: number) {
  const activity = activityTypes.find((item) => item.id === type)!;
  return Math.round((activity.met * 3.5 * weight * minutes) / 200);
}
type ActivityStore = {
  entries: ActivityEntry[];
  ready: boolean;
  busy: boolean;
  error: string | null;
  load: () => Promise<void>;
  save: (entry: ActivityEntry) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
};
const initialState = { entries: [] as ActivityEntry[], ready: false, busy: false, error: null };
export const useActivities = create<ActivityStore>((set, get) => {
  const persist = async (entries: ActivityEntry[]) => {
    const userId = useAccount.getState().session?.user.id;
    if (!userId || !get().ready || get().busy) return false;
    set({ busy: true, error: null });
    try {
      await AsyncStorage.setItem(`nourish-activities-v1:${userId}`, JSON.stringify(entries));
      if (useAccount.getState().session?.user.id !== userId) return false;
      set({ entries, busy: false });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch {
      if (useAccount.getState().session?.user.id !== userId) return false;
      set({ busy: false, error: 'Activitatea nu a putut fi salvată. Încearcă din nou.' });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  };
  return {
    ...initialState,
    load: async () => {
      const userId = useAccount.getState().session?.user.id;
      if (!userId) return;
      set({ ...initialState });
      try {
        const raw = await AsyncStorage.getItem(`nourish-activities-v1:${userId}`);
        const entries = raw ? z.array(entrySchema).parse(JSON.parse(raw)) : [];
        if (useAccount.getState().session?.user.id !== userId) return;
        set({ entries, ready: true });
      } catch {
        if (useAccount.getState().session?.user.id !== userId) return;
        set({ error: 'Jurnalul de activități nu a putut fi deschis.' });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    save: (entry) => persist([entry, ...get().entries.filter((item) => item.id !== entry.id)]),
    remove: (id) => persist(get().entries.filter((item) => item.id !== id)),
  };
});
export function resetActivities() {
  useActivities.setState({ ...initialState });
}
