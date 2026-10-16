import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import {
  getDatabase,
  ref as rtdbRef,
  set as rtdbSet,
  get as rtdbGet,
  onValue as rtdbOnValue,
  update as rtdbUpdate,
} from 'firebase/database';
import {
  saveSubscriptionToSupabase,
  getSubscriptionFromSupabase,
} from './supabase';

export const firebaseConfig = {
  apiKey: "AIzaSyC3eR88QL3bvv03Z502bOzx0cOKbB0ieeE",
  authDomain: "neliplay.firebaseapp.com",
  databaseURL: "https://neliplay-default-rtdb.firebaseio.com",
  projectId: "neliplay",
  storageBucket: "neliplay.firebasestorage.app",
  messagingSenderId: "39702563643",
  appId: "1:39702563643:web:0f3bd21d7f9eebf283051e",
  measurementId: "G-X6PTFVYN1H"
};

// Initialize Firebase App safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export interface UserProfile {
  uid: string;
  email?: string;
  displayName: string;
  phone?: string;
  photoURL?: string;
  role: 'admin' | 'user';
  isAnonymous: boolean;
  subscription: {
    status: 'inactive' | 'active' | 'lifetime';
    planId?: 'freemium' | 'standard' | 'premium';
    planName?: string;
    expiresAt?: number; // timestamp in ms
    orderId?: string;
    phonePaidWith?: string;
    amountPaid?: number;
    updatedAt?: string;
  };
}

const LOCAL_STORAGE_USER_KEY = 'nelitv_user_profile';
const LEGACY_STORAGE_USER_KEY = 'nelistream_user_profile';

// Helper to get local cached profile strictly for the current logged-in account
export function getCachedUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY) || localStorage.getItem(LEGACY_STORAGE_USER_KEY);
    if (!raw) return null;
    const profile: UserProfile = JSON.parse(raw);

    // If admin or lifetime, always valid
    if (profile && (profile.role === 'admin' || profile.subscription?.status === 'lifetime')) {
      return profile;
    }

    // If profile has an active subscription, strictly check if expired
    if (profile && profile.subscription) {
      if (profile.subscription.status === 'active' && profile.subscription.expiresAt) {
        if (Date.now() >= profile.subscription.expiresAt) {
          profile.subscription.status = 'inactive';
          setCachedUserProfile(profile);
        }
      }
    }

    return profile;
  } catch {
    return null;
  }
}

// Helper to save local cached profile
export function setCachedUserProfile(profile: UserProfile | null) {
  if (!profile) {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    localStorage.removeItem(LEGACY_STORAGE_USER_KEY);
  } else {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
    localStorage.setItem(LEGACY_STORAGE_USER_KEY, JSON.stringify(profile));
  }
}

// Check if user has active paid subscription (STRICT: reads ONLY this account's subscription, no shared device cache)
export function isUserSubscribed(profile: UserProfile | null): boolean {
  if (!profile) return false;

  // Admin users have full unlocked access to all channels without payment
  if (profile.role === 'admin') {
    return true;
  }

  const now = Date.now();

  // 1. Direct check of HarakaPay payment verification for this account (independent of Firebase!)
  try {
    const rawHk = localStorage.getItem(`nelitv_harakapay_${profile.uid}`);
    if (rawHk) {
      const parsed = JSON.parse(rawHk);
      if (parsed && parsed.expiresAt && now < parsed.expiresAt) {
        return true;
      }
    }
  } catch {}

  if (!profile.subscription) return false;

  // Lifetime VIP subscriptions (Admin / Free VIP promo accounts)
  if (profile.subscription.status === 'lifetime') {
    return true;
  }

  // Strictly check this specific user's subscription
  if (profile.subscription.status === 'active' && profile.subscription.expiresAt) {
    return now < profile.subscription.expiresAt;
  }

  return false;
}

