import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../src/theme'
import { Button, PressableScale } from '../src/components/ui'
import { getOfferings, purchasePackage, restorePurchases } from '../src/services/subscriptions'
import { impactLight } from '../src/services/haptics'

const FEATURES = [
  { icon: 'layers', name: 'Unlimited Templates', desc: 'Save and reuse session setups' },
  { icon: 'library', name: 'Full Task Library', desc: 'Access all 24+ curated presets' },
  { icon: 'stats-chart', name: 'Advanced Stats', desc: 'Monthly trends, streaks, insights' },
  { icon: 'cloud-done', name: 'Cloud Sync', desc: 'Backup and restore across devices' },
  { icon: 'timer', name: 'Extended Sessions', desc: 'Tasks up to 4 hours' },
  { icon: 'color-palette', name: 'Theme Options', desc: 'Custom accent colors' },
]

export default function PaywallScreen() {
  const router = useRouter()
  const { colors, spacing } = useTheme()
  const [offering, setOffering] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    loadOfferings()
  }, [])

  async function loadOfferings() {
    setLoading(true)
    const current = await getOfferings()
    setOffering(current)
    setLoading(false)
  }

  async function handlePurchase() {
    if (!offering?.availablePackages?.length) {
      Alert.alert('No products', 'No purchase options available. Check your network.')
      return
    }
    setPurchasing(true)
    try {
      const success = await purchasePackage(offering.availablePackages[0])
      if (success) {
        impactLight()
        Alert.alert('Welcome to Premium!', 'All features are now unlocked.', [
          { text: 'Great!', onPress: () => router.back() }
        ])
      } else {
        Alert.alert('Purchase failed', 'The purchase did not complete. Please try again.')
      }
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setPurchasing(false)
    }
  }

  async function handleRestore() {
    setPurchasing(true)
    try {
      const restored = await restorePurchases()
      if (restored) {
        Alert.alert('Restored', 'Your purchases have been restored!', [
          { text: 'OK', onPress: () => router.back() }
        ])
      } else {
        Alert.alert('Nothing to restore', 'No previous purchases found.')
      }
    } catch (e: any) {
      Alert.alert('Restore failed', e.message)
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg.primary }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.xl, paddingTop: spacing.md }]}>
        <PressableScale onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={colors.text.secondary} />
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.hero, { paddingHorizontal: spacing.xl }]}>
          <View style={[styles.crownWrap, { backgroundColor: colors.semantic.warning + '20' }]}>
            <Ionicons name="diamond" size={40} color={colors.semantic.warning} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text.primary }]}>Kdence Premium</Text>
          <Text style={[styles.heroSub, { color: colors.text.secondary }]}>
            Unlock the full focus experience
          </Text>
        </View>

        <View style={[styles.featuresWrap, { paddingHorizontal: spacing.xl }]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, { backgroundColor: colors.surface.secondary }]}>
              <View style={[styles.featureIcon, { backgroundColor: colors.accent.primary + '20' }]}>
                <Ionicons name={f.icon as any} size={20} color={colors.accent.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureName, { color: colors.text.primary }]}>{f.name}</Text>
                <Text style={[styles.featureDesc, { color: colors.text.tertiary }]}>{f.desc}</Text>
              </View>
              <Ionicons name="sparkles" size={16} color={colors.semantic.warning} />
            </View>
          ))}
        </View>

        <View style={[styles.pricingSection, { paddingHorizontal: spacing.xl }]}>
          {loading ? (
            <ActivityIndicator color={colors.accent.primary} size="small" />
          ) : offering?.availablePackages?.length ? (
            <Button
              title={purchasing ? 'Processing...' : `Subscribe — ${offering.availablePackages[0].product.priceString || 'See details'}`}
              onPress={handlePurchase}
              variant="primary"
              size="lg"
              disabled={purchasing}
            />
          ) : (
            <Text style={[styles.noOffer, { color: colors.text.tertiary }]}>
              No purchase options available
            </Text>
          )}
          <Button
            title="Restore Purchases"
            onPress={handleRestore}
            variant="ghost"
            size="sm"
            disabled={purchasing}
          />
          <Text style={[styles.disclaimer, { color: colors.text.tertiary }]}>
            Subscription auto-renews. Cancel anytime via App Store or Play Store settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'flex-end' },
  hero: { alignItems: 'center', gap: 12, paddingVertical: 32 },
  crownWrap: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  heroSub: { fontSize: 16, fontWeight: '500' },
  featuresWrap: { gap: 8, paddingBottom: 24 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 14,
  },
  featureIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  featureName: { fontSize: 15, fontWeight: '600' },
  featureDesc: { fontSize: 12, marginTop: 2 },
  pricingSection: { gap: 12, alignItems: 'center', paddingTop: 8 },
  noOffer: { fontSize: 14, textAlign: 'center' },
  disclaimer: { fontSize: 11, textAlign: 'center', lineHeight: 16, paddingTop: 8 },
})
