import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

export const initAuth = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) callback(user);
    else window.location.href = '../index.html';
  });
};

export const handleLogout = async () => {
  try {
    await signOut(auth);
    window.location.href = '../index.html';
  } catch (error) {
    console.error('Logout error:', error);
    alert('Logout failed. Please check console for details.');
  }
};