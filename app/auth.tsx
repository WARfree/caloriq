import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Input, Label, TextField, Typography } from 'heroui-native';
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AccountScreen } from '@/components/AccountScreen';
import { bilt } from '@/lib/bilt';
import { authErrorMessage, useAccount } from '@/lib/account';
import { palette } from '@/lib/tracker';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const normalizedEmail = email.trim().toLowerCase();
  const showError = (message: string) => {
    setError(message);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };
  const changeMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setNotice('');
    setPassword('');
    setCode('');
    void Haptics.selectionAsync();
  };
  const submit = async () => {
    setError('');
    setNotice('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
      return showError('Introdu o adresă de email validă.');
    if (
      mode === 'verify' ? !/^\d{6}$/.test(code) : password.length < (mode === 'register' ? 8 : 1)
    ) {
      return showError(
        mode === 'verify'
          ? 'Introdu codul de 6 cifre.'
          : mode === 'register'
            ? 'Parola trebuie să aibă cel puțin 8 caractere.'
            : 'Introdu parola.',
      );
    }
    setBusy(true);
    try {
      if (mode === 'verify') {
        const { data, error: failure } = await bilt.auth.verifyOtp({
          email: normalizedEmail,
          token: code,
          type: 'signup',
        });
        if (failure) throw failure;
        if (data.session) useAccount.getState().setSession(data.session);
      } else if (mode === 'register') {
        const { data, error: failure } = await bilt.auth.signUp({
          email: normalizedEmail,
          password,
        });
        if (failure) throw failure;
        setPassword('');
        if (data.session) useAccount.getState().setSession(data.session);
        else setMode('verify');
      } else {
        const { data, error: failure } = await bilt.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (failure) throw failure;
        useAccount.getState().setSession(data.session);
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (failure) {
      const failureCode =
        typeof failure === 'object' && failure !== null && 'code' in failure
          ? String(failure.code)
          : undefined;
      showError(authErrorMessage(failureCode));
      if (failureCode === 'email_not_confirmed') {
        setMode('verify');
        setPassword('');
      }
    } finally {
      setBusy(false);
    }
  };
  const resend = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const { error: failure } = await bilt.auth.resend({ type: 'signup', email: normalizedEmail });
      if (failure) throw failure;
      setNotice('Am trimis un cod nou. Verifică și folderul Spam.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      showError('Codul nu a putut fi trimis. Așteaptă puțin și încearcă din nou.');
    } finally {
      setBusy(false);
    }
  };
  const verify = mode === 'verify';
  return (
    <AccountScreen>
      <View className="bg-peach mb-6 h-16 w-16 items-center justify-center rounded-[22px]">
        {verify ? (
          <Mail size={30} color={palette.accent} />
        ) : (
          <ShieldCheck size={30} color={palette.accent} />
        )}
      </View>
      <Typography.Heading type="h1" weight="bold" className="mb-7 tracking-tight">
        {verify ? 'Confirmă emailul' : mode === 'register' ? 'Creează un cont' : 'Bine ai revenit'}
      </Typography.Heading>
      {verify && (
        <Typography className="mb-6" type="body" weight="normal" color="muted">
          Introdu codul de 6 cifre trimis la {normalizedEmail}.
        </Typography>
      )}
      <Card className="gap-5 rounded-[28px] p-5">
        {!verify ? (
          <>
            <TextField isDisabled={busy}>
              <Label>Email</Label>
              <Input
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                placeholder="nume@exemplu.ro"
                className="bg-background rounded-2xl"
              />
            </TextField>
            <TextField isDisabled={busy}>
              <Label>Parolă</Label>
              <Input
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError('');
                }}
                secureTextEntry
                autoCapitalize="none"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                placeholder={mode === 'register' ? 'Minimum 8 caractere' : 'Parola ta'}
                className="bg-background rounded-2xl"
                onSubmitEditing={() => void submit()}
              />
            </TextField>
          </>
        ) : (
          <TextField isDisabled={busy}>
            <Label>Cod de confirmare</Label>
            <Input
              value={code}
              onChangeText={(text) => {
                setCode(text.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              placeholder="000000"
              className="bg-background rounded-2xl text-2xl"
              onSubmitEditing={() => void submit()}
            />
          </TextField>
        )}
        {!!error && (
          <Typography
            type="body-sm"
            weight="normal"
            className="text-danger"
            accessibilityRole="alert"
          >
            {error}
          </Typography>
        )}
        {!!notice && (
          <Typography type="body-sm" weight="normal">
            {notice}
          </Typography>
        )}
        <Button isDisabled={busy} onPress={() => void submit()} className="h-14 rounded-2xl">
          <Button.Label>
            {busy
              ? 'Se procesează…'
              : verify
                ? 'Confirmă emailul'
                : mode === 'register'
                  ? 'Creează contul'
                  : 'Autentificare'}
          </Button.Label>
          {!busy && <ArrowRight size={19} color={palette.white} />}
        </Button>
      </Card>
      {verify ? (
        <View className="mt-5 gap-2">
          <Button variant="ghost" isDisabled={busy} onPress={() => void resend()}>
            <Button.Label>Trimite un cod nou</Button.Label>
          </Button>
          <Button variant="ghost" isDisabled={busy} onPress={changeMode}>
            <Button.Label>Înapoi la autentificare</Button.Label>
          </Button>
        </View>
      ) : (
        <View className="mt-7 items-center gap-2">
          <Typography type="body-sm" weight="normal" color="muted">
            {mode === 'login' ? 'Nu ai un cont?' : 'Ai deja un cont?'}
          </Typography>
          <Button variant="ghost" isDisabled={busy} onPress={changeMode}>
            <Button.Label>{mode === 'login' ? 'Înregistrează-te' : 'Autentifică-te'}</Button.Label>
          </Button>
        </View>
      )}
      {mode === 'register' && (
        <Typography type="body-sm" weight="normal" color="muted" align="center" className="mt-8">
          Planul caloric este destinat adulților de minimum 18 ani.
        </Typography>
      )}
    </AccountScreen>
  );
}
