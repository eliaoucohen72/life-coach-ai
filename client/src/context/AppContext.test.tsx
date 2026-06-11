import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { AppContext, AppContextProvider } from './AppContext';
import { useContext } from 'react';

describe('AppContext', () => {
  it('fournit profile=null par défaut', () => {
    const { result } = renderHook(() => useContext(AppContext), {
      wrapper: AppContextProvider,
    });
    expect(result.current.profile).toBeNull();
  });

  it('fournit language="en" par défaut', () => {
    const { result } = renderHook(() => useContext(AppContext), {
      wrapper: AppContextProvider,
    });
    expect(result.current.language).toBe('en');
  });

  it('fournit activeConversationId=null par défaut', () => {
    const { result } = renderHook(() => useContext(AppContext), {
      wrapper: AppContextProvider,
    });
    expect(result.current.activeConversationId).toBeNull();
  });

  it('expose setProfile, setLanguage, setActiveConversationId comme fonctions', () => {
    const { result } = renderHook(() => useContext(AppContext), {
      wrapper: AppContextProvider,
    });
    expect(typeof result.current.setProfile).toBe('function');
    expect(typeof result.current.setLanguage).toBe('function');
    expect(typeof result.current.setActiveConversationId).toBe('function');
  });
});
