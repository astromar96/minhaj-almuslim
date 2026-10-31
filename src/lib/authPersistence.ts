import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  indexedDBLocalPersistence,
  type Persistence,
  type PopupRedirectResolver,
} from 'firebase/auth';

export const persistence: Persistence[] = [indexedDBLocalPersistence, browserLocalPersistence];

export const popupRedirectResolver: PopupRedirectResolver | undefined = browserPopupRedirectResolver;