// Restore paid subscription on another device using phone number
export async function restoreSubscriptionByPhone(phoneInput: string): Promise<UserProfile | null> {
  let cleanPhone = phoneInput.trim().replace(/\s+/g, '').replace('+', '');
  if (cleanPhone.startsWith('255')) {
    cleanPhone = '0' + cleanPhone.substring(3);
  } else if (cleanPhone.length === 9 && (cleanPhone.startsWith('7') || cleanPhone.startsWith('6'))) {
    cleanPhone = '0' + cleanPhone;
  }

  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('Weka namba sahihi ya simu (mfano: 0712345678).');
  }

  const now = Date.now();
  let foundSub: UserProfile['subscription'] | null = null;

  // 0. Query Supabase nelitv_subscriptions table
  try {
    const sbSub = await getSubscriptionFromSupabase(cleanPhone);
    if (sbSub && sbSub.premium_status === 'active') {
      const expMs = new Date(sbSub.expires_at).getTime();
      if (expMs > now) {
        foundSub = {
          status: 'active',
          planId: 'standard',
          planName: 'Supabase VIP',
          expiresAt: expMs,
          orderId: `sb_${sbSub.id || Date.now()}`,
          phonePaidWith: cleanPhone,
          amountPaid: 1000,
          updatedAt: new Date().toISOString(),
        };
      }
    }
  } catch (sbErr) {
    console.warn('[Supabase restore check]:', sbErr);
  }

  // 1. Query Realtime Database for payments by phone
  try {
    const snap = await rtdbGet(rtdbRef(rtdb, 'payments_by_phone/' + cleanPhone));
    if (snap.exists()) {
      const p = snap.val();
      if (p && p.expiresAt && p.expiresAt > now) {
        foundSub = {
          status: 'active',
          planId: p.planId || 'freemium',
          planName: p.planName || 'Kifurushi Kilicho Lipiwa',
          expiresAt: p.expiresAt,
          orderId: p.orderId,
          phonePaidWith: cleanPhone,
          amountPaid: p.amount,
          updatedAt: new Date().toISOString(),
        };
      }
    }
  } catch {}

  // 2. Query Firestore for payments by phone
  if (!foundSub) {
    try {
      const fsSnap = await getDoc(doc(db, 'payments_by_phone', cleanPhone));
      if (fsSnap.exists()) {
        const p = fsSnap.data();
        if (p && p.expiresAt && p.expiresAt > now) {
          foundSub = {
            status: 'active',
            planId: p.planId || 'freemium',
            planName: p.planName || 'Kifurushi Kilicho Lipiwa',
            expiresAt: p.expiresAt,
            orderId: p.orderId,
            phonePaidWith: cleanPhone,
            amountPaid: p.amount,
            updatedAt: new Date().toISOString(),
          };
        }
      }
    } catch {}
  }

  // 3. Query Server API for verified orders
  if (!foundSub) {
    try {
      const res = await fetch(`/api/payment/verify-phone/${cleanPhone}`);
      const data = await res.json();
      if (data.success && data.status === 'completed' && data.order) {
        const o = data.order;
        let days = 2;
        if (o.planId === 'standard') days = 7;
        if (o.planId === 'premium') days = 30;
        const createdAtTime = o.created_at ? new Date(o.created_at).getTime() : now;
        const expiresAt = createdAtTime + days * 24 * 60 * 60 * 1000;
        if (expiresAt > now) {
          foundSub = {
            status: 'active',
            planId: o.planId || 'freemium',
            planName: o.planId === 'premium' ? 'Premium VIP' : (o.planId === 'standard' ? 'Standard' : 'Freemium (Siku 2)'),
            expiresAt,
            orderId: o.order_id,
            phonePaidWith: cleanPhone,
            amountPaid: o.amount,
            updatedAt: new Date().toISOString(),
          };
        }
      }
    } catch {}
  }

  if (!foundSub) {
    throw new Error('Hakuna kifurushi kinachofanya kazi kilichopatikana kwa namba hii. Tafadhali hakikisha umelipia.');
  }

  // Clear legacy trial flags
  try {
    localStorage.removeItem('nelitv_trial_expired');
    sessionStorage.setItem('nelistream_active_sub', 'true');
  } catch {}

  const restoredUser: UserProfile = {
    uid: 'tz_phone_' + cleanPhone,
    displayName: `Mteja (${cleanPhone})`,
    phone: cleanPhone,
    role: 'user',
    isAnonymous: false,
    subscription: foundSub,
  };

  setCachedUserProfile(restoredUser);
  return restoredUser;
}

