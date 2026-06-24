import { initializeApp, getApps } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
}

let app: ReturnType<typeof initializeApp> | null = null

function getApp() {
  if (!app && !getApps().length) {
    app = initializeApp(firebaseConfig)
  }
  return app ?? getApps()[0]
}

export function getFirebaseAuth() {
  return getAuth(getApp())
}

export async function signUp(email: string, password: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
  return result.user
}

export async function signIn(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
  return result.user
}

export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth())
}

export function listenToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), callback)
}

const AUTH_KEY = '@kdence:auth_state'

export async function saveAuthState(userId: string, email: string): Promise<void> {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ userId, email, signedInAt: Date.now() }))
}

export async function clearAuthState(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_KEY)
}

export async function getAuthState(): Promise<{ userId: string; email: string; signedInAt: number } | null> {
  const data = await AsyncStorage.getItem(AUTH_KEY)
  return data ? JSON.parse(data) : null
}
