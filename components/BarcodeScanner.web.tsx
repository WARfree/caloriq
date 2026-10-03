import { View } from 'react-native';
import { Button, Typography } from 'heroui-native';
import { ScanBarcode } from 'lucide-react-native';
import { palette } from '@/lib/tracker';
import type { BarcodeScannerProps } from './BarcodeScanner';

export default function BarcodeScanner({ onManual }: BarcodeScannerProps) {
  return (
    <View className="bg-surface items-center gap-4 rounded-3xl p-6">
      <ScanBarcode size={36} color={palette.accent} />
      <Typography align="center">
        Scannerul cu cameră este disponibil în aplicația de pe telefon.
      </Typography>
      <Button onPress={onManual}>
        <Button.Label>Introdu codul manual</Button.Label>
      </Button>
    </View>
  );
}
