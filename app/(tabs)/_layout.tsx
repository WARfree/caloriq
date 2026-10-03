import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChartNoAxesColumn, Heart, SlidersHorizontal, Dumbbell } from 'lucide-react-native';
import { useActivities } from '@/lib/activities';
import * as Haptics from 'expo-haptics';
import { palette, useTracker } from '@/lib/tracker';

export default function TabLayout() {
  const load = useTracker((s) => s.load);
  const loadActivities = useActivities((s) => s.load);
  useEffect(() => {
    void load();
    void loadActivities();
  }, [load, loadActivities]);
  return (
    <>
      {/* eslint-disable-next-line react/style-prop-object -- Expo StatusBar accepts a string style, not a React Native style object. */}
      <StatusBar style="dark" />
      <Tabs
        screenListeners={({ navigation, route }) => ({
          tabPress: () => {
            if (navigation.getState().routes[navigation.getState().index].key !== route.key)
              void Haptics.selectionAsync();
          },
        })}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: palette.background },
          tabBarActiveTintColor: palette.accent,
          tabBarInactiveTintColor: palette.muted,
          tabBarStyle: {
            backgroundColor: palette.white,
            borderTopColor: palette.border,
            height: 78,
            paddingTop: 10,
            paddingBottom: 16,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 4 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Today', tabBarIcon: ({ color }) => <Heart size={23} color={color} /> }}
        />
        <Tabs.Screen
          name="activities"
          options={{
            title: 'Activități',
            tabBarIcon: ({ color }) => <Dumbbell size={23} color={color} />,
          }}
        />
        <Tabs.Screen
          name="trends"
          options={{
            title: 'Trends',
            tabBarIcon: ({ color }) => <ChartNoAxesColumn size={23} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <SlidersHorizontal size={23} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}
