import type { CalorieProfile } from '@/lib/calorie-profile';
import type { StepEntry } from '@/lib/steps';

// Approximate net energy for level walking, excluding resting expenditure.
export function estimateStepEnergy(count: number, profile: CalorieProfile) {
  const stepLengthMeters = (profile.height / 100) * 0.414;
  const distanceKm = (count * stepLengthMeters) / 1000;
  return {
    distanceKm,
    calories: Math.round(0.5 * profile.weight * distanceKm),
  };
}

export function stepCalories(entry: StepEntry, profile: CalorieProfile | null) {
  return entry.calories ?? (profile ? estimateStepEnergy(entry.count, profile).calories : null);
}
