import { useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, Skeleton, Typography } from 'heroui-native';
import { ScanBarcode } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { palette } from '@/lib/tracker';

export type BarcodeScannerProps = { onScan: (code: string) => void; onManual: () => void };
export default function BarcodeScanner({ onScan, onManual }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraError, setCameraError] = useState('');
  const locked = useRef(false);
  const focused = useIsFocused();
  const reportError = (message: string) => {
    setCameraError(message);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };
  if (!permission) return <Skeleton className="h-72 rounded-3xl" />;
  if (!permission.granted) {
    return (
      <View className="bg-surface items-center gap-4 rounded-3xl p-6">
        <ScanBarcode size={36} color={palette.accent} />
        <Typography align="center">
          Permite accesul la cameră pentru scanarea codurilor de bare.
        </Typography>
        {!!cameraError && (
          <Typography align="center" className="text-danger">
            {cameraError}
          </Typography>
        )}
        <Button
          onPress={() => {
            if (!permission.canAskAgain) {
              void Linking.openSettings().catch(() =>
                reportError('Deschide setările telefonului pentru acces la cameră.'),
              );
              return;
            }
            void requestPermission()
              .then((result) => {
                if (!result.granted)
                  reportError('Accesul la cameră nu este permis. Poți introduce codul manual.');
              })
              .catch(() =>
                reportError('Camera nu poate fi deschisă. Poți introduce codul manual.'),
              );
          }}
        >
          <Button.Label>
            {permission.canAskAgain ? 'Permite camera' : 'Deschide setările'}
          </Button.Label>
        </Button>
        <Button variant="ghost" onPress={onManual}>
          <Button.Label>Introdu codul manual</Button.Label>
        </Button>
      </View>
    );
  }
  if (cameraError)
    return (
      <View className="items-center gap-4 py-8">
        <ScanBarcode size={32} color={palette.accent} />
        <Typography align="center">{cameraError}</Typography>
        <Button
          onPress={() => {
            setCameraError('');
            locked.current = false;
          }}
        >
          <Button.Label>Încearcă din nou</Button.Label>
        </Button>
        <Button variant="ghost" onPress={onManual}>
          <Button.Label>Introdu codul manual</Button.Label>
        </Button>
      </View>
    );
  return (
    <View className="gap-4">
      <View className="overflow-hidden rounded-3xl" style={{ height: 280 }}>
        {focused && (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'itf14'] }}
            onMountError={() =>
              reportError('Camera nu poate fi deschisă. Încearcă din nou sau introdu codul manual.')
            }
            onBarcodeScanned={({ data }) => {
              if (locked.current || !/^\d{8,14}$/.test(data)) return;
              locked.current = true;
              void Haptics.selectionAsync();
              onScan(data);
            }}
          />
        )}
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
          <View
            className="border-accent rounded-2xl border-2"
            style={{ width: '80%', height: 130 }}
          />
        </View>
      </View>
      <Typography type="body-sm" color="muted" align="center">
        Încadrează codul de bare de pe ambalaj.
      </Typography>
      <Button variant="secondary" onPress={onManual}>
        <Button.Label>Introdu codul manual</Button.Label>
      </Button>
    </View>
  );
}
