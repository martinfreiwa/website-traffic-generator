
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxhDxNIO-Svce0yRajiWPT0Xw22IwPBvE",
  authDomain: "traffic-websites.firebaseapp.com",
  projectId: "traffic-websites",
  storageBucket: "traffic-websites.firebasestorage.app",
  messagingSenderId: "617379565314",
  appId: "1:617379565314:web:8f9ce22c31b2548cc4bc1b",
  measurementId: "G-SWTXXWP99R"
};

// Initialize Firebase
let auth: any, firestore: any, analytics: any;

try {
    const app = firebase.initializeApp(firebaseConfig);
    auth = app.auth();
    firestore = app.firestore();
    analytics = app.analytics();
} catch (e) {
    console.error("Firebase init failed", e);
}

export { auth, firestore, analytics };
