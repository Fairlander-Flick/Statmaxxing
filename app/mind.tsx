import { useState, useEffect, useRef } from 'react';
import {
  ScrollView, Text, View, StyleSheet, TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme, makeGlobalStyles } from '../lib/ThemeContext';
import { useLayout } from '../lib/useLayout';
import {
  saveData, loadData, appendToList, KEYS, toDay, generateId,
  MindActivity, MindLog,
} from '../lib/storage';

const DEFAULT_ACTIVITIES: MindActivity[] = [
  { id: '1', name: 'Coding', statBoost: 'FOC' },
  { id: '2', name: 'Reading', statBoost: 'FOC' },
  { id: '3', name: 'Drawing', statBoost: 'ART' },
  { id: '4', name: 'Music', statBoost: 'ART' },
  { id: '5', name: 'Deep Work', statBoost: 'DIS' },
  { id: '6', name: 'Studying', statBoost: 'FOC' },
  { id: '7', name: 'Meditation', statBoost: 'VIT' },
];

export default function MindScreen() {
  const { colors } = useTheme();
  const layout = useLayout();
  const gs = makeGlobalStyles(colors);

  const STAT_COLOR: Record<string, string> = {
    FOC: colors.foc, ART: colors.art, DIS: colors.dis, VIT: colors.vit, SOC: colors.soc, STR: colors.str,
  };
  const STAT_OPTS = ['FOC', 'ART', 'DIS', 'VIT', 'SOC', 'STR'];

  const [activities, setActivities] = useState<MindActivity[]>(DEFAULT_ACTIVITIES);
  const [todayLogs, setTodayLogs] = useState<MindLog[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<MindActivity | null>(null);
  const [feeling, setFeeling] = useState(5);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityStat, setNewActivityStat] = useState('FOC');
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const today = toDay();

  useEffect(() => {
    loadData<MindActivity[]>(KEYS.mindActivities, DEFAULT_ACTIVITIES).then(setActivities);
    loadData<MindLog[]>(KEYS.mindLogs, []).then((logs) => setTodayLogs(logs.filter((l) => l.date === today)));
  }, []);

  useEffect(() => {
    if (timerRunning) {
      startTimeRef.current = Date.now() - elapsedSecs * 1000;
      intervalRef.current = setInterval(() => setElapsedSecs(Math.floor((Date.now() - (startTimeRef.current ?? Date.now())) / 1000)), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const toggleTimer = () => { if (!selectedActivity) return; setTimerRunning((r) => !r); };
  const resetTimer = () => { setTimerRunning(false); setElapsedSecs(0); };

  const saveSession = async () => {
    if (!selectedActivity || elapsedSecs < 10) return;
    const log: MindLog = { id: generateId(), date: today, activityId: selectedActivity.id, activityName: selectedActivity.name, statBoost: selectedActivity.statBoost, durationMinutes: Math.round(elapsedSecs / 60), feelingScore: feeling };
    const updated = await appendToList<MindLog>(KEYS.mindLogs, log);
    setTodayLogs(updated.filter((l) => l.date === today));
    resetTimer();
  };

  const addActivity = async () => {
    if (!newActivityName.trim()) return;
    const act: MindActivity = { id: generateId(), name: newActivityName.trim(), statBoost: newActivityStat };
    const updated = [...activities, act];
    await saveData(KEYS.mindActivities, updated);
    setActivities(updated); setNewActivityName('');
  };

  const deleteMindLog = async (id: string) => {
    const all = await loadData<MindLog[]>(KEYS.mindLogs, []);
    const updated = all.filter((l) => l.id !== id);
    await saveData(KEYS.mindLogs, updated);
    setTodayLogs(updated.filter((l) => l.date === today));
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const sec = secs % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const fw = { alignSelf: 'center' as const, width: '100%' as const, maxWidth: layout.inputMaxWidth };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={gs.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: layout.maxWidth, paddingHorizontal: layout.hPadding, paddingTop: 20 }}>

          <Text style={gs.screenTitle}>Focus</Text>
          <Text style={gs.screenSub}>Deep work & skill tracker</Text>

          {/* ── Activity Picker ── */}
          <Text style={gs.sectionTitle}>Select Activity</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
            contentContainerStyle={{ paddingRight: 8, gap: 8, flexDirection: 'row' }}
          >
            {activities.map((a) => {
              const isActive = selectedActivity?.id === a.id;
              const statCol = STAT_COLOR[a.statBoost] ?? colors.accent;
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[s.activityChip, {
                    borderColor: isActive ? statCol : colors.border,
                    backgroundColor: isActive ? statCol + '22' : colors.surface,
                  }]}
                  onPress={() => setSelectedActivity(a)}
                >
                  <Text style={[s.activityText, { color: isActive ? statCol : colors.text }]}>{a.name}</Text>
                  <View style={[s.statBadge, { backgroundColor: statCol + '30' }]}>
                    <Text style={{ fontSize: 11, color: statCol, fontWeight: '800' }}>+{a.statBoost}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Timer Card ── */}
          <View style={[gs.card, { alignItems: 'center', paddingVertical: 32 }]}>
            {selectedActivity ? (
              <View style={[s.statBadge, { backgroundColor: (STAT_COLOR[selectedActivity.statBoost] ?? colors.accent) + '22', marginBottom: 16 }]}>
                <Text style={{ color: STAT_COLOR[selectedActivity.statBoost] ?? colors.accent, fontWeight: '700', fontSize: 16 }}>
                  {selectedActivity.name} · +{selectedActivity.statBoost}
                </Text>
              </View>
            ) : (
              <Text style={{ color: colors.textSub, fontSize: 16, marginBottom: 16 }}>Pick an activity above ↑</Text>
            )}

            <Text style={[s.timerText, { color: colors.art }]}>{formatTime(elapsedSecs)}</Text>

            {/* Start / Reset buttons — fixed bottom row */}
            <View style={[{ flexDirection: 'row', gap: 12, marginTop: 24 }, fw]}>
              <TouchableOpacity
                style={[gs.btnPrimary, { flex: 1, backgroundColor: timerRunning ? colors.vit : colors.accent, opacity: selectedActivity ? 1 : 0.4 }]}
                onPress={toggleTimer}
                disabled={!selectedActivity}
              >
                <Text style={gs.btnPrimaryText}>{timerRunning ? '⏸  Pause' : '▶  Start'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[gs.btnSecondary, { flex: 1 }]} onPress={resetTimer}>
                <Text style={gs.btnSecondaryText}>↺  Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Feeling score (shows after timer runs) ── */}
          {elapsedSecs > 0 && (
            <View style={gs.card}>
              <Text style={[gs.cardTitle, { textAlign: 'center', marginBottom: 16 }]}>How did it feel? {feeling}/10</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <TouchableOpacity key={n}
                    style={[s.scoreBtn, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }, feeling === n && { backgroundColor: colors.art, borderColor: colors.art }]}
                    onPress={() => setFeeling(n)}>
                    <Text style={[s.scoreBtnText, { color: feeling === n ? '#fff' : colors.textSub }]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ color: colors.textSub, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>1 = Terrible · 10 = Amazing</Text>
              <View style={fw}>
                <TouchableOpacity style={[gs.btnPrimary, { backgroundColor: colors.art }]} onPress={saveSession}>
                  <Text style={gs.btnPrimaryText}>Save Session</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Today's logs ── */}
          {todayLogs.length > 0 && (
            <>
              <Text style={gs.sectionTitle}>Today's Sessions</Text>
              {todayLogs.map((l) => (
                <View key={l.id} style={gs.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16, flex: 1 }}>{l.activityName}</Text>
                    <Text style={{ color: colors.textSub, fontSize: 15, marginRight: 10 }}>{l.durationMinutes} min</Text>
                    <TouchableOpacity onPress={() => deleteMindLog(l.id)} style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={18} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <View style={[s.statBadge, { backgroundColor: (STAT_COLOR[l.statBoost] ?? colors.accent) + '22' }]}>
                      <Text style={{ color: STAT_COLOR[l.statBoost] ?? colors.accent, fontSize: 13, fontWeight: '700' }}>+{l.statBoost}</Text>
                    </View>
                    <Text style={{ color: colors.textSub, fontSize: 13 }}>Feeling: {l.feelingScore}/10</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* ── Add Custom Activity ── */}
          <Text style={gs.sectionTitle}>Add Custom Activity</Text>
          <View style={gs.card}>
            <View style={fw}>
              <TextInput style={gs.input} placeholder="Activity name (e.g. Journaling)" placeholderTextColor={colors.textSub} value={newActivityName} onChangeText={setNewActivityName} />
              <Text style={gs.label}>Stat boosted</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {STAT_OPTS.map((st) => (
                  <TouchableOpacity key={st}
                    style={[s.scoreBtn, { borderColor: colors.border, backgroundColor: colors.surfaceAlt, width: 52, height: 44, borderRadius: 12 },
                      newActivityStat === st && { backgroundColor: STAT_COLOR[st], borderColor: STAT_COLOR[st] }]}
                    onPress={() => setNewActivityStat(st)}>
                    <Text style={[s.scoreBtnText, { color: newActivityStat === st ? '#fff' : colors.textSub, fontSize: 13 }]}>{st}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[gs.btnPrimary, { backgroundColor: colors.accent }]} onPress={addActivity}>
                <Text style={gs.btnPrimaryText}>Add Activity</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  activityChip: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
    minWidth: 90,
  },
  activityText: { fontSize: 14, fontWeight: '700' },
  statBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  timerText: { fontSize: 64, fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: 2 },
  scoreBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBtnText: { fontWeight: '700', fontSize: 15 },
});
