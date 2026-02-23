import { focusManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

export const useOnlineManager = () => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);
};
