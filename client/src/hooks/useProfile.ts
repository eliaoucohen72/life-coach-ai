import type { Profile } from '../schemas/profile.schema';

export function useProfile() {
  return {
    profile: null as Profile | null,
    saveProfile: async (_profile: Profile): Promise<void> => {},
  };
}
