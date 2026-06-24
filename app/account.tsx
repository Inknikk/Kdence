import { useState, useEffect } from 'react'
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../src/theme'
import { Button, PressableScale } from '../src/components/ui'
import { signUp, signIn, signOutUser, listenToAuthChanges, saveAuthState, clearAuthState, getAuthState } from '../src/services/firebase'
import { exportLocalData, importRemoteData, type SyncPayload } from '../src/services/cloudSync'
import { impactLight } from '../src/services/haptics'

export default function AccountScreen() {
  const router = useRouter()
  const { colors, spacing } = useTheme()
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    getAuthState().then(state => {
      if (state) setLastSync(new Date(state.signedInAt).toLocaleDateString())
    })
    const unsub = listenToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email ?? '' })
        await saveAuthState(firebaseUser.uid, firebaseUser.email ?? '')
      } else {
        setUser(null)
        await clearAuthState()
      }
    })
    return unsub
  }, [])

  async function handleSignUp() {
    if (!email.trim() || !password.trim()) { Alert.alert('Required', 'Enter email and password'); return }
    if (password.length < 6) { Alert.alert('Weak password', 'Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await signUp(email.trim(), password)
      impactLight()
      Alert.alert('Signed up', 'Account created! Your data will sync automatically.')
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) { Alert.alert('Required', 'Enter email and password'); return }
    setLoading(true)
    try {
      await signIn(email.trim(), password)
      impactLight()
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await signOutUser()
    setEmail('')
    setPassword('')
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const data = await exportLocalData()
      await saveAuthState(user!.uid, user!.email)
      const response = await fetch(`https://kdence-sync.web.app/data/${user!.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Sync upload failed')
      setLastSync(new Date().toLocaleString())
      impactLight()
      Alert.alert('Synced', 'Data uploaded to cloud')
    } catch (e: any) {
      Alert.alert('Sync failed', e.message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.xl, paddingTop: spacing.md }]}>
        <PressableScale onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </PressableScale>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: 20 }}>
        {user ? (
          <>
            <View style={[styles.profileCard, { backgroundColor: colors.surface.secondary }]}>
              <View style={[styles.avatar, { backgroundColor: colors.accent.primary + '30' }]}>
                <Text style={[styles.avatarText, { color: colors.accent.primary }]}>
                  {user.email[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.email, { color: colors.text.primary }]}>{user.email}</Text>
                <Text style={[styles.uid, { color: colors.text.tertiary }]}>
                  {user.uid.slice(0, 12)}...
                </Text>
              </View>
            </View>

            <View style={[styles.syncCard, { backgroundColor: colors.surface.secondary }]}>
              <View style={styles.syncRow}>
                <Ionicons name="cloud-done-outline" size={22} color={colors.semantic.success} />
                <Text style={[styles.syncLabel, { color: colors.text.primary }]}>Cloud Sync</Text>
              </View>
              <Text style={[styles.syncStatus, { color: colors.text.tertiary }]}>
                {lastSync ? `Last synced: ${lastSync}` : 'Not synced yet'}
              </Text>
              <Button
                title={syncing ? 'Syncing...' : 'Sync Now'}
                onPress={handleSync}
                variant="primary"
                size="sm"
                disabled={syncing}
                style={{ marginTop: 12 }}
              />
            </View>

            <Button
              title="Sign Out"
              onPress={handleSignOut}
              variant="secondary"
              size="md"
            />
          </>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
              Sign in to enable cloud sync
            </Text>

            <View>
              <Text style={[styles.label, { color: colors.text.secondary }]}>Email</Text>
              <TextInput
                placeholder="you@example.com"
                placeholderTextColor={colors.text.tertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                style={[styles.input, { color: colors.text.primary, backgroundColor: colors.surface.secondary }]}
              />
            </View>

            <View>
              <Text style={[styles.label, { color: colors.text.secondary }]}>Password</Text>
              <TextInput
                placeholder="Your password"
                placeholderTextColor={colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={[styles.input, { color: colors.text.primary, backgroundColor: colors.surface.secondary }]}
              />
            </View>

            {loading ? (
              <ActivityIndicator color={colors.accent.primary} size="small" />
            ) : (
              <View style={{ gap: 12 }}>
                <Button title="Sign In" onPress={handleSignIn} variant="primary" size="md" />
                <Button title="Create Account" onPress={handleSignUp} variant="ghost" size="md" />
              </View>
            )}

            <Text style={[styles.disclaimer, { color: colors.text.tertiary }]}>
              Your data is encrypted in transit and at rest. We only store your focus data.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '500', textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { fontSize: 16, padding: 14, borderRadius: 12, fontWeight: '500' },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 18, borderRadius: 16,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700' },
  email: { fontSize: 16, fontWeight: '600' },
  uid: { fontSize: 12, marginTop: 2 },
  syncCard: { padding: 18, borderRadius: 16 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncLabel: { fontSize: 15, fontWeight: '600' },
  syncStatus: { fontSize: 12, marginTop: 4 },
  disclaimer: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
})
