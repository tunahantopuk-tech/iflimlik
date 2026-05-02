/**
 * ActivityLockService
 *
 * Kullanıcı bir aktiviteyi tamamladığında o aktiviteyi kilitler.
 * Kilit her gün gece yarısı otomatik olarak sıfırlanır.
 * Rewarded reklam izlenerek kilit açılabilir.
 *
 * Aktiviteler: 'ifi' | 'ifishing' | 'tabu' | 'silentcinema'
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type ActivityKey = 'ifi' | 'ifishing' | 'tabu' | 'silentcinema';

const STORAGE_KEY = 'activity_locks_v1';

interface LockData {
  date: string;           // YYYY-MM-DD formatında kilit tarihi
  locked: Record<ActivityKey, boolean>;
}

// Bugünün tarihini YYYY-MM-DD formatında al
const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Kilit verisini oku — tarih farklıysa sıfırla (günlük reset)
const readLockData = async (): Promise<LockData> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data: LockData = JSON.parse(raw);
      if (data.date === todayStr()) {
        return data;
      }
      // Yeni gün — tüm kilitler sıfırlanır
    }
  } catch {}

  return {
    date: todayStr(),
    locked: { ifi: false, ifishing: false, tabu: false, silentcinema: false },
  };
};

const writeLockData = async (data: LockData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

// Bir aktiviteyi kilitli mi kontrol et
export const isActivityLocked = async (key: ActivityKey): Promise<boolean> => {
  const data = await readLockData();
  return data.locked[key] === true;
};

// Bir aktiviteyi kilitle (tamamlandıktan sonra çağrılır)
export const lockActivity = async (key: ActivityKey): Promise<void> => {
  const data = await readLockData();
  data.locked[key] = true;
  data.date = todayStr();
  await writeLockData(data);
};

// Bir aktivitenin kilidini aç (rewarded reklam sonrası çağrılır)
export const unlockActivity = async (key: ActivityKey): Promise<void> => {
  const data = await readLockData();
  data.locked[key] = false;
  await writeLockData(data);
};

// Tüm kilitlerin durumunu tek seferde oku
export const getAllLocks = async (): Promise<Record<ActivityKey, boolean>> => {
  const data = await readLockData();
  return data.locked;
};
