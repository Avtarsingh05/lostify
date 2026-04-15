'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch((error) => {
    errorEmitter.emit('auth-error', error);
  });
}

/** Initiate email/password sign-up (non-blocking) with optional display name. */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, displayName?: string): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(async (userCredential) => {
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
    })
    .catch((error) => {
      errorEmitter.emit('auth-error', error);
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password).catch((error) => {
    errorEmitter.emit('auth-error', error);
  });
}
