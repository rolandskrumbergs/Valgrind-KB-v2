import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';

export const useAppState = () => {
  onlineManager.setEventListener(setOnline => {
    return NetInfo.addEventListener(state => {
      setOnline(!!state.isConnected);
    });
  });

  // Reset badge count when app becomes active
  useEffect(() => {
    const handleAppStateChange = async (status: AppStateStatus) => {
      if (status === 'active') {
        try {
          await Notifications.setBadgeCountAsync(0);
          console.log('[useAppState] Badge count reset to 0');
        } catch (error) {
          console.error('[useAppState] Error resetting badge count:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Also reset badge count on mount (when app first opens)
    Notifications.setBadgeCountAsync(0).catch(error => {
      console.error('[useAppState] Error resetting badge count on mount:', error);
    });

    return () => subscription.remove();
  }, []);
};
