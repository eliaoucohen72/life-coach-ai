import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Profile } from '../schemas/profile.schema';

interface AppContextValue {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

const defaultValue: AppContextValue = {
  profile: null,
  setProfile: () => {},
  activeConversationId: null,
  setActiveConversationId: () => {},
  language: 'en',
  setLanguage: () => {},
};

export const AppContext = createContext<AppContextValue>(defaultValue);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('en');

  return (
    <AppContext.Provider
      value={{
        profile,
        setProfile,
        activeConversationId,
        setActiveConversationId,
        language,
        setLanguage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
