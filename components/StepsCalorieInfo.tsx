import { useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { Button, Dialog, Typography } from 'heroui-native';
import { Info } from 'lucide-react-native';
import { palette } from '@/lib/tracker';

export function StepsCalorieInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const { height } = useWindowDimensions();
  return (
    <Dialog isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        accessibilityLabel="Cum sunt calculate caloriile din pași"
        onPress={() => setIsOpen(true)}
      >
        <Info size={20} color={palette.muted} />
      </Button>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="gap-4 rounded-3xl p-5">
          <Dialog.Title>Caloriile din pași</Dialog.Title>
          <ScrollView style={{ maxHeight: Math.max(120, height - 300) }}>
            <View className="gap-4">
              <Dialog.Description>
                Dacă nu introduci caloriile, estimăm energia consumată prin mers pe teren plat,
                peste consumul din repaus. Dacă introduci o valoare, o păstrăm pe aceea.
              </Dialog.Description>
              <Typography type="body-sm" weight="semibold">
                Formula estimării
              </Typography>
              <Typography type="body-sm" weight="normal">
                Lungimea unui pas ≈ înălțimea în metri × 0,414.{'\n'}
                Distanța în km ≈ numărul de pași × lungimea pasului ÷ 1.000.{'\n'}
                Calorii active ≈ 0,5 × greutatea în kg × distanța în km.
              </Typography>
              <Typography type="body-sm" weight="normal">
                Folosim greutatea și înălțimea din profil la salvare. Estimarea salvată nu se
                schimbă dacă modifici ulterior profilul; o recalculăm când salvezi din nou pașii.
              </Typography>
              <Typography type="body-sm" weight="normal">
                Durata este opțională. Din ea calculăm ritmul mediu în pași/minut. În acest model
                simplificat de mers pe teren plat, energia depinde de greutate și distanță, nu
                direct de durată.
              </Typography>
              <Typography type="body-sm" weight="normal">
                Vârsta, sexul și nivelul de activitate nu au un coeficient separat în această
                formulă. Vârsta și sexul sunt folosite la obiectivul caloric zilnic, care are o
                formulă diferită.
              </Typography>
              <Typography type="body-sm" weight="normal" color="muted">
                Este o aproximație, nu o măsurare. Panta, alergarea, ritmul și lungimea reală a
                pasului pot schimba consumul. Pentru datele unui ceas sau ale unei aplicații,
                introdu manual caloriile active, nu caloriile totale.
              </Typography>
              <Typography type="body-sm" weight="normal" color="muted">
                Nu adăugăm aceste calorii la obiectivul zilnic sau la totalul antrenamentelor: o
                plimbare înregistrată separat poate include aceiași pași.
              </Typography>
            </View>
          </ScrollView>
          <Button onPress={() => setIsOpen(false)}>
            <Button.Label>Am înțeles</Button.Label>
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
