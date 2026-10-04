import { View } from 'react-native';
import { Button, Skeleton, Typography } from 'heroui-native';
import { AlertCircle } from 'lucide-react-native';
import { useMeasurements } from '@/lib/measurements';
import { palette } from '@/lib/tracker';

export default function MeasurementLoadState() {
  const { error, loading, load } = useMeasurements();
  return error ? (
    <View className="items-center gap-4 py-10">
      <AlertCircle size={28} color={palette.accent} />
      <Typography type="body" weight="normal" align="center">
        {error}
      </Typography>
      <Button isDisabled={loading} onPress={() => void load()}>
        <Button.Label>{loading ? 'Se încarcă…' : 'Încearcă din nou'}</Button.Label>
      </Button>
    </View>
  ) : (
    <View className="gap-4">
      <Skeleton className="h-48 rounded-3xl" />
      <Skeleton className="h-28 rounded-3xl" />
      <Skeleton className="h-28 rounded-3xl" />
    </View>
  );
}
