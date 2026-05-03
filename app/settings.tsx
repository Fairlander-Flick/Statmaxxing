import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, useEffect } from 'react';
import { useTheme, makeGlobalStyles } from '../lib/ThemeContext';
import { useLayout } from '../lib/useLayout';
import { KEYS, loadData, saveData, WeeklyGoals, DEFAULT_WEEKLY_GOALS } from '../lib/storage';
import { useGoals } from '../lib/useGoals';
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

  const [isGenerating, setIsGenerating] = useState(false);
  const [mockPeriod, setMockPeriod] = useState<number>(30);

  const mockPeriods = [
    { value: 7, label: '7D' }, { value: 14, label: '14D' },
    { value: 30, label: '1M' }, { value: 365, label: '1Y' },
    { value: 1825, label: '5Y' }, { value: 3650, label: '10Y' },
  ];

  const { goals, setGoal } = useGoals();

  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoals>(DEFAULT_WEEKLY_GOALS);
  const [weeklyGoalsDraft, setWeeklyGoalsDraft] = useState<WeeklyGoals>(DEFAULT_WEEKLY_GOALS);

  const [goalInputs, setGoalInputs] = useState({
    steps: '',
    sleepHours: '',
    waterMl: '',
    focusMinutes: '',
    weightTargetKg: '',
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
  });

  useEffect(() => {
    loadData<WeeklyGoals>(KEYS.weeklyGoals, DEFAULT_WEEKLY_GOALS).then(wg => {
      setWeeklyGoals(wg);
      setWeeklyGoalsDraft(wg);
    });
  }, []);

  useEffect(() => {
    setGoalInputs({
      steps: goals.steps.toString(),
      sleepHours: goals.sleepHours.toString(),
      waterMl: goals.waterMl.toString(),
      focusMinutes: goals.focusMinutes.toString(),
      weightTargetKg: goals.weightTargetKg !== null ? goals.weightTargetKg.toString() : '',
      calories: goals.calories.toString(),
      proteinG: goals.proteinG.toString(),
      carbsG: goals.carbsG.toString(),
      fatG: goals.fatG.toString(),
    });
  }, [goals.steps, goals.waterMl, goals.sleepHours, goals.focusMinutes,
      goals.weightTargetKg, goals.calories, goals.proteinG, goals.carbsG, goals.fatG]);

  const handleGoalInput = (key: keyof typeof goalInputs, val: string) => {
    setGoalInputs(prev => ({ ...prev, [key]: val }));
  };

  const handleGoalSave = (key: 'steps' | 'waterMl' | 'focusMinutes' | 'calories' | 'proteinG' | 'carbsG' | 'fatG') => {
    const parsed = parseInt(goalInputs[key]);
    if (!isNaN(parsed) && parsed >= 0) setGoal(key, parsed);
  };

  const handleGoalSaveFloat = (key: 'sleepHours') => {
    const parsed = parseFloat(goalInputs[key]);
    if (!isNaN(parsed) && parsed >= 0) setGoal(key, parsed);
  };

  const handleWeightTargetSave = () => {
    const raw = goalInputs.weightTargetKg;
    if (raw === '') { setGoal('weightTargetKg', null); return; }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) setGoal('weightTargetKg', parsed);
  };

  const clearWeightTarget = () => {
    setGoalInputs(prev => ({ ...prev, weightTargetKg: '' }));
    setGoal('weightTargetKg', null);
  };

  const saveWeeklyGoals = async () => {
    await saveData(KEYS.weeklyGoals, weeklyGoalsDraft);
    setWeeklyGoals(weeklyGoalsDraft);
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

          {/* ── Goals & Targets ── */}
          <Text style={[gs.sectionTitle, { marginTop: 8 }]}>Goals & Targets</Text>
          <SectionCard>
            {/* Steps */}
            <View style={[s.settingRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={[s.settingIcon, { backgroundColor: colors.str + '20' }]}>
                <Ionicons name="footsteps-outline" size={18} color={colors.str} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settingLabel, { color: colors.text }]}>Daily Steps</Text>
                <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>steps</Text>
              </View>
              <TextInput
                style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                value={goalInputs.steps}
                onChangeText={(v) => handleGoalInput('steps', v)}
                onBlur={() => handleGoalSave('steps')}
                onSubmitEditing={() => handleGoalSave('steps')}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>

            {/* Sleep */}
            <View style={[s.settingRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={[s.settingIcon, { backgroundColor: colors.art + '20' }]}>
                <Ionicons name="moon-outline" size={18} color={colors.art} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settingLabel, { color: colors.text }]}>Sleep Goal</Text>
                <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>h per night</Text>
              </View>
              <TextInput
                style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                value={goalInputs.sleepHours}
                onChangeText={(v) => handleGoalInput('sleepHours', v)}
                onBlur={() => handleGoalSaveFloat('sleepHours')}
                onSubmitEditing={() => handleGoalSaveFloat('sleepHours')}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
            </View>

            {/* Water */}
            <View style={[s.settingRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={[s.settingIcon, { backgroundColor: colors.vit + '20' }]}>
                <Ionicons name="water-outline" size={18} color={colors.vit} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settingLabel, { color: colors.text }]}>Water Goal</Text>
                <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>ml per day</Text>
              </View>
              <TextInput
                style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                value={goalInputs.waterMl}
                onChangeText={(v) => handleGoalInput('waterMl', v)}
                onBlur={() => handleGoalSave('waterMl')}
                onSubmitEditing={() => handleGoalSave('waterMl')}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>

            {/* Focus */}
            <View style={[s.settingRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={[s.settingIcon, { backgroundColor: colors.foc + '20' }]}>
                <Ionicons name="timer-outline" size={18} color={colors.foc} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settingLabel, { color: colors.text }]}>Focus Goal</Text>
                <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>min per day</Text>
              </View>
              <TextInput
                style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                value={goalInputs.focusMinutes}
                onChangeText={(v) => handleGoalInput('focusMinutes', v)}
                onBlur={() => handleGoalSave('focusMinutes')}
                onSubmitEditing={() => handleGoalSave('focusMinutes')}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>

            {/* Target Weight */}
            <View style={[s.settingRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={[s.settingIcon, { backgroundColor: colors.soc + '20' }]}>
                <Ionicons name="analytics-outline" size={18} color={colors.soc} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settingLabel, { color: colors.text }]}>Target Weight</Text>
                <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>kg — blank to hide line</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TextInput
                  style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                  value={goalInputs.weightTargetKg}
                  onChangeText={(v) => handleGoalInput('weightTargetKg', v)}
                  onBlur={handleWeightTargetSave}
                  onSubmitEditing={handleWeightTargetSave}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  placeholderTextColor={colors.textMuted}
                  selectTextOnFocus
                />
                {goals.weightTargetKg !== null && (
                  <TouchableOpacity onPress={clearWeightTarget}>
                    <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Nutrition sub-label */}
            <Text style={[s.settingSubLabel, { color: colors.textMuted, marginTop: 10, marginBottom: 2, paddingLeft: 14, fontWeight: '600', letterSpacing: 0.5 }]}>NUTRITION TARGETS</Text>

            {/* Calories */}
            <View style={[s.settingRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={[s.settingIcon, { backgroundColor: colors.dis + '20' }]}>
                <Ionicons name="flame-outline" size={18} color={colors.dis} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settingLabel, { color: colors.text }]}>Daily Calories</Text>
                <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>kcal</Text>
              </View>
              <TextInput
                style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                value={goalInputs.calories}
                onChangeText={(v) => handleGoalInput('calories', v)}
                onBlur={() => handleGoalSave('calories')}
                onSubmitEditing={() => handleGoalSave('calories')}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>

            {/* Protein */}
            <View style={[s.settingRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={[s.settingIcon, { backgroundColor: colors.foc + '20' }]}>
                <Ionicons name="barbell-outline" size={18} color={colors.foc} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settingLabel, { color: colors.text }]}>Protein</Text>
                <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>g per day</Text>
              </View>
              <TextInput
                style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                value={goalInputs.proteinG}
                onChangeText={(v) => handleGoalInput('proteinG', v)}
                onBlur={() => handleGoalSave('proteinG')}
                onSubmitEditing={() => handleGoalSave('proteinG')}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>

            {/* Carbs */}
            <View style={[s.settingRow, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={[s.settingIcon, { backgroundColor: colors.str + '20' }]}>
                <Ionicons name="nutrition-outline" size={18} color={colors.str} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settingLabel, { color: colors.text }]}>Carbs</Text>
                <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>g per day</Text>
              </View>
              <TextInput
                style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                value={goalInputs.carbsG}
                onChangeText={(v) => handleGoalInput('carbsG', v)}
                onBlur={() => handleGoalSave('carbsG')}
                onSubmitEditing={() => handleGoalSave('carbsG')}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>

            {/* Fat */}
            <View style={[s.settingRow, { borderBottomWidth: 0 }]}>
              <View style={[s.settingIcon, { backgroundColor: colors.art + '20' }]}>
                <Ionicons name="ellipse-outline" size={18} color={colors.art} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settingLabel, { color: colors.text }]}>Fat</Text>
                <Text style={[s.settingSubLabel, { color: colors.textMuted }]}>g per day</Text>
              </View>
              <TextInput
                style={[s.inlineInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                value={goalInputs.fatG}
                onChangeText={(v) => handleGoalInput('fatG', v)}
                onBlur={() => handleGoalSave('fatG')}
                onSubmitEditing={() => handleGoalSave('fatG')}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>
          </SectionCard>

          {/* ── Weekly Goals ── */}
          <Text style={[gs.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Weekly Goals</Text>
          <View style={gs.card}>
            {([
              { label: 'Focus (min/week)', key: 'focusMinutes' as keyof WeeklyGoals, step: 30 },
              { label: 'Gym sessions/week', key: 'gymSessions' as keyof WeeklyGoals, step: 1 },
              { label: 'Water (ml/week)', key: 'waterMlTotal' as keyof WeeklyGoals, step: 500 },
              { label: 'Calories (kcal/week)', key: 'caloriesTotal' as keyof WeeklyGoals, step: 500 },
              { label: 'Steps/week', key: 'stepsTotal' as keyof WeeklyGoals, step: 1000 },
            ] as { label: string; key: keyof WeeklyGoals; step: number }[]).map(field => (
              <View key={field.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 14, color: colors.textSub }}>{field.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setWeeklyGoalsDraft(d => ({ ...d, [field.key]: Math.max(0, d[field.key] - field.step) }))}
                    style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
                  >
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>−</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, minWidth: 60, textAlign: 'center' }}>
                    {weeklyGoalsDraft[field.key].toLocaleString()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setWeeklyGoalsDraft(d => ({ ...d, [field.key]: d[field.key] + field.step }))}
                    style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
                  >
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity style={[gs.btnPrimary, { marginTop: 16 }]} onPress={saveWeeklyGoals}>
              <Text style={gs.btnPrimaryText}>Save Weekly Goals</Text>
            </TouchableOpacity>
          </View>

          {/* ── Preferences ── */}
          <Text style={[gs.sectionTitle, { marginTop: 8 }]}>Preferences</Text>
          <SectionCard>
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
