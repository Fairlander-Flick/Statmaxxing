import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, globalStyles } from '../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

type StatProps = {
  label: string;
  value: number;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

function StatCard({ label, value, color, icon }: StatProps) {
  return (
    <View style={[styles.statCard, { borderColor: color + '44' }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
        <Text style={globalStyles.screenTitle}>Statmaxxing</Text>
        <Text style={globalStyles.screenSub}>Your gamified life dashboard</Text>

        {/* Level Bar */}
        <View style={globalStyles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 15 }}>Level 1</Text>
            <Text style={{ color: COLORS.textSub, fontSize: 13 }}>0 / 1000 XP</Text>
          </View>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: '0%' }]} />
          </View>
        </View>

        {/* Core Stats */}
        <Text style={globalStyles.sectionTitle}>Core Attributes</Text>
        <View style={styles.statsGrid}>
          <StatCard label="VIT" value={0} color={COLORS.vit} icon="heart" />
          <StatCard label="STR" value={0} color={COLORS.str} icon="barbell" />
          <StatCard label="FOC" value={0} color={COLORS.foc} icon="flashlight" />
          <StatCard label="ART" value={0} color={COLORS.art} icon="color-palette" />
          <StatCard label="SOC" value={0} color={COLORS.soc} icon="people" />
          <StatCard label="DIS" value={0} color={COLORS.dis} icon="checkmark-circle" />
        </View>

        {/* Today's summary */}
        <Text style={globalStyles.sectionTitle}>Today</Text>
        <View style={globalStyles.card}>
          <Text style={{ color: COLORS.textSub, fontSize: 13, textAlign: 'center', paddingVertical: 16 }}>
            No logs yet today. Start tracking to earn XP!
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    width: '30.5%',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSub,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 1,
  },
  xpBarBg: {
    height: 8,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: COLORS.cyan,
    borderRadius: 4,
  },
});
