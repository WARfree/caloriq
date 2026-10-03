import { z } from 'zod';

export const profileSchema = z.object({
  goal: z.enum(['lose', 'maintain', 'gain']),
  sex: z.enum(['female', 'male']),
  age: z.number().int().min(18).max(100),
  height: z.number().min(120).max(230),
  weight: z.number().min(35).max(300),
  activity: z.enum(['sedentary', 'light', 'moderate', 'active', 'veryActive']),
});
export type CalorieProfile = z.infer<typeof profileSchema>;
export type ProfileDraft = Partial<CalorieProfile>;
export const goalLabels = { lose: 'Slăbire', maintain: 'Menținere', gain: 'Masă musculară' };
export const activityOptions = [
  {
    value: 'sedentary',
    label: 'Sedentar',
    detail: 'Puțină mișcare, fără antrenamente',
    factor: 1.2,
  },
  { value: 'light', label: 'Ușor activ', detail: '1–3 antrenamente pe săptămână', factor: 1.375 },
  {
    value: 'moderate',
    label: 'Moderat activ',
    detail: '3–5 antrenamente pe săptămână',
    factor: 1.55,
  },
  { value: 'active', label: 'Activ', detail: '6–7 antrenamente pe săptămână', factor: 1.725 },
  {
    value: 'veryActive',
    label: 'Foarte activ',
    detail: 'Muncă fizică și antrenamente intense',
    factor: 1.9,
  },
] as const;
export function calculateCalories(profile: CalorieProfile) {
  const bmr =
    10 * profile.weight +
    6.25 * profile.height -
    5 * profile.age +
    (profile.sex === 'male' ? 5 : -161);
  const factor = activityOptions.find((option) => option.value === profile.activity)!.factor;
  const maintenance = Math.round(bmr * factor);
  const adjustment = profile.goal === 'lose' ? 0.85 : profile.goal === 'gain' ? 1.1 : 1;
  const minimum = profile.sex === 'male' ? 1500 : 1200;
  return {
    maintenance,
    calories: Math.max(minimum, Math.round((maintenance * adjustment) / 10) * 10),
  };
}
