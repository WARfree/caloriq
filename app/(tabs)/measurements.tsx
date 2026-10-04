import { View } from 'react-native';
import { router } from 'expo-router';
import { Card, PressableFeedback, Typography } from 'heroui-native';
import { ChevronRight, Ruler, Scale } from 'lucide-react-native';
import { Screen, Heading } from '@/components/TrackerUI';
import MeasurementLoadState from '@/components/MeasurementLoadState';
import {
  formatMeasurement,
  measurementDate,
  measurements,
  measurementTypes,
  useLoadMeasurements,
  useMeasurements,
} from '@/lib/measurements';
import { palette } from '@/lib/tracker';

export default function MeasurementsScreen() {
  useLoadMeasurements();
  const { entries, ready } = useMeasurements();
  const recorded = measurementTypes.filter((type) =>
    entries.some((entry) => entry.type === type),
  ).length;
  return (
    <Screen>
      <Heading title="Măsurători" />
      {!ready ? (
        <MeasurementLoadState />
      ) : (
        <View className="gap-3">
          <Card className="bg-peach mb-3 gap-3 rounded-[28px] p-5">
            <View className="flex-row items-center gap-3">
              <Ruler size={26} color={palette.accent} />
              <Typography type="h4" weight="semibold">
                Corpul tău, în timp
              </Typography>
            </View>
            <Typography type="body" weight="normal" color="muted">
              {recorded === 0
                ? 'Alege o măsurătoare pentru prima înregistrare.'
                : `${recorded} ${recorded === 1 ? 'măsurătoare urmărită' : 'măsurători urmărite'}`}
            </Typography>
          </Card>
          {measurementTypes.map((type) => {
            const info = measurements[type];
            const history = entries
              .filter((entry) => entry.type === type)
              .sort((a, b) => b.date.localeCompare(a.date));
            const latest = history[0];
            const Icon = type === 'weight' ? Scale : Ruler;
            return (
              <PressableFeedback
                key={type}
                onPress={() => router.push({ pathname: '/measurement/[type]', params: { type } })}
                accessibilityLabel={`${info.label}, ${latest ? `${formatMeasurement(latest.value)} ${info.unit}` : 'adaugă prima valoare'}`}
              >
                <Card className="bg-surface flex-row items-center gap-3 rounded-3xl p-4">
                  <View className="bg-peach h-11 w-11 items-center justify-center rounded-2xl">
                    <Icon size={21} color={palette.accent} />
                  </View>
                  <View className="flex-1 gap-1">
                    <Typography type="body" weight="semibold">
                      {info.label}
                    </Typography>
                    <Typography type="body-xs" weight="normal" color="muted">
                      {latest ? measurementDate(latest.date) : 'Adaugă prima valoare'}
                    </Typography>
                  </View>
                  {latest && (
                    <Typography type="body-sm" weight="semibold" numberOfLines={1}>
                      {formatMeasurement(latest.value)} {info.unit}
                    </Typography>
                  )}
                  <ChevronRight size={17} color={palette.muted} />
                </Card>
              </PressableFeedback>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
