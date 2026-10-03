import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Typography } from 'heroui-native';
import { Heart } from 'lucide-react-native';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { palette } from '@/lib/tracker';

export function AccountScreen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <SafeAreaView className="bg-background flex-1" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            padding: 24,
            width: '100%',
            maxWidth: 520,
            alignSelf: 'center',
          }}
        >
          <View className="mt-3 mb-10 flex-row items-center gap-2">
            <Heart size={23} color={palette.accent} fill={palette.accent} />
            <Typography type="body" weight="bold" className="text-lg">
              nourish
            </Typography>
          </View>
          {children}
        </ScrollView>
        {footer && (
          <View className="w-full max-w-[520px] self-center px-6 pt-3 pb-4">{footer}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
