import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { create } from 'zustand';
import { z } from 'zod';
import { useAccount } from '@/lib/account';
import { dateKey, fromKey } from '@/lib/tracker';

export const measurementTypes = [
  'weight',
  'waist',
  'hips',
  'chest',
  'arm',
  'thigh',
  'calf',
  'bodyFat',
] as const;
export type MeasurementType = (typeof measurementTypes)[number];
export const measurements: Record<
  MeasurementType,
  { label: string; unit: string; min: number; max: number }
> = {
  weight: { label: 'Greutate', unit: 'kg', min: 20, max: 500 },
  waist: { label: 'Talie', unit: 'cm', min: 5, max: 300 },
  hips: { label: 'Șolduri', unit: 'cm', min: 5, max: 300 },
  chest: { label: 'Piept', unit: 'cm', min: 5, max: 300 },
  arm: { label: 'Braț', unit: 'cm', min: 5, max: 300 },
  thigh: { label: 'Coapsă', unit: 'cm', min: 5, max: 300 },
  calf: { label: 'Gambă', unit: 'cm', min: 5, max: 300 },
  bodyFat: { label: 'Grăsime corporală', unit: '%', min: 1, max: 75 },
};
export function isMeasurementType(value: string | undefined): value is MeasurementType {
  return measurementTypes.some((type) => type === value);
}
export const measurementDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => dateKey(fromKey(value)) === value && value <= dateKey());
const entrySchema = z
  .object({
    type: z.enum(measurementTypes),
    date: measurementDateSchema,
    value: z.number().finite(),
  })
  .refine(
    (entry) =>
      entry.value >= measurements[entry.type].min && entry.value <= measurements[entry.type].max,
  );
export type MeasurementEntry = z.infer<typeof entrySchema>;
export function formatMeasurement(value: number) {
  return value.toLocaleString('ro-RO', { maximumFractionDigits: 2 });
}
export function measurementDate(date: string) {
  return fromKey(date).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

type MeasurementStore = {
  entries: MeasurementEntry[];
  ready: boolean;
  loading: boolean;
  busy: boolean;
  error: string | null;
  load: () => Promise<void>;
  save: (entry: MeasurementEntry) => Promise<boolean>;
  remove: (entry: MeasurementEntry) => Promise<boolean>;
};
const initialState = {
  entries: [] as MeasurementEntry[],
  ready: false,
  loading: false,
  busy: false,
  error: null,
};
export const useMeasurements = create<MeasurementStore>((set, get) => {
  const persist = async (entries: MeasurementEntry[]) => {
    const userId = useAccount.getState().session?.user.id;
    if (!userId || !get().ready || get().busy) return false;
    set({ busy: true, error: null });
    try {
      await AsyncStorage.setItem(`nourish-measurements-v1:${userId}`, JSON.stringify(entries));
      if (useAccount.getState().session?.user.id !== userId) return false;
      set({ entries, busy: false });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch {
      if (useAccount.getState().session?.user.id !== userId) return false;
      set({ busy: false, error: 'Modificarea nu a putut fi salvată. Încearcă din nou.' });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  };
  return {
    ...initialState,
    load: async () => {
      const userId = useAccount.getState().session?.user.id;
      if (!userId || get().loading || get().busy) return;
      set({ loading: true, error: null });
      try {
        const raw = await AsyncStorage.getItem(`nourish-measurements-v1:${userId}`);
        const entries = raw ? z.array(entrySchema).parse(JSON.parse(raw)) : [];
        if (useAccount.getState().session?.user.id !== userId) return;
        set({ entries, ready: true, loading: false });
      } catch {
        if (useAccount.getState().session?.user.id !== userId) return;
        set({ loading: false, error: 'Măsurătorile nu au putut fi încărcate.' });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    save: async (entry) => {
      if (!entrySchema.safeParse(entry).success) {
        set({ error: 'Verifică data și valoarea măsurătorii.' });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return false;
      }
      return persist([
        entry,
        ...get().entries.filter((item) => item.type !== entry.type || item.date !== entry.date),
      ]);
    },
    remove: (entry) =>
      persist(get().entries.filter((item) => item.type !== entry.type || item.date !== entry.date)),
  };
});
export function resetMeasurements() {
  useMeasurements.setState({ ...initialState });
}
export function useLoadMeasurements() {
  const load = useMeasurements((state) => state.load);
  useEffect(() => {
    if (!useMeasurements.getState().ready) void load();
  }, [load]);
}
