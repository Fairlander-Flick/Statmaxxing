import { useState, useEffect, useRef } from 'react';
import {
  ScrollView, Text, View, StyleSheet, TouchableOpacity, TextInput, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, globalStyles } from '../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  saveData, loadData, appendToList, KEYS, toDay, generateId,
  MindActivity, MindLog,
} from '../lib/storage';

const DEFAULT_ACTIVITIES: MindActivity[] = [
  { id: '1', name: 'Kod Yazmak', statBoost: 'FOC' },
  { id: '2', name: 'Kitap Okumak', statBoost: 'FOC' },
  { id: '3', name: 'Resim Çizmek', statBoost: 'ART' },
  { id: '4', name: 'Müzik Yapmak', statBoost: 'ART' },
  { id: '5', name: 'İşe Odaklanmak', statBoost: 'DIS' },
  { id: '6', name: 'Ders Çalışmak', statBoost: 'FOC' },
  { id: '7', name: 'Meditasyon', statBoost: 'VIT' },
];

export default function MindScreen() {
  const [activities, setActivities] = useState<MindActivity[]>(DEFAULT_ACTIVITIES);
  const [todayLogs, setTodayLogs] = useState<MindLog[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<MindActivity | null>(null);
  const [feeling, setFeeling] = useState(5);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityStat, setNewActivityStat] = useState('FOC');

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const today = toDay();

  useEffect(() => {
    loadData<MindActivity[]>(KEYS.mindActivities, DEFAULT_ACTIVITIES).then(setActivities);
    loadData<MindLog[]>(KEYS.mindLogs, []).then((logs) =>
      setTodayLogs(logs.filter((l) => l.date === today))
    );
  }, []);

  useEffect(() => {
    if (timerRunning) {
      startTimeRef.current = Date.now() - elapsedSecs * 1000;
      intervalRef.current = setInterval(() => {
        setElapsedSecs(Math.floor((Date.now() - (startTimeRef.current ?? Date.now())) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const toggleTimer = () => {
    if (!selectedActivity) return;
    setTimerRunning((r) => !r);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setElapsedSecs(0);
  };

  const saveSession = async () => {
    if (!selectedActivity || elapsedSecs < 10) return;
    const log: MindLog = {
      id: generateId(),
      date: today,
      activityId: selectedActivity.id,
      activityName: selectedActivity.name,
      statBoost: selectedActivity.statBoost,
      durationMinutes: Math.round(elapsedSecs / 60),
      feelingScore: feeling,
    };
    const updated = await appendToList<MindLog>(KEYS.mindLogs, log);
    setTodayLogs(updated.filter((l) => l.date === today));
    resetTimer();
  };

  const addActivity = async () => {
    if (!newActivityName.trim()) return;
    const act: MindActivity = { id: generateId(), name: newActivityName.trim(), statBoost: newActivityStat };
    const updated = [...activities, act];
    await saveData(KEYS.mindActivities, updated);
    setActivities(updated);
    setNewActivityName('');
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const STAT_OPTS = ['FOC', 'ART', 'DIS', 'VIT', 'SOC', 'STR'];
  const STAT_COLOR: Record<string, string> = {
    FOC: COLORS.foc, ART: COLORS.art, DIS: COLORS.dis,
    VIT: COLORS.vit, SOC: COLORS.soc, STR: COLORS.str,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
        <Text style={globalStyles.screenTitle}>Focus</Text>
        <Text style={globalStyles.screenSub}>Deep work tracker</Text>

        {/* Activity Picker */}
        <Text style={globalStyles.sectionTitle}>Select Activity</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {activities.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={[styles.activityChip, selectedActivity?.id === a.id && { backgroundColor: COLORS.purpleDim, borderColor: COLORS.purple }]}
              onPress={() => setSelectedActivity(a)}
            >
              <Text style={[styles.activityText, selectedActivity?.id === a.id && { color: COLORS.purple }]}>{a.name}</Text>
              <Text style={{ fontSize: 10, color: STAT_COLOR[a.statBoost] ?? COLORS.textSub, fontWeight: '700' }}>
                +{a.statBoost}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Timer */}
        <View style={[globalStyles.card, { alignItems: 'center' }]}>
          {selectedActivity ? (
            <Text style={{ color: COLORS.purple, fontWeight: '700', fontSize: 14, marginBottom: 12 }}>
              {selectedActivity.name}
            </Text>
          ) : (
            <Text style={{ color: COLORS.textSub, fontSize: 13, marginBottom: 12 }}>Pick an activity above</Text>
          )}
          <Text style={styles.timerText}>{formatTime(elapsedSecs)}</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity
              style={[globalStyles.btnPrimary, { flex: 1, opacity: selectedActivity ? 1 : 0.5 }]}
              onPress={toggleTimer}
              disabled={!selectedActivity}
            >
              <Text style={globalStyles.btnPrimaryText}>{timerRunning ? '⏸ Pause' : '▶ Start'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.btnSecondary, { flex: 1 }]} onPress={resetTimer}>
              <Text style={globalStyles.btnSecondaryText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feeling score */}
        {elapsedSecs > 0 && (
          <View style={globalStyles.card}>
            <Text style={globalStyles.label}>How did it feel? ({feeling}/10)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.scoreBtn, feeling === n && { backgroundColor: COLORS.purple, borderColor: COLORS.purple }]}
                    onPress={() => setFeeling(n)}
                  >
                    <Text style={[styles.scoreBtnText, feeling === n && { color: '#fff' }]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={{ color: COLORS.textSub, fontSize: 11, marginTop: 8 }}>
              1 = Terrible · 10 = Amazing
            </Text>
            <TouchableOpacity style={[globalStyles.btnPrimary, { marginTop: 14 }]} onPress={saveSession}>
              <Text style={globalStyles.btnPrimaryText}>Save Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Today's logs */}
        {todayLogs.length > 0 && (
          <>
            <Text style={globalStyles.sectionTitle}>Today's Sessions</Text>
            {todayLogs.map((l) => (
              <View key={l.id} style={globalStyles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: COLORS.text, fontWeight: '700' }}>{l.activityName}</Text>
                  <Text style={{ color: COLORS.textSub }}>{l.durationMinutes}m</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ color: STAT_COLOR[l.statBoost] ?? COLORS.cyan, fontSize: 12, fontWeight: '700' }}>
                    +{l.statBoost}
                  </Text>
                  <Text style={{ color: COLORS.textSub, fontSize: 12 }}>Feeling: {l.feelingScore}/10</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Add custom activity */}
        <Text style={globalStyles.sectionTitle}>Add Custom Activity</Text>
        <View style={globalStyles.card}>
          <TextInput style={globalStyles.input} placeholder="Activity name" placeholderTextColor={COLORS.textSub} value={newActivityName} onChangeText={setNewActivityName} />
          <Text style={globalStyles.label}>Stat boosted</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {STAT_OPTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.scoreBtn, newActivityStat === s && { backgroundColor: STAT_COLOR[s], borderColor: STAT_COLOR[s] }]}
                  onPress={() => setNewActivityStat(s)}
                >
                  <Text style={[styles.scoreBtnText, newActivityStat === s && { color: '#000' }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity style={globalStyles.btnPrimary} onPress={addActivity}>
            <Text style={globalStyles.btnPrimaryText}>Add Activity</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activityChip: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: 'center',
    gap: 4,
  },
  activityText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '800',
    color: COLORS.purple,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  scoreBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBtnText: {
    color: COLORS.textSub,
    fontWeight: '700',
    fontSize: 14,
  },
});