// Special Built-in Accounts: Admin & Free Demo Accounts
// Admin Accounts: admin@login.com & baynithcinema@gmail.com
// Free Accounts: user1@login.com to user5@login.com (password: 123456)
export async function loginSpecialBuiltInAccount(email: string, role: 'admin' | 'user'): Promise<UserProfile> {
  const normEmail = email.trim().toLowerCase();
  const isFreeUser = normEmail.startsWith('user') && normEmail.endsWith('@login.com');
  const userNum = isFreeUser ? normEmail.replace('user', '').replace('@login.com', '') : '';
  
  const displayName = role === 'admin'
    ? (normEmail === 'baynithcinema@gmail.com' ? 'Admin Baynith (NeliTv web)' : 'Admin Mkuu (NeliTv web)')
    : `Mtumiaji Bure ${userNum} (Free Access)`;

  const planName = role === 'admin' ? 'VIP Admin Access (Bure Kabisa)' : `Free Account ${userNum} (Bure Kabisa)`;

  const profile: UserProfile = {
    uid: `special-${normEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
    email: normEmail,
    displayName,
    role,
    isAnonymous: false,
    subscription: {
      status: 'lifetime',
      planId: 'premium',
      planName,
      expiresAt: Date.now() + 100 * 365 * 24 * 60 * 60 * 1000,
    }
  };

  setCachedUserProfile(profile);

  try {
    await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
    await rtdbSet(rtdbRef(rtdb, 'users/' + profile.uid), profile);
  } catch (e) {
    console.warn('Sync offline, cached special profile locally');
  }

  return profile;
}

// Special Admin Account Login Check (email: admin@login.com / pass: 123456)
export async function loginAdminSpecial(): Promise<UserProfile> {
  return loginSpecialBuiltInAccount('admin@login.com', 'admin');
}

// Google Sign-In (with popup or automatic one-tap)
export async function signInWithGoogle(): Promise<UserProfile> {
  const res = await signInWithPopup(auth, googleProvider);
  const fbUser = res.user;

  return await syncAndFetchUserProfile(fbUser);
}

// Sync user between Firestore, Realtime Database (shared with Android App), and Local Cache
export async function syncAndFetchUserProfile(fbUser: FirebaseUser): Promise<UserProfile> {
  let profile: UserProfile = {
    uid: fbUser.uid,
    email: fbUser.email || undefined,
    displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Mtumiaji',
    photoURL: fbUser.photoURL || undefined,
    role: fbUser.email && (
      fbUser.email === 'baynithcinema@gmail.com' ||
      fbUser.email === 'baynithromanapp@gmail.com' ||
      fbUser.email === 'admin@neliplay.tz' ||
      fbUser.email === 'admin@neliplay.com'
    ) ? 'admin' : 'user',
    isAnonymous: fbUser.isAnonymous,
    subscription: {
      status: 'inactive'
    }
  };

  // 1. Try reading from Realtime Database first (where the Android app stores data)
  try {
    const rtdbSnap = await rtdbGet(rtdbRef(rtdb, 'users/' + fbUser.uid));
    if (rtdbSnap.exists()) {
      const data = rtdbSnap.val();
      profile = {
        ...profile,
        ...data,
        subscription: data.subscription || profile.subscription,
        role: data.role || profile.role,
      };
    }
  } catch (err) {
    console.warn('Could not read user from RTDB:', err);
  }

  // 2. Also check Realtime Database "subscriptions/{uid}" directly in case Android app writes there
  try {
    const subSnap = await rtdbGet(rtdbRef(rtdb, 'subscriptions/' + fbUser.uid));
    if (subSnap.exists()) {
      const subData = subSnap.val();
      if (subData && subData.status === 'active' && subData.expiresAt > Date.now()) {
        profile.subscription = {
          ...profile.subscription,
          ...subData,
        };
      }
    }
  } catch (err) {
    console.warn('Could not read subscription from RTDB:', err);
  }

  // 3. Check Firestore
  try {
    const firestoreDoc = await getDoc(doc(db, 'users', fbUser.uid));
    if (firestoreDoc.exists()) {
      const fsData = firestoreDoc.data() as UserProfile;
      // Merge: pick the latest active subscription between Firestore & RTDB
      if (fsData.subscription?.expiresAt && (!profile.subscription.expiresAt || fsData.subscription.expiresAt > profile.subscription.expiresAt)) {
        profile.subscription = fsData.subscription;
      }
      if (fsData.phone) profile.phone = fsData.phone;
    }
  } catch (err) {
    console.warn('Could not read user from Firestore:', err);
  }

  // 4. Save synced state back to both Firestore and Realtime Database
  try {
    await setDoc(doc(db, 'users', fbUser.uid), profile, { merge: true });
    await rtdbSet(rtdbRef(rtdb, 'users/' + fbUser.uid), profile);
  } catch (err) {
    console.warn('Sync back error:', err);
  }

  setCachedUserProfile(profile);
  return profile;
}

// Register with Name, Email & Password
export async function registerWithEmail(name: string, email: string, pass: string): Promise<UserProfile> {
  const normEmail = email.trim().toLowerCase();
  let fbUser: FirebaseUser | null = null;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, normEmail, pass);
    fbUser = userCredential.user;
    if (name) {
      await updateProfile(fbUser, { displayName: name });
    }
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      throw new Error('Barua pepe hii imekwisha sajiliwa tayari. Tafadhali ingia.');
    } else if (err.code === 'auth/weak-password') {
      throw new Error('Neno la siri ni fupi mno (angalau herufi 6).');
    } else if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
      // Fallback when Email/Password is not yet toggled on in Firebase Console
      console.warn('Firebase Email/Password is disabled in console. Saving profile to database directly.');
      const safeUid = 'email_' + normEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const profile: UserProfile = {
        uid: safeUid,
        email: normEmail,
        displayName: name.trim() || normEmail.split('@')[0],
        role: (normEmail === 'admin@neliplay.tz' || normEmail === 'baynithcinema@gmail.com') ? 'admin' : 'user',
        isAnonymous: false,
        subscription: {
          status: 'inactive'
        }
      };

      try {
        await setDoc(doc(db, 'users', safeUid), { ...profile, passHash: pass }, { merge: true });
        await rtdbSet(rtdbRef(rtdb, 'users/' + safeUid), { ...profile, passHash: pass });
      } catch {}

      setCachedUserProfile(profile);
      return profile;
    }
    throw new Error(err.message || 'Hitilafu ya usajili. Tafadhali jaribu tena au tumia Ingia na Google.');
  }

  const profile: UserProfile = {
    uid: fbUser.uid,
    email: fbUser.email || normEmail,
    displayName: name.trim() || normEmail.split('@')[0],
    role: (normEmail === 'admin@neliplay.tz' || normEmail === 'baynithcinema@gmail.com') ? 'admin' : 'user',
    isAnonymous: false,
    subscription: {
      status: 'inactive'
    }
  };

  try {
    await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
    await rtdbSet(rtdbRef(rtdb, 'users/' + profile.uid), profile);
  } catch (e) {
    console.warn('Could not write to database immediately', e);
  }

  setCachedUserProfile(profile);
  return profile;
}

// Login with Email & Password
export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const normEmail = email.trim().toLowerCase();

  // 1. Built-in Admin Accounts with password 123456
  if ((normEmail === 'admin@login.com' || normEmail === 'baynithcinema@gmail.com') && pass === '123456') {
    return loginSpecialBuiltInAccount(normEmail, 'admin');
  }

  // 2. Built-in Free Accounts: user1@login.com, user2@login.com, user3@login.com, user4@login.com, user5@login.com with password 123456
  const freeAccountEmails = [
    'user1@login.com',
    'user2@login.com',
    'user3@login.com',
    'user4@login.com',
    'user5@login.com',
  ];
  if (freeAccountEmails.includes(normEmail) && pass === '123456') {
    return loginSpecialBuiltInAccount(normEmail, 'user');
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, normEmail, pass);
    return await syncAndFetchUserProfile(credential.user);
  } catch (err: any) {
    if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      // Check if user was registered via database fallback
      const safeUid = 'email_' + normEmail.replace(/[^a-zA-Z0-9]/g, '_');
      try {
        const snap = await rtdbGet(rtdbRef(rtdb, 'users/' + safeUid));
        if (snap.exists()) {
          const u = snap.val();
          if (u.passHash && u.passHash === pass) {
            setCachedUserProfile(u);
            return u;
          }
        }
      } catch {}

      try {
        const fsDoc = await getDoc(doc(db, 'users', safeUid));
        if (fsDoc.exists()) {
          const u = fsDoc.data() as any;
          if (u.passHash && u.passHash === pass) {
            setCachedUserProfile(u);
            return u;
          }
        }
      } catch {}
    }

    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      throw new Error('Barua pepe au neno la siri si sahihi.');
    }
    throw new Error(err.message || 'Hitilafu ya kuingia. Hakikisha barua pepe na neno la siri ni sahihi.');
  }
}

// Quick Login by Mobile Phone / Anonymous
export async function loginWithPhoneOrGuest(name: string, phone: string): Promise<UserProfile> {
  let uid = 'guest_' + Date.now();
  let fbUser: FirebaseUser | null = null;

  try {
    const cred = await signInAnonymously(auth);
    fbUser = cred.user;
    uid = fbUser.uid;
  } catch (e) {
    console.warn('Anonymous auth offline, generating local session ID', e);
  }

  // Check if this phone number already paid before in Realtime Database or Firestore
  let existingSub: UserProfile['subscription'] = { status: 'inactive' };

  if (phone) {
    try {
      const snap = await rtdbGet(rtdbRef(rtdb, 'payments_by_phone/' + phone));
      if (snap.exists()) {
        const pData = snap.val();
        if (pData && pData.expiresAt > Date.now()) {
          existingSub = {
            status: 'active',
            planId: pData.planId,
            planName: pData.planName,
            expiresAt: pData.expiresAt,
            orderId: pData.orderId,
            phonePaidWith: phone,
            amountPaid: pData.amount,
          };
        }
      }
    } catch {}

    if (existingSub.status !== 'active') {
      try {
        const fsDoc = await getDoc(doc(db, 'payments_by_phone', phone));
        if (fsDoc.exists()) {
          const pData = fsDoc.data();
          if (pData && pData.expiresAt > Date.now()) {
            existingSub = {
              status: 'active',
              planId: pData.planId,
              planName: pData.planName,
              expiresAt: pData.expiresAt,
              orderId: pData.orderId,
              phonePaidWith: phone,
              amountPaid: pData.amount,
            };
          }
        }
      } catch {}
    }
  }

  const profile: UserProfile = {
    uid,
    displayName: name || (phone ? `Mteja (${phone})` : 'Mgeni'),
    phone: phone || '',
    role: 'user',
    isAnonymous: true,
    subscription: existingSub,
  };

  try {
    await setDoc(doc(db, 'users', uid), profile, { merge: true });
    await rtdbSet(rtdbRef(rtdb, 'users/' + uid), profile);
  } catch (e) {
    console.warn('Failed saving guest to database', e);
  }

  setCachedUserProfile(profile);
  return profile;
}

// Register with Tanzania Phone Number (Name, 07.../06..., 4-digit PIN)
export async function registerWithTanzaniaPhone(
  phoneInput: string,
  pin: string,
  displayName?: string
): Promise<UserProfile> {
  let cleanPhone = phoneInput.trim().replace(/\s+/g, '').replace('+', '');
  if (cleanPhone.startsWith('255')) {
    cleanPhone = '0' + cleanPhone.substring(3);
  } else if (cleanPhone.length === 9 && (cleanPhone.startsWith('7') || cleanPhone.startsWith('6'))) {
    cleanPhone = '0' + cleanPhone;
  }

  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('Namba ya simu ya Tanzania si sahihi (mfano: 0712345678).');
  }

  if (!pin || pin.trim().length !== 4 || !/^\d{4}$/.test(pin.trim())) {
    throw new Error('Neno la siri (PIN) lazima liwe namba 4 kamili (mfano: 1234).');
  }

  const uid = 'tz_phone_' + cleanPhone;

  // Check if phone has active verified payment on HarakaPay / Server
  let verifiedSub: UserProfile['subscription'] = { status: 'inactive' };
  try {
    const res = await fetch(`/api/payment/verify-phone/${cleanPhone}`);
    const data = await res.json();
    if (data.success && data.status === 'completed' && data.order) {
      const o = data.order;
      let days = 2;
      if (o.planId === 'standard') days = 7;
      if (o.planId === 'premium') days = 30;
      const createdAtTime = o.created_at ? new Date(o.created_at).getTime() : Date.now();
      const expiresAt = createdAtTime + days * 24 * 60 * 60 * 1000;
      if (expiresAt > Date.now()) {
        verifiedSub = {
          status: 'active',
          planId: o.planId || 'freemium',
          planName: o.planId === 'premium' ? 'Mwezi 1 (Siku 30)' : (o.planId === 'standard' ? 'Wiki 1 (Siku 7)' : 'Siku 2'),
          expiresAt,
          orderId: o.order_id,
          phonePaidWith: cleanPhone,
          amountPaid: o.amount,
        };
      }
    }
  } catch {}

  const profile: UserProfile = {
    uid,
    displayName: displayName?.trim() || `Mteja (${cleanPhone})`,
    phone: cleanPhone,
    role: (cleanPhone === '0712345678' || cleanPhone === '0754000000') ? 'admin' : 'user',
    isAnonymous: false,
    subscription: verifiedSub,
  };

  // Reset 1-minute free trial offer specifically for this newly registered account
  try {
    localStorage.removeItem('nelitv_trial_expired');
    localStorage.setItem('nelitv_trial_seconds_left', '60');
    sessionStorage.removeItem('nelitv_pay_prompted');
  } catch {}

  // Save profile and pin to local storage & cloud
  try {
    localStorage.setItem(`nelitv_pin_${cleanPhone}`, pin.trim());
    await setDoc(doc(db, 'users', uid), { ...profile, pinHash: pin.trim() }, { merge: true });
    await rtdbSet(rtdbRef(rtdb, 'users/' + uid), { ...profile, pinHash: pin.trim() });
  } catch (err) {
    console.warn('Could not save phone user to cloud DB', err);
  }

  setCachedUserProfile(profile);
  return profile;
}

// Login with Tanzania Phone Number & 4-digit PIN
export async function loginWithTanzaniaPhone(
  phoneInput: string,
  pinOrName?: string
): Promise<UserProfile> {
  let cleanPhone = phoneInput.trim().replace(/\s+/g, '').replace('+', '');
  if (cleanPhone.startsWith('255')) {
    cleanPhone = '0' + cleanPhone.substring(3);
  } else if (cleanPhone.length === 9 && (cleanPhone.startsWith('7') || cleanPhone.startsWith('6'))) {
    cleanPhone = '0' + cleanPhone;
  }

  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('Namba ya simu ya Tanzania si sahihi (mfano: 0712345678).');
  }

  const uid = 'tz_phone_' + cleanPhone;
  let existingProfile: UserProfile | null = null;
  let savedPin: string | null = null;

  // 1. Check local storage pin
  try {
    savedPin = localStorage.getItem(`nelitv_pin_${cleanPhone}`);
  } catch {}

  // 2. Check RTDB
  try {
    const snap = await rtdbGet(rtdbRef(rtdb, 'users/' + uid));
    if (snap.exists()) {
      existingProfile = snap.val();
      if (!savedPin && existingProfile && (existingProfile as any).pinHash) {
        savedPin = (existingProfile as any).pinHash;
      }
    }
  } catch {}

  // 3. Check Firestore
  if (!existingProfile) {
    try {
      const fsSnap = await getDoc(doc(db, 'users', uid));
      if (fsSnap.exists()) {
        existingProfile = fsSnap.data() as UserProfile;
        if (!savedPin && existingProfile && (existingProfile as any).pinHash) {
          savedPin = (existingProfile as any).pinHash;
        }
      }
    } catch {}
  }

  // Validate 4-digit PIN if provided
  const enteredPin = (pinOrName || '').trim();
  if (enteredPin && /^\d{4}$/.test(enteredPin)) {
    if (savedPin && savedPin !== enteredPin) {
      throw new Error('Neno la siri (PIN ya namba 4) si sahihi kwa namba hii.');
    }
    // If first time setting or matching, save locally
    try {
      localStorage.setItem(`nelitv_pin_${cleanPhone}`, enteredPin);
    } catch {}
  }

  // Check active subscription from HarakaPay / Server
  let verifiedSub: UserProfile['subscription'] = existingProfile?.subscription || { status: 'inactive' };

  try {
    const res = await fetch(`/api/payment/verify-phone/${cleanPhone}`);
    const data = await res.json();
    if (data.success && data.status === 'completed' && data.order) {
      const o = data.order;
      let days = 2;
      if (o.planId === 'standard') days = 7;
      if (o.planId === 'premium') days = 30;
      const createdAtTime = o.created_at ? new Date(o.created_at).getTime() : Date.now();
      const expiresAt = createdAtTime + days * 24 * 60 * 60 * 1000;
      if (expiresAt > Date.now()) {
        verifiedSub = {
          status: 'active',
          planId: o.planId || 'freemium',
          planName: o.planId === 'premium' ? 'Mwezi 1 (Siku 30)' : (o.planId === 'standard' ? 'Wiki 1 (Siku 7)' : 'Siku 2'),
          expiresAt,
          orderId: o.order_id,
          phonePaidWith: cleanPhone,
          amountPaid: o.amount,
        };
      }
    }
  } catch {}

  // Ensure expired subscriptions are strictly inactive
  if (verifiedSub.status === 'active' && verifiedSub.expiresAt && verifiedSub.expiresAt <= Date.now()) {
    verifiedSub = { status: 'inactive' };
  }

  const userProfile: UserProfile = {
    uid,
    displayName: existingProfile?.displayName || `Mteja (${cleanPhone})`,
    phone: cleanPhone,
    role: (cleanPhone === '0712345678' || cleanPhone === '0754000000') && existingProfile?.role === 'admin' ? 'admin' : (existingProfile?.role || 'user'),
    isAnonymous: false,
    subscription: verifiedSub,
  };

  try {
    await setDoc(doc(db, 'users', uid), userProfile, { merge: true });
    await rtdbSet(rtdbRef(rtdb, 'users/' + uid), userProfile);
  } catch (err) {
    console.warn('Could not save phone user to cloud DB', err);
  }

  setCachedUserProfile(userProfile);
  return userProfile;
}

// Update User Subscription after successful payment - Realtime Sync with Android App
export async function activateSubscriptionForUser(
  user: UserProfile,
  planId: 'freemium' | 'standard' | 'premium',
  amount: number,
  orderId: string,
  phonePaidWith: string
): Promise<UserProfile> {
  let durationDays = 2; // Freemium 2 days (1000 TZS)
  let planName = 'Freemium (Siku 2)';

  if (planId === 'standard') {
    durationDays = 7;
    planName = 'Standard (Wiki 1 - Siku 7)';
  } else if (planId === 'premium') {
    durationDays = 30;
    planName = 'Premium VIP (Mwezi 1 - Siku 30)';
  }

  const now = Date.now();
  const currentExpiry = user.subscription?.expiresAt && user.subscription.expiresAt > now
    ? user.subscription.expiresAt
    : now;
  const expiresAt = currentExpiry + durationDays * 24 * 60 * 60 * 1000;

  const subscriptionData: UserProfile['subscription'] = {
    status: 'active',
    planId,
    planName,
    expiresAt,
    orderId,
    phonePaidWith,
    amountPaid: (user.subscription?.amountPaid || 0) + amount,
    updatedAt: new Date().toISOString(),
  };

  const updatedProfile: UserProfile = {
    ...user,
    subscription: subscriptionData
  };

  // 1. Immediately persist in browser and site caches (as requested: offline/local first)
  try {
    localStorage.setItem(`nelitv_harakapay_${user.uid}`, JSON.stringify({
      orderId,
      planId,
      expiresAt,
      amount,
      phone: phonePaidWith,
      timestamp: now,
    }));
    localStorage.setItem('nelistream_local_subscription', JSON.stringify(subscriptionData));
    localStorage.removeItem('nelitv_trial_expired');
    localStorage.setItem('nelitv_trial_seconds_left', '999999');
    sessionStorage.setItem('nelistream_active_sub', 'true');
  } catch {}

  // 1.5. Persist to Supabase nelitv_subscriptions table
  if (phonePaidWith) {
    try {
      saveSubscriptionToSupabase(phonePaidWith, expiresAt, 'active').catch((err) => {
        console.warn('[Supabase saveSubscription warn]:', err);
      });
    } catch {}
  }

  setCachedUserProfile(updatedProfile);

  const paymentRecord = {
    userId: user.uid,
    userEmail: user.email || '',
    userName: user.displayName || '',
    phone: phonePaidWith,
    orderId,
    amount,
    planId,
    planName,
    expiresAt,
    createdAt: new Date().toISOString(),
    timestamp: Date.now(),
    status: 'completed',
  };

  // 1. Sync to Realtime Database (Used by the Android Mobile App!)
  try {
    // Update user profile in RTDB
    await rtdbSet(rtdbRef(rtdb, 'users/' + user.uid), updatedProfile);

    // Update dedicated subscriptions path in RTDB
    await rtdbSet(rtdbRef(rtdb, 'subscriptions/' + user.uid), subscriptionData);

    // Save payment log in RTDB
    await rtdbSet(rtdbRef(rtdb, 'payments/' + orderId), paymentRecord);

    // Save phone lookup in RTDB so another device with same phone can restore
    if (phonePaidWith) {
      await rtdbSet(rtdbRef(rtdb, 'payments_by_phone/' + phonePaidWith), paymentRecord);
    }
  } catch (err) {
    console.warn('Realtime Database payment sync error:', err);
  }

  // 2. Sync to Firestore (Dual persistence)
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, updatedProfile, { merge: true });

    await setDoc(doc(db, 'payments', orderId), paymentRecord);

    if (phonePaidWith) {
      await setDoc(doc(db, 'payments_by_phone', phonePaidWith), paymentRecord, { merge: true });
    }
  } catch (err) {
    console.warn('Firestore payment sync error:', err);
  }

  return updatedProfile;
}

// Real-time listener for user profile updates from Android App or other devices
export function listenToUserProfileRealtime(
  uid: string,
  onUpdate: (profile: UserProfile) => void
): () => void {
  const userRef = rtdbRef(rtdb, 'users/' + uid);
  const unsubscribe = rtdbOnValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val() as UserProfile;
      setCachedUserProfile(data);
      onUpdate(data);
    }
  }, (err) => {
    console.warn('RTDB listener error:', err);
  });

  return () => {
    // Shuts off listener on unmount
    unsubscribe();
  };
}

// Auto-Login Listener (Never logs out logged-in user on reload)
export function initAutoLogin(onUserChanged: (user: UserProfile | null) => void): () => void {
  // First, immediately provide cached user if present
  const initialCached = getCachedUserProfile();
  if (initialCached) {
    onUserChanged(initialCached);
  }

  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      try {
        const profile = await syncAndFetchUserProfile(fbUser);
        onUserChanged(profile);
      } catch (e) {
        console.warn('Failed auto-syncing user profile:', e);
        const cached = getCachedUserProfile();
        if (cached) {
          onUserChanged(cached);
        }
      }
    } else {
      // Check if user is logged in via phone, credentials, or special account
      const cached = getCachedUserProfile();
      if (cached && (cached.uid || cached.phone || cached.email)) {
        onUserChanged(cached);
      } else {
        onUserChanged(null);
      }
    }
  });
}

// Sign Out: Thoroughly wipe all cached credentials, phones, pending payments and subscriptions for this device
export async function signOutUser() {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.warn('Error signing out firebase auth', e);
  }
  try {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    localStorage.removeItem(LEGACY_STORAGE_USER_KEY);
    localStorage.removeItem('nelistream_local_subscription');
    localStorage.removeItem('nelitv_trial_expired');
    localStorage.removeItem('nelitv_trial_seconds_left');
    localStorage.removeItem('nelitv_pending_payment');
    localStorage.removeItem('nelitv_pay_prompted');
    localStorage.removeItem('nelitv_user_phone');
    localStorage.removeItem('nelitv_last_phone');
    sessionStorage.clear();
  } catch {}
}
