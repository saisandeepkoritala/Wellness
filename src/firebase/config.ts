import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// Replace these values with your actual Firebase project config from Firebase Console
const firebaseConfig = {
apiKey: "AIzaSyB7JyU3N3Sn1QhknjV4o32FmOXi0IMHo3E",
authDomain: "user-auth-13b30.firebaseapp.com",
projectId: "user-auth-13b30",
storageBucket: "user-auth-13b30.appspot.com",
messagingSenderId: "311406493546",
appId: "1:311406493546:web:16834000ca42a8cfbb6f13"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
