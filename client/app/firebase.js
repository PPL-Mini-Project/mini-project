// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCt93KlJ5wvNdX4-WmsOIDyhxwgCSvRajk",
  authDomain: "mini-project-11563.firebaseapp.com",
  projectId: "mini-project-11563",
  storageBucket: "mini-project-11563.appspot.com",
  messagingSenderId: "370263027499",
  appId: "1:370263027499:web:3bbe0e27f80c18c74f1f6e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
export default app;