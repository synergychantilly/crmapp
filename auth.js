import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDcz3F4mbJ87PiNuiOBx8QwDNHTeAIEefM",
  authDomain: "minicrm-4ae44.firebaseapp.com",
  projectId: "minicrm-4ae44",
  storageBucket: "minicrm-4ae44.firebasestorage.app",
  messagingSenderId: "572080501512",
  appId: "1:572080501512:web:0040edf973e4e7a57d72bd",
  measurementId: "G-J0QCX0WVSD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');
const emailValidation = document.getElementById('emailValidation');

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Real-time email validation
emailInput.addEventListener('input', validateEmail);

function validateEmail() {
    const email = emailInput.value.trim();
    if (!email) {
        clearValidation();
        return;
    }
    
    if (emailRegex.test(email)) {
        emailInput.classList.add('valid');
        emailInput.classList.remove('invalid');
        emailValidation.textContent = 'Valid email format';
        emailValidation.classList.add('valid');
        emailValidation.classList.remove('invalid');
    } else {
        emailInput.classList.add('invalid');
        emailInput.classList.remove('valid');
        emailValidation.textContent = 'Invalid email format';
        emailValidation.classList.add('invalid');
        emailValidation.classList.remove('valid');
    }
}

function clearValidation() {
    emailInput.classList.remove('valid', 'invalid');
    emailValidation.classList.remove('valid', 'invalid');
    emailValidation.textContent = '';
}

// Form Submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const loading = document.getElementById('loadingIndicator');

    // Clear previous errors
    errorMessage.classList.remove('visible');
    clearValidation();

    // Frontend validation
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    if (!emailRegex.test(email)) {
        emailInput.classList.add('invalid');
        emailValidation.textContent = 'Please enter a valid email';
        emailValidation.classList.add('invalid');
        return;
    }

    loading.classList.add('visible');

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Only set session storage here
        sessionStorage.setItem('firebaseAuth', 'true');
        window.location.href = 'crm/crm.html';

    } catch (error) {
        handleAuthError(error);
        passwordInput.value = '';
    } finally {
        loading.classList.remove('visible');
    }
});

function handleAuthError(error) {
    let message = 'Authentication failed. Please try again.';
    switch(error.code) {
        case 'auth/invalid-email':
            message = 'Invalid email address';
            break;
        case 'auth/user-disabled':
            message = 'Account disabled';
            break;
        case 'auth/user-not-found':
            message = 'No account found with this email';
            break;
        case 'auth/wrong-password':
            message = 'Incorrect password';
            break;
        case 'auth/too-many-requests':
            message = 'Too many attempts. Try again later';
            break;
    }
    showError(message);
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('visible');
    setTimeout(() => {
        errorMessage.classList.remove('visible');
    }, 5000);
}