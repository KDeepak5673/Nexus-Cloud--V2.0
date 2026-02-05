// Firebase Auth helpers (Google + Email/Password)
// Use the single initialized Firebase app from src/firebase-config.js
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import app from '../firebase-config'

// App is initialized in src/firebase-config.js; avoid initializing twice
if (typeof window !== 'undefined') {
  try {
    // Log origin and basic app options for debugging configuration issues
    // Safe to log: apiKey partially masked
    const opts = app && app.options ? app.options : {}
    const maskedKey = typeof opts.apiKey === 'string' ? opts.apiKey.slice(0, 8) + '...' : undefined
    console.info('[Auth Debug] origin:', window.location.origin)
    console.info('[Auth Debug] projectId:', opts.projectId)
    console.info('[Auth Debug] authDomain:', opts.authDomain)
    console.info('[Auth Debug] apiKey:', maskedKey)
  } catch (_) {
    // no-op
  }
}

// Auth objects
export const auth = getAuth(app)
const provider = new GoogleAuthProvider()

// Sign in with Google
export async function signInWithGoogle() {
  try {
    const res = await signInWithPopup(auth, provider)
    return res.user
  } catch (err) {
    console.error('Google sign-in failed', err)
    throw err
  }
}

// Email/password signup
export async function signupWithEmail(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    return cred.user
  } catch (err) {
    console.error('Email signup failed', err)
    throw err
  }
}

// Email/password login
export async function loginWithEmail(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  } catch (err) {
    console.error('Email login failed', err)
    throw err
  }
}

// Sign out
export function logout() {
  return signOut(auth)
}

// Subscribe to auth state
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}