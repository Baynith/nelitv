import { UserProfile, isUserSubscribed } from './firebase';

// Global Trial Manager: each registered account gets 1 minute (60s) free trial
const TRIAL_KEY = 'nelitv_trial_seconds_left';
const EXPIRED_KEY = 'nelitv_trial_expired';
const DISMISSED_KEY = 'nelitv_user_dismissed_payment';
const INITIAL_TRIAL_SECONDS = 60;

// In-memory cache of account trials
const accountTrials = new Map<string, { secondsLeft: number; isExpired: boolean }>();

export function getUserIdentifier(user: UserProfile | null): string {
  if (!user) return 'guest';
  if (user.phone) return user.phone;
  if (user.uid.startsWith('tz_phone_')) return user.uid.replace('tz_phone_', '');
  return user.uid;
}

export async function fetchAccountTrial(user: UserProfile | null): Promise<number> {
  if (!user || isUserSubscribed(user)) return INITIAL_TRIAL_SECONDS;
  const id = getUserIdentifier(user);

  try {
    const res = await fetch(`/api/user/trial-status?phone=${encodeURIComponent(id)}`);
    const data = await res.json();
    if (data.success && typeof data.trialSecondsLeft === 'number') {
      accountTrials.set(id, {
        secondsLeft: data.trialSecondsLeft,
        isExpired: data.isExpired,
      });
      localStorage.setItem(`nelitv_trial_${id}`, data.trialSecondsLeft.toString());
      if (data.isExpired || data.trialSecondsLeft <= 0) {
        localStorage.setItem(`nelitv_expired_${id}`, 'true');
      }
      return data.trialSecondsLeft;
    }
  } catch {}

  const cached = localStorage.getItem(`nelitv_trial_${id}`);
  if (cached !== null) {
    return parseInt(cached, 10) || 0;
  }
  return INITIAL_TRIAL_SECONDS;
}

export function getUserTrialSecondsLeft(user: UserProfile | null): number {
  if (isUserSubscribed(user)) return INITIAL_TRIAL_SECONDS;
  const id = getUserIdentifier(user);

  if (id !== 'guest') {
    if (localStorage.getItem(`nelitv_expired_${id}`) === 'true') {
      return 0;
    }
    const mem = accountTrials.get(id);
    if (mem) return mem.secondsLeft;
    const saved = localStorage.getItem(`nelitv_trial_${id}`);
    if (saved !== null) {
      return Math.max(0, parseInt(saved, 10) || 0);
    }
    // Every registered account has a fresh 1-minute (60 seconds) offer
    return INITIAL_TRIAL_SECONDS;
  }

  return getTrialSecondsLeft();
}

export function isUserTrialExpired(user: UserProfile | null): boolean {
  if (isUserSubscribed(user)) return false;
  const id = getUserIdentifier(user);

  if (id !== 'guest') {
    if (localStorage.getItem(`nelitv_expired_${id}`) === 'true') {
      return true;
    }
    const mem = accountTrials.get(id);
    if (mem) return mem.isExpired || mem.secondsLeft <= 0;
    const saved = localStorage.getItem(`nelitv_trial_${id}`);
    if (saved !== null) {
      return (parseInt(saved, 10) || 0) <= 0;
    }
    return false; // new registered user has 60 seconds trial!
  }

  return isGlobalTrialExpired();
}

export function decrementUserTrialSeconds(user: UserProfile | null): number {
  if (isUserSubscribed(user)) return INITIAL_TRIAL_SECONDS;
  const id = getUserIdentifier(user);

  if (id !== 'guest') {
    const current = getUserTrialSecondsLeft(user);
    const next = Math.max(0, current - 1);
    localStorage.setItem(`nelitv_trial_${id}`, next.toString());
    accountTrials.set(id, { secondsLeft: next, isExpired: next <= 0 });

    if (next <= 0) {
      localStorage.setItem(`nelitv_expired_${id}`, 'true');
    }

    if (next % 5 === 0 || next === 0) {
      fetch('/api/user/trial-consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: id, seconds: 5 }),
      }).catch(() => {});
    }

    return next;
  }

  return decrementTrialSeconds();
}

export function markUserTrialExpired(user: UserProfile | null): void {
  const id = getUserIdentifier(user);
  if (id !== 'guest') {
    localStorage.setItem(`nelitv_expired_${id}`, 'true');
    localStorage.setItem(`nelitv_trial_${id}`, '0');
    accountTrials.set(id, { secondsLeft: 0, isExpired: true });
    fetch('/api/user/trial-consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: id, seconds: 60 }),
    }).catch(() => {});
  }
  setTrialExpired();
}

export function setUserDismissedPaymentModal(dismissed: boolean): void {
  if (dismissed) {
    sessionStorage.setItem(DISMISSED_KEY, 'true');
  } else {
    sessionStorage.removeItem(DISMISSED_KEY);
  }
}

export function hasUserDismissedPaymentModal(): boolean {
  return sessionStorage.getItem(DISMISSED_KEY) === 'true';
}

export function getTrialSecondsLeft(): number {
  if (localStorage.getItem(EXPIRED_KEY) === 'true') {
    return 0;
  }
  const saved = localStorage.getItem(TRIAL_KEY);
  if (saved !== null) {
    const parsed = parseInt(saved, 10);
    if (!isNaN(parsed)) {
      return Math.max(0, parsed);
    }
  }
  return INITIAL_TRIAL_SECONDS;
}

export function isGlobalTrialExpired(): boolean {
  try {
    const cachedProfile = localStorage.getItem('nelitv_user_profile') || localStorage.getItem('nelistream_user_profile');
    if (cachedProfile) {
      const p = JSON.parse(cachedProfile);
      if (p.role === 'admin' || p.subscription?.status === 'lifetime') {
        return false;
      }
      if (p.subscription?.status === 'active' && p.subscription?.expiresAt && Date.now() < p.subscription.expiresAt) {
        return false;
      }
    }
  } catch {}

  return localStorage.getItem(EXPIRED_KEY) === 'true' || getTrialSecondsLeft() <= 0;
}

export function decrementTrialSeconds(): number {
  const current = getTrialSecondsLeft();
  const next = Math.max(0, current - 1);
  localStorage.setItem(TRIAL_KEY, next.toString());
  if (next <= 0) {
    localStorage.setItem(EXPIRED_KEY, 'true');
  }
  return next;
}

export function setTrialExpired(): void {
  localStorage.setItem(EXPIRED_KEY, 'true');
  localStorage.setItem(TRIAL_KEY, '0');
}

export function resetTrial(): void {
  localStorage.removeItem(EXPIRED_KEY);
  localStorage.setItem(TRIAL_KEY, INITIAL_TRIAL_SECONDS.toString());
}
