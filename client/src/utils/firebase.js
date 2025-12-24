import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const apiKey = import.meta.env.VITE_API_KEY_FIREBASE;
const appId = import.meta.env.VITE_APP_ID;
const messagingSenderId = import.meta.env.VITE_MESSAGE_SENDER_ID

  const firebaseConfig = {
    apiKey,
    authDomain: "brandbite-bb43a.firebaseapp.com",
    projectId: "brandbite-bb43a",
    storageBucket: "brandbite-bb43a.firebasestorage.app",
    messagingSenderId,
    appId,
    measurementId: "G-30HPP8HZJD"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);


