import { create } from 'zustand';
import type { Session } from '@biltme/backend';
import * as Haptics from 'expo-haptics';
import { bilt } from '@/lib/bilt';
import { profileSchema, type CalorieProfile, type ProfileDraft } from '@/lib/calorie-profile';

type AccountState = {
  session: Session | null;
  profile: CalorieProfile | null;
  draft: ProfileDraft;
  ready: boolean;
  error: string | null;
  setSession: (session: Session | null) => void;
  initialize: () => Promise<void>;
  setDraft: (patch: ProfileDraft) => void;
  saveProfile: () => Promise<boolean>;
};
export const useAccount = create<AccountState>((set, get) => ({
  session: null,
  profile: null,
  draft: {},
  ready: false,
  error: null,
  setSession: (session) => {
    const result = profileSchema.safeParse(session?.user.user_metadata.calorie_profile);
    const sameUser = get().session?.user.id === session?.user.id;
    set({
      session,
      profile: result.success ? result.data : null,
      ready: true,
      error: null,
      draft: sameUser ? get().draft : result.success ? result.data : {},
    });
  },
  initialize: async () => {
    set({ error: null });
    try {
      const { data, error } = await bilt.auth.getSession();
      if (error) throw error;
      get().setSession(data.session);
    } catch {
      set({ error: 'Nu am putut deschide contul. Încearcă din nou.' });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
  setDraft: (patch) => set({ draft: { ...get().draft, ...patch }, error: null }),
  saveProfile: async () => {
    const parsed = profileSchema.safeParse(get().draft);
    if (!parsed.success) return false;
    try {
      const { data, error } = await bilt.auth.updateUser({
        data: { calorie_profile: parsed.data },
      });
      if (error) throw error;
      const session = get().session;
      if (!session) return false;
      set({ session: { ...session, user: data.user }, profile: parsed.data, error: null });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch {
      set({ error: 'Planul nu a putut fi salvat. Încearcă din nou.' });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
  },
}));

export function authErrorMessage(code?: string) {
  switch (code) {
    case 'invalid_credentials':
      return 'Emailul sau parola nu este corectă.';
    case 'email_not_confirmed':
      return 'Confirmă adresa de email înainte de autentificare.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Există deja un cont cu acest email. Autentifică-te.';
    case 'otp_expired':
      return 'Codul este incorect sau a expirat. Solicită un cod nou.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Prea multe încercări. Așteaptă puțin și încearcă din nou.';
    case 'weak_password':
      return 'Alege o parolă mai puternică, de cel puțin 8 caractere.';
    default:
      return 'Nu am putut finaliza acțiunea. Încearcă din nou.';
  }
}
