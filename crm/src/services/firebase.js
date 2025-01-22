import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDcz3F4mbJ87PiNuiOBx8QwDNHTeAIEefM",
  authDomain: "minicrm-4ae44.firebaseapp.com",
  databaseURL: "https://minicrm-4ae44-default-rtdb.firebaseio.com",
  projectId: "minicrm-4ae44",
  storageBucket: "minicrm-4ae44.appspot.com",
  messagingSenderId: "572080501512",
  appId: "1:572080501512:web:0040edf973e4e7a57d72bd",
  measurementId: "G-J0QCX0WVSD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db };