// Firebase Configuration - Updated with new credentials
const firebaseConfig = {
  apiKey: "AIzaSyD0fEAS-uL8tklmBNzLMrBHZ3Hh5cK21mM",
  authDomain: "orange-fast.firebaseapp.com",
  databaseURL: "https://orange-fast-default-rtdb.firebaseio.com",
  projectId: "orange-fast",
  storageBucket: "orange-fast.appspot.com",
  messagingSenderId: "816303515640",
  appId: "1:816303515640:web:fb1356d7b9e6cd60d3580d",
  measurementId: "G-5M2Z7DSHM0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Admin user configuration
const ADMIN_EMAIL = "danielintheend@gmail.com"; // Using admin user for testing

// Export for use in other modules
window.firebaseServices = {
    auth,
    database,
    storage,
    ADMIN_EMAIL
};

console.log("Firebase initialized successfully with new orange-fast config");

