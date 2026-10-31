import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Persistence, PopupRedirectResolver } from 'firebase/auth';
import * as auth from 'firebase/auth';

type PersistenceFactory = (storage: typeof AsyncStorage) => Persistence;

const getReactNativePersistence = (
  auth as unknown as { getReactNativePersistence: PersistenceFactory }
).getReactNativePersistence;

export const persistence: Persistence[] = [getReactNativePersistence(AsyncStorage)];

export const popupRedirectResolver: PopupRedirectResolver | undefined = undefined;
