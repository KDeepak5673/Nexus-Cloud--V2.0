import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthChange, logout, signInWithGoogle, signupWithEmail, loginWithEmail } from './firebase'
import { registerUser } from '../lib/api'

const AuthContext = createContext({ user: null })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen for auth changes
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Register/update user in database
        try {
          const userData = {
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            provider: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email'
          }

          console.log('Registering user in database:', userData)
          const response = await registerUser(userData)

          if (response.status === 'success') {
            console.log('User registered/updated successfully:', response.data.user)
          } else {
            console.error('Failed to register user:', response)
          }
        } catch (error) {
          console.error('Error registering user in database:', error)
        }
      }

      setUser(firebaseUser)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const customSignInWithGoogle = async () => {
    try {
      const user = await signInWithGoogle()
      console.log('Google sign-in successful:', user)
      return user
    } catch (error) {
      console.error('Google sign-in failed:', error)
      throw error
    }
  }

  const customSignupWithEmail = async (email, password) => {
    try {
      const user = await signupWithEmail(email, password)
      console.log('Email signup successful:', user)
      return user
    } catch (error) {
      console.error('Email signup failed:', error)
      throw error
    }
  }

  const customLoginWithEmail = async (email, password) => {
    try {
      const user = await loginWithEmail(email, password)
      console.log('Email login successful:', user)
      return user
    } catch (error) {
      console.error('Email login failed:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signInWithGoogle: customSignInWithGoogle,
    signupWithEmail: customSignupWithEmail,
    loginWithEmail: customLoginWithEmail,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}