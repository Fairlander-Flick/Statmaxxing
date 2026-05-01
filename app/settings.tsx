import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, useEffect } from 'react';
import { useTheme, makeGlobalStyles } from '../lib/ThemeContext';
import { useLayout } from '../lib/useLayout';
import { saveData, loadData, KEYS } from '../lib/storage';
import { generateRandomData } from '../lib/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  label: string;
  subLabel?: string;
  rightContent?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  danger?: boolean;
};

function SettingRow({ icon, iconColor, label, subLabel, rightContent, onPress, isLast, danger }: SettingRowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[s.settingRow, {
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
        backgroundColor: danger ? colors.red + '08' : 'transparent',
      }]}
    >
      <View style={[s.settingIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.settingLabel, { color: danger ? colors.red : colors.text }]}>{label}</Text>
        {subLabel ? <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>{subLabel}</Text> : null}
      </View>
      {rightContent ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={danger ? colors.red + '80' : colors.textMuted} /> : null)}
    </TouchableOpacity>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[s.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const layout = useLayout();
  const gs = makeGlobalStyles(colors);

  const [waterGoal, setWaterGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mockPeriod, setMockPeriod] = useState<number>(30);

  const mockPeriods = [
    { value: 7, label: '7D' }, { value: 14, label: '14D' },
    { value: 30, label: '1M' }, { value: 365, label: '1Y' },
    { value: 1825, label: '5Y' }, { value: 3650, label: '10Y' },
  ];

  useEffect(() => {
    loadData<number>(KEYS.waterGoal, 2500).then((val) => setWaterGoal(val.toString()));
  }, []);

  const handleSaveWaterGoal = async () => {
    const goal = parseInt(waterGoal);
    if (!isNaN(goal) && goal > 0) await saveData(KEYS.waterGoal, goal);
  };

  const handleGenerateMockData = async () => {
    setIsGenerating(true);
    try {
      await generateRandomData(mockPeriod);
      if (Platform.OS === 'web') {
        window.alert(`Mock data generated for the last ${mockPeriod} days! Navigate across tabs to refresh.`);
      } else {
        Alert.alert('✅ Done', `Mock data generated for the last ${mockPeriod} days!`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const doDeleteAllLogs = async () => {
    const logKeys = [
      KEYS.sleepLogs, KEYS.waterLogs, KEYS.weightLogs,
      KEYS.nutritionLogs, KEYS.workoutLogs, KEYS.stepLogs,
      KEYS.mindLogs, KEYS.socialLogs,
    ];
    for (const key of logKeys) await AsyncStorage.removeItem(key);
  };

  const handleClearAllData = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        '⚠️ All log data will be permanently deleted (sleep, water, weight, workouts, focus, social).\nPrograms, contacts and food library are preserved.\n\nAre you sure?'
      );
      if (confirmed) { await doDeleteAllLogs(); window.alert('✅ All log data deleted.'); }
    } else {
      Alert.alert(
        '⚠️ Clear All Data',
        'All log data will be permanently deleted. Programs and food library are preserved.\n\nThis cannot be undone!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: async () => { await doDeleteAllLogs(); Alert.alert('Done', 'All log data has been deleted.'); } },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* ── Header ── */}
      <View style={[s.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[s.headerSub, { color: colors.textMuted }]}>TECHNICAL ATHLETE</Text>
          <Text style={[s.headerTitle, { color: colors.text }]}>Settings</Text>
        </View>
        <View style={[s.versionBadge, { backgroundColor: colors.accentDim, borderColor: colors.border }]}>
          <Text style={[s.versionBadgeText, { color: colors.accent }]}>v1.0</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: layout.hPadding, maxWidth: layout.maxWidth, alignSelf: 'center', width: '100%', paddingTop: 20 }}>

          {/* ── Profile Card ── */}
          <View style={[s.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[s.profileAvatar, { backgroundColor: colors.accent + '20', borderColor: colors.accent + '40' }]}>
              <Ionicons name="person" size={32} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.profileName, { color: colors.text }]}>Athlete</Text>
              <Text style={[s.profileSub, { color: colors.textMuted }]}>StatsEngine · Technical Athlete</Text>
            </View>
            <View style={[s.profileBadge, { backgroundColor: colors.accentDim }]}>
              <Text style={[s.profileBadgeText, { color: colors.accent }]}>ELITE</Text>
            </View>
          </View>

          {/* ── Appearance ── */}
          <Text style={[gs.sectionTitle, { marginTop: 8 }]}>Appearance</Text>
          <SectionCard>
            <SettingRow
              icon={isDark ? 'moon' : 'sunny'}
              iconColor={colors.accent}
              label="Theme"
              subLabel={isDark ? 'Dark Mode' : 'Light Mode'}
              rightContent={
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: colors.accent + '60' }}
                  thumbColor={isDark ? colors.accent : colors.textMuted}
                />
              }
              isLast
            />
          </SectionCard>

          {/* ── Preferences ── */}
          <Text style={[gs.sectionTitle, { marginTop: 8 }]}>Preferences</Text>
          <SectionCard>
            <View style={[s.settingRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={[s.settingIcon, { backgroundColor: colors.foc + '20' }]}>
                <Ionicons name="water" size={18} color={colors.foc} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settingLabel, { color: colors.text }]}>Daily Water Goal</Text>
                <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>ml per day</Text>
              </View>
              <TextInput
                style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                value={waterGoal}
                onChangeText={setWaterGoal}
                onBlur={handleSaveWaterGoal}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>
            <SettingRow
              icon="scale-outline"
              iconColor={colors.textMuted}
              label="Units"
              subLabel="Metric (kg, ml, km)"
              isLast
            />
          </SectionCard>

          {/* ── Mock Data Generator ── */}
          <Text style={[gs.sectionTitle, { marginTop: 8 }]}>Developer Tools</Text>
          <SectionCard>
            <View style={[s.settingRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={[s.settingIcon, { backgroundColor: colors.soc + '20' }]}>
                <Ionicons name="flask-outline" size={18} color={colors.soc} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settingLabel, { color: colors.text }]}>Mock Data Period</Text>
                <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>Data to generate</Text>
              </View>
            </View>
            <View style={s.periodRow}>
              {mockPeriods.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => setMockPeriod(p.value)}
                  style={[s.periodChip, {
                    backgroundColor: mockPeriod === p.value ? colors.soc + '20' : colors.surfaceAlt,
                    borderColor: mockPeriod === p.value ? colors.soc : colors.border,
                  }]}
                >
                  <Text style={[s.periodChipText, { color: mockPeriod === p.value ? colors.soc : colors.textSub }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[s.settingRow, {
                borderBottomWidth: 0,
                backgroundColor: colors.soc + '10',
                opacity: isGenerating ? 0.6 : 1,
              }]}
              onPress={handleGenerateMockData}
              disabled={isGenerating}
            >
              <View style={[s.settingIcon, { backgroundColor: colors.soc + '20' }]}>
                <Ionicons name={isGenerating ? 'hourglass' : 'refresh'} size={18} color={colors.soc} />
              </View>
              <Text style={[s.settingLabel, { color: colors.soc }]}>
                {isGenerating ? 'Generating...' : `Generate ${mockPeriod}-Day Mock Data`}
              </Text>
              {!isGenerating && <Ionicons name="play-circle" size={20} color={colors.soc} />}
            </TouchableOpacity>
          </SectionCard>

          {/* ── Data Management ── */}
          <Text style={[gs.sectionTitle, { marginTop: 8 }]}>Data Management</Text>
          <SectionCard>
            <SettingRow
              icon="share-outline"
              iconColor={colors.accent}
              label="Export Data"
              subLabel="Download all your stats"
              isLast={false}
            />
            <SettingRow
              icon="trash"
              iconColor={colors.red}
              label="Clear All Log Data"
              subLabel="Sleep, water, workouts, focus — Programs preserved"
              onPress={handleClearAllData}
              danger
              isLast
            />
          </SectionCard>

          {/* ── About ── */}
          <Text style={[gs.sectionTitle, { marginTop: 8 }]}>About</Text>
          <SectionCard>
            <SettingRow
              icon="information-circle-outline"
              iconColor={colors.accent}
              label="Version"
              subLabel="StatsEngine v1.0.0"
              isLast={false}
            />
            <SettingRow
              icon="trophy-outline"
              iconColor={colors.yellow}
              label="StatsEngine"
              subLabel="Gamified life tracker · RPG for real life"
              isLast
            />
          </SectionCard>

          {/* Footer */}
          <Text style={[s.footer, { color: colors.textMuted }]}>
            Made with 💪{'\n'}StatsEngine · Technical Athlete Suite
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerSub: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  versionBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  versionBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20,
  },
  profileAvatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  profileName: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  profileSub: { fontSize: 12, fontWeight: '400', marginTop: 2 },
  profileBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  profileBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  sectionCard: {
    borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 14,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
  },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 14, fontWeight: '600' },
  settingSubLabel: { fontSize: 12, fontWeight: '300', marginTop: 1 },
  inlineInput: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1,
    fontSize: 14, fontWeight: '600', minWidth: 80, textAlign: 'center',
  },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
  periodChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  periodChipText: { fontSize: 12, fontWeight: '700' },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 24, lineHeight: 20 },
});
