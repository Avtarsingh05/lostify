
'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch((error) => {
    errorEmitter.emit('auth-error', error);
  });
}

/** Initiate email/password sign-up (non-blocking) with optional display name and Firestore sync. */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, displayName?: string): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      
      // 1. Update Auth Profile
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // 2. Sync to Firestore 'users' collection so Admin can see them
      const db = getFirestore(user.app);
      const userRef = doc(db, "users", user.uid);
      
      // We use setDoc to explicitly create the document and thus the collection (container)
      setDoc(userRef, {
        id: user.uid,
        username: displayName || email.split('@')[0],
        email: email,
        role: "USER",
        photoURL: user.photoURL || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch((e) => {
        console.error("Firestore sync error during signup:", e);
      });
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
