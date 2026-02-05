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
  updateProfile,
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
const googleProvider = new GoogleAuthProvider()

// Helper function to get user-friendly error messages
export function getFriendlyErrorMessage(error) {
  const errorCode = error.code || ''
  
  const errorMessages = {
    // Auth errors
    'auth/email-already-in-use': 'This email is already registered. Please try logging in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
    'auth/weak-password': 'Password should be at least 6 characters long.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
    'auth/popup-blocked': 'Pop-up was blocked by your browser. Please allow pop-ups for this site.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in method.',
    'auth/invalid-phone-number': 'Invalid phone number. Please enter a valid phone number.',
    'auth/missing-phone-number': 'Please enter a phone number.',
    'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
    'auth/captcha-check-failed': 'reCAPTCHA verification failed. Please try again.',
    'auth/invalid-verification-code': 'Invalid verification code. Please try again.',
    'auth/invalid-verification-id': 'Verification session expired. Please request a new code.',
    'auth/code-expired': 'Verification code has expired. Please request a new code.',
    'auth/missing-verification-code': 'Please enter the verification code.',
    // GitHub specific
    'auth/github-email-already-in-use': 'Email from GitHub is already in use with another account.',
  }
  
  return errorMessages[errorCode] || error.message || 'An unexpected error occurred. Please try again.'
}

// Sign in with Google
export async function signInWithGoogle() {
  try {
    const res = await signInWithPopup(auth, googleProvider)
    return res.user
  } catch (err) {
    console.error('Google sign-in failed', err)
    const friendlyError = new Error(getFriendlyErrorMessage(err))
    friendlyError.code = err.code
    throw friendlyError
  }
}

// Email/password signup with profile update
export async function signupWithEmail(email, password, displayName = null, photoURL = null) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    
    // Update profile if displayName or photoURL provided
    if (displayName || photoURL) {
      const updates = {}
      if (displayName) updates.displayName = displayName
      if (photoURL) updates.photoURL = photoURL
      
      await updateProfile(cred.user, updates)
      // Reload to get updated user
      await cred.user.reload()
    }
    
    return auth.currentUser || cred.user
  } catch (err) {
    console.error('Email signup failed', err)
    const friendlyError = new Error(getFriendlyErrorMessage(err))
    friendlyError.code = err.code
    throw friendlyError
  }
}

// Update user profile
export async function updateUserProfile(updates) {
  try {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in')
    }
    
    await updateProfile(auth.currentUser, updates)
    await auth.currentUser.reload()
    return auth.currentUser
  } catch (err) {
    console.error('Profile update failed', err)
    const friendlyError = new Error(getFriendlyErrorMessage(err))
    friendlyError.code = err.code
    throw friendlyError
  }
}

// Email/password login
export async function loginWithEmail(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  } catch (err) {
    console.error('Email login failed', err)
    const friendlyError = new Error(getFriendlyErrorMessage(err))
    friendlyError.code = err.code
    throw friendlyError
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