'use client';

import { useEffect } from 'react';
import { useUser } from '@/firebase';

declare global {
  interface Window {
    OneSignal: any;
  }
}

export function OneSignalInitializer() {
  const { user } = useUser();

  useEffect(() => {
    window.OneSignal = window.OneSignal || [];
    
    window.OneSignal.push(() => {
      window.OneSignal.init({
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "",
        safari_web_id: "",
        notifyButton: {
          enable: false,
        },
        allowLocalhostAsSecureOrigin: true,
      });
    });
  }, []);

  useEffect(() => {
    if (user && window.OneSignal) {
      window.OneSignal.push(() => {
        // Link the Firebase UID as the OneSignal External User ID
        window.OneSignal.login(user.uid);
        console.log("OneSignal: User logged in as", user.uid);
      });
    }
  }, [user]);

  return null;
}
