import type { ReactNode } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Skeleton, Typography } from 'heroui-native';
import { AlertCircle, Utensils } from 'lucide-react-native';
import { Svg, Circle } from '@/components/ui/primitives/Svg';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { palette, useTracker } from '@/lib/tracker';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={['top']} className="bg-background flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 32,
            maxWidth: 600,
            width: '100%',
            alignSelf: 'center',
          }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Heading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View className="mb-6 flex-row items-center justify-between">
      <Typography.Heading
        type="h2"
        weight="bold"
        style={{ fontSize: 32, lineHeight: 40 }}
        className="tracking-tight"
      >
        {title}
      </Typography.Heading>
      {action}
    </View>
  );
}
export function Empty({
  text,
  action,
  onPress,
}: {
  text: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View className="items-center gap-3 py-7">
      <View className="bg-peach h-12 w-12 items-center justify-center rounded-2xl">
        <Utensils size={22} color={palette.accent} />
      </View>
      <Typography type="body" weight="normal" color="muted" align="center">
        {text}
      </Typography>
      <Button variant="secondary" size="sm" onPress={onPress}>
        <Button.Label>{action}</Button.Label>
      </Button>
    </View>
  );
}
export function LoadState() {
  const ready = useTracker((s) => s.ready);
  const error = useTracker((s) => s.error);
  const load = useTracker((s) => s.load);
  if (error && !ready)
    return (
      <View className="items-center gap-4 py-16">
        <AlertCircle color={palette.accent} />
        <Typography type="body" weight="normal" align="center" style={{ color: palette.accent }}>
          {error}
        </Typography>
        <Button onPress={() => void load()}>
          <Button.Label>Try again</Button.Label>
        </Button>
      </View>
    );
  return (
    <View className="gap-4">
      <Skeleton className="h-72 rounded-3xl" />
      <Skeleton className="h-28 rounded-3xl" />
      <Skeleton className="h-48 rounded-3xl" />
    </View>
  );
}
export function Ring({ value, goal }: { value: number; goal: number }) {
  const size = 210;
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center"
      accessibilityLabel={`${value} of ${goal} calories consumed`}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={105} cy={105} r={radius} stroke={palette.track} strokeWidth={14} fill="none" />
        <Circle
          cx={105}
          cy={105}
          r={radius}
          stroke={palette.accent}
          strokeWidth={14}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - Math.min(value / goal, 1))}
          strokeLinecap="round"
          rotation={-90}
          origin="105, 105"
        />
      </Svg>
      <Typography
        type="h1"
        weight="bold"
        style={{ fontSize: 43, lineHeight: 52 }}
        className="tracking-tight"
      >
        {Math.abs(goal - value).toLocaleString()}
      </Typography>
      <Typography type="body-sm" weight="normal" color="muted">
        {value > goal ? 'kcal over goal' : 'kcal remaining'}
      </Typography>
    </View>
  );
}
