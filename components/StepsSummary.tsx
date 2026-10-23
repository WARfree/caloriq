import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Skeleton, Typography } from 'heroui-native';
import { Footprints } from 'lucide-react-native';
import { useSteps } from '@/lib/steps';
import { palette } from '@/lib/tracker';
import { useAccount } from '@/lib/account';
import { stepCalories } from '@/lib/step-energy';
import { StepsCalorieInfo } from '@/components/StepsCalorieInfo';

export function StepsSummary({ date }: { date: string }) {
  const { entries, ready, error, load } = useSteps();
  const entry = entries.find((item) => item.date === date);
  const profile = useAccount((state) => state.profile);
  const calories = entry ? stepCalories(entry, profile) : null;
  return (
    <Card className="bg-surface mb-5 gap-4 rounded-[28px] p-5">
      <View className="flex-row items-center gap-2">
        <View className="bg-peach h-9 w-9 items-center justify-center rounded-xl">
          <Footprints size={20} color={palette.accent} />
        </View>
        <Typography type="body" weight="semibold" className="flex-1">
          Pașii zilei
        </Typography>
        <StepsCalorieInfo />
      </View>
      {!ready ? (
        error ? (
          <>
            <Typography type="body-sm" weight="normal" className="text-danger">
              {error}
            </Typography>
            <Button variant="secondary" onPress={() => void load()}>
              <Button.Label>Încearcă din nou</Button.Label>
            </Button>
          </>
        ) : (
          <Skeleton className="h-20 rounded-2xl" />
        )
      ) : (
        <>
          {entry ? (
            <Typography type="h2" weight="bold">
              {entry.count.toLocaleString('ro-RO')}{' '}
              <Typography type="body-sm" weight="normal" color="muted">
                {entry.count === 1 ? 'pas' : 'pași'}
              </Typography>
            </Typography>
          ) : (
            <Typography type="body-sm" weight="normal" color="muted">
              Niciun pas înregistrat în această zi.
            </Typography>
          )}
          {entry && (
            <View className="gap-1">
              {calories !== null && (
                <Typography type="body-sm" weight="normal" color="muted">
                  {calories.toLocaleString('ro-RO')} kcal{' '}
                  {entry.calorieSource === 'manual' ? 'introduse' : 'estimate'}
                </Typography>
              )}
              {entry.duration !== undefined && (
                <Typography type="body-sm" weight="normal" color="muted">
                  {entry.duration.toLocaleString('ro-RO')}{' '}
                  {entry.duration === 1 ? 'minut de activitate' : 'minute de activitate'}
                </Typography>
              )}
            </View>
          )}
          <Button
            variant="secondary"
            onPress={() => router.push({ pathname: '/log-steps', params: { date } })}
          >
            <Button.Label>{entry ? 'Editează pașii' : 'Adaugă pași'}</Button.Label>
          </Button>
        </>
      )}
    </Card>
  );
}
