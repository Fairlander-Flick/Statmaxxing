import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, useEffect } from 'react';
import { useTheme, makeGlobalStyles } from '../lib/ThemeContext';
import { useLayout } from '../lib/useLayout';
import { saveData, loadData, KEYS } from '../lib/storage';
import { generateRandomData } from '../lib/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { colors, mode, isDark, toggleTheme } = useTheme();
  const layout = useLayout();
  const gs = makeGlobalStyles(colors);

  const [waterGoal, setWaterGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mockPeriod, setMockPeriod] = useState<number>(7);

  const mockPeriods = [
    { value: 7, label: '7D' },
    { value: 14, label: '14D' },
    { value: 30, label: '1M' },
    { value: 365, label: '1Y' },
    { value: 1825, label: '5Y' },
    { value: 3650, label: '10Y' }
  ];

  useEffect(() => {
    loadData<number>(KEYS.waterGoal, 2500).then((val) => setWaterGoal(val.toString()));
  }, []);

  const handleSaveWaterGoal = async () => {
    const goal = parseInt(waterGoal);
    if (!isNaN(goal) && goal > 0) {
      await saveData(KEYS.waterGoal, goal);
    }
  };

  const handleGenerateMockData = async () => {
    setIsGenerating(true);
    try {
      await generateRandomData(mockPeriod);
      if (Platform.OS === 'web') {
        window.alert(`Mock data generated for the last ${mockPeriod} days! Please navigate across tabs to refresh.`);
      } else {
        Alert.alert('Success', `Mock data generated for the last ${mockPeriod} days!`);
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
    for (const key of logKeys) {
      await AsyncStorage.removeItem(key);
    }
  };

  const handleClearAllData = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        '⚠️ Tüm log verilerin kalıcı olarak silinecek (uyku, su, kilo, antrenman, focus, sosyal).\nProgramlar, kişiler ve yemek kütüphanesi korunur.\n\nEmin misin?'
      );
      if (confirmed) {
        await doDeleteAllLogs();
        window.alert('✅ Tüm log verileri silindi.');
      }
    } else {
      Alert.alert(
        '⚠️ Tüm Veriyi Sil',
        'Tüm log verilerin kalıcı olarak silinecek. Programlar, kişiler ve yemek kütüphanesi korunur.\n\nBu işlem geri alınamaz!',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Evet, Sil',
            style: 'destructive',
            onPress: async () => {
              await doDeleteAllLogs();
              Alert.alert('Temizlendi', 'Tüm log verileri silindi.');
            },
          },
        ]
      );
    }
  };

  const s = StyleSheet.create({
    inner: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      flex: 1,
    },
    content: {
      alignSelf: 'center' as const,
      width: '100%',
      maxWidth: layout.maxWidth,
      paddingHorizontal: layout.hPadding,
      paddingTop: 24,
      paddingBottom: 40,
    },
    themeRow: {
      flexDirection: 'row' as const,
      gap: 12,
      marginBottom: 14,
    },
    themeCard: {
      flex: 1,
      borderRadius: 18,
      borderWidth: 2,
      padding: 18,
      alignItems: 'center' as const,
      gap: 10,
    },
    themePreview: {
      width: '100%',
      height: 64,
      borderRadius: 12,
      overflow: 'hidden' as const,
      flexDirection: 'row' as const,
    },
    previewBlock: {
      flex: 1,
    },
    themeLabel: {
      fontWeight: '800',
      fontSize: 14,
      letterSpacing: 0.2,
    },
    themeDesc: {
      fontSize: 11,
      textAlign: 'center' as const,
      lineHeight: 16,
    },
    activeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
    },
    activeBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden' as const,
      marginBottom: 14,
    },
    settingRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: 16,
      gap: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    settingRowLast: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: 16,
      gap: 14,
    },
    settingIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    settingLabel: {
      flex: 1,
      color: colors.text,
      fontWeight: '600',
      fontSize: 15,
    },
    settingValue: {
      color: colors.textSub,
      fontSize: 13,
    },
    versionText: {
      textAlign: 'center' as const,
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 24,
    },
  });

  return (
    <SafeAreaView style={s.inner}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          <Text style={gs.screenTitle}>Settings</Text>
          <Text style={gs.screenSub}>Customize your experience</Text>

          {/* ── Theme Picker ── */}
          <Text style={gs.sectionTitle}>Appearance</Text>
          <View style={s.themeRow}>

            {/* AMOLED Dark Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => !isDark && toggleTheme()}
              style={[
                s.themeCard,
                {
                  backgroundColor: '#0f0f0f',
                  borderColor: isDark ? '#0ea5e9' : '#2a2a2a',
                },
              ]}
            >
              {/* Mini preview */}
              <View style={s.themePreview}>
                <View style={[s.previewBlock, { backgroundColor: '#000' }]} />
                <View style={[s.previewBlock, { backgroundColor: '#0f0f0f' }]} />
                <View style={[s.previewBlock, { backgroundColor: '#0ea5e966' }]} />
              </View>
              <Text style={[s.themeLabel, { color: '#f8f8f8' }]}>AMOLED Dark</Text>
              <Text style={[s.themeDesc, { color: '#888' }]}>
                Pure black · Neon accents{'\n'}Easy on OLED screens
              </Text>
              {isDark && (
                <View style={[s.activeBadge, { backgroundColor: '#0ea5e9' }]}>
                  <Text style={[s.activeBadgeText, { color: '#fff' }]}>✓ Active</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Nordic Light Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => isDark && toggleTheme()}
              style={[
                s.themeCard,
                {
                  backgroundColor: '#ffffff',
                  borderColor: !isDark ? '#0284c7' : '#e2ddd8',
                },
              ]}
            >
              {/* Mini preview */}
              <View style={s.themePreview}>
                <View style={[s.previewBlock, { backgroundColor: '#f7f5f2' }]} />
                <View style={[s.previewBlock, { backgroundColor: '#ffffff' }]} />
                <View style={[s.previewBlock, { backgroundColor: '#0284c733' }]} />
              </View>
              <Text style={[s.themeLabel, { color: '#1c1917' }]}>Nordic Light</Text>
              <Text style={[s.themeDesc, { color: '#78716c' }]}>
                Warm white · Clean type{'\n'}Inspired by Notion
              </Text>
              {!isDark && (
                <View style={[s.activeBadge, { backgroundColor: '#0284c7' }]}>
                  <Text style={[s.activeBadgeText, { color: '#fff' }]}>✓ Active</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Configuration & Mock Data ── */}
          <Text style={gs.sectionTitle}>Configuration</Text>
          <View style={s.sectionCard}>
            <View style={s.settingRow}>
              <View style={[s.settingIcon, { backgroundColor: colors.foc + '33' }]}>
                <Ionicons name="water" size={20} color={colors.foc} />
              </View>
              <Text style={s.settingLabel}>Daily Water Goal (ml)</Text>
              <TextInput 
                style={{ flex: 1, backgroundColor: colors.bg, padding: 8, borderRadius: 8, color: colors.text }}
                value={waterGoal}
                onChangeText={setWaterGoal}
                onBlur={handleSaveWaterGoal}
                keyboardType="numeric"
              />
            </View>

            <View style={[{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
              <Text style={[s.settingLabel, { marginBottom: 10 }]}>Mock Data Timeframe</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {mockPeriods.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    onPress={() => setMockPeriod(p.value)}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1,
                      borderColor: mockPeriod === p.value ? colors.soc : colors.border,
                      backgroundColor: mockPeriod === p.value ? colors.soc + '33' : colors.surfaceAlt
                    }}
                  >
                    <Text style={{ color: mockPeriod === p.value ? colors.soc : colors.textSub, fontSize: 13, fontWeight: '700' }}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={[s.settingRowLast, { backgroundColor: colors.red + '22' }]} 
              onPress={handleGenerateMockData}
              disabled={isGenerating}
            >
              <View style={[s.settingIcon, { backgroundColor: colors.red + '44' }]}>
                <Ionicons name="refresh" size={20} color={colors.red} />
              </View>
              <Text style={[s.settingLabel, { color: colors.red }]}>
                {isGenerating ? "Generating..." : `Generate ${mockPeriod} Days Mock Data`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Danger Zone ── */}
          <Text style={[gs.sectionTitle, { color: colors.red }]}>Danger Zone</Text>
          <View style={s.sectionCard}>
            <TouchableOpacity
              style={[s.settingRowLast, { backgroundColor: colors.red + '15' }]}
              onPress={handleClearAllData}
            >
              <View style={[s.settingIcon, { backgroundColor: colors.red + '33' }]}>
                <Ionicons name="trash" size={20} color={colors.red} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.settingLabel, { color: colors.red }]}>Tüm Log Verilerini Sil</Text>
                <Text style={{ color: colors.textSub, fontSize: 12, marginTop: 2 }}>Programlar ve kütüphane korunur</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.red + '88'} />
            </TouchableOpacity>
          </View>

          {/* ── App Info ── */}
          <Text style={gs.sectionTitle}>About</Text>
          <View style={s.sectionCard}>
            <View style={s.settingRow}>
              <View style={[s.settingIcon, { backgroundColor: colors.accentDim }]}>
                <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
              </View>
              <Text style={s.settingLabel}>Version</Text>
              <Text style={s.settingValue}>1.0.0</Text>
            </View>
            <View style={s.settingRowLast}>
              <View style={[s.settingIcon, { backgroundColor: colors.greenDim }]}>
                <Ionicons name="trophy-outline" size={20} color={colors.green} />
              </View>
              <Text style={s.settingLabel}>Statmaxxing</Text>
              <Text style={s.settingValue}>Gamified life tracker</Text>
            </View>
          </View>

          <Text style={s.versionText}>Made with 💪 · Statmaxxing v1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
