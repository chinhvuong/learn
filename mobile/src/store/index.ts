import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from 'redux-persist';
import { MMKV } from 'react-native-mmkv';
import appSlice from './slices/appSlice';
import lessonSessionSlice from '@/features/lesson/lessonSessionSlice';
import onboardingSlice from '@/features/onboarding/onboardingSlice';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

// Create MMKV storage instance
const storage = new MMKV();

// Redux persist storage adapter for MMKV
const reduxStorage = {
  setItem: (key: string, value: string) => {
    storage.set(key, value);
    return Promise.resolve(true);
  },
  getItem: (key: string) => {
    const value = storage.getString(key);
    return Promise.resolve(value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
    return Promise.resolve();
  },
};

// Combine reducers. `lessonSession` is the transient per-reading-pass state of
// the Lesson Player — it is intentionally NOT persisted (kept out of the
// whitelist below), so a Lesson always opens fresh.
const rootReducer = combineReducers({
  app: appSlice,
  lessonSession: lessonSessionSlice,
  // `onboarding` IS persisted: the Interest Profile seed, seeded Levels, Daily
  // Goal, and anonymous Golden-First-Lesson progress must survive across the
  // pre-signup flow and the anonymous→account migration (PRD stories 1–11).
  onboarding: onboardingSlice,
});

const persistedReducer = persistReducer({
  key: 'root',
  storage: reduxStorage,
  whitelist: ['app', 'onboarding'],
  stateReconciler: autoMergeLevel2 as any,
}, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
