import { useState, useEffect, useRef } from 'react';
import {
  ScrollView, Text, View, StyleSheet, TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme, makeGlobalStyles } from '../lib/ThemeContext';
import { useLayout } from '../lib/useLayout';
import {
  saveData, loadData, appendToList, KEYS, toDay, generateId,
  MindActivity, MindLog, FocusTask,
} from '../lib/storage';
import { awardXP } from '../lib/xp';

const DEFAULT_ACTIVITIES: MindActivity[] = [
  { id: '1', name: 'Coding', statBoost: 'FOC' },
  { id: '2', name: 'Reading', statBoost: 'FOC' },
  { id: '3', name: 'Drawing', statBoost: 'FOC' },
  { id: '4', name: 'Music', statBoost: 'FOC' },
  { id: '5', name: 'Deep Work', statBoost: 'DIS' },
  { id: '6', name: 'Studying', statBoost: 'FOC' },
  { id: '7', name: 'Meditation', statBoost: 'VIT' },
];

// ── Circular Timer Ring ──
function TimerRing({ progress, elapsed, isRunning, color }: {
  progress: number; elapsed: string; isRunning: boolean; color: string;
}) {
  const { colors } = useTheme();
  const size = 224;
  const cx = size / 2;
  const cy = size / 2;
  const r = 96;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(progress, 1));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.border} strokeWidth={8} />
        <Circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={[s.timerDisplay, { color: colors.text }]}>{elapsed}</Text>
        <Text style={[s.timerLabel, { color: colors.textMuted }]}>
          {isRunning ? 'RUNNING' : 'PAUSED'}
        </Text>
      </View>
    </View>
  );
}

export default function MindScreen() {
  const { colors } = useTheme();
  const layout = useLayout();
  const gs = makeGlobalStyles(colors);

  const STAT_COLOR: Record<string, string> = {
    FOC: colors.foc, DIS: colors.dis, VIT: colors.vit, SOC: colors.soc, STR: colors.str,
  };
  const STAT_OPTS = ['FOC', 'DIS', 'VIT', 'SOC', 'STR'];
  const STAT_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
    FOC: 'flash', DIS: 'calendar', VIT: 'heart', SOC: 'people', STR: 'barbell',
  };
  const ACT_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
    Coding: 'code-slash', Reading: 'book', Drawing: 'pencil', Music: 'musical-notes',
    'Deep Work': 'briefcase', Studying: 'school', Meditation: 'leaf',
  };

  const [activities, setActivities] = useState<MindActivity[]>(DEFAULT_ACTIVITIES);
  const [todayLogs, setTodayLogs] = useState<MindLog[]>([]);
  const [tasks, setTasks] = useState<FocusTask[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<MindActivity | null>(null);
  const [feeling, setFeeling] = useState(7);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityStat, setNewActivityStat] = useState('FOC');
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [entryMode, setEntryMode] = useState<'timer' | 'pomodoro' | 'manual'>('timer');
  const [manualHours, setManualHours] = useState('');
  const [manualMins, setManualMins] = useState('');
  const [pomodoroPhase, setPomodoroPhase] = useState<'work' | 'break'>('work');
  const [pomodoroRound, setPomodoroRound] = useState(1);
  const [phaseStartSecs, setPhaseStartSecs] = useState(0);
  const [workSecsAccum, setWorkSecsAccum] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStartRef = useRef<number | null>(null);
  const elapsedAtStartRef = useRef(0);
  const entryModeRef = useRef(entryMode);
  const pomodoroPhaseRef = useRef(pomodoroPhase);
  const phaseStartSecsRef = useRef(phaseStartSecs);
  const today = toDay();

  useEffect(() => {
    loadData<MindActivity[]>(KEYS.mindActivities, DEFAULT_ACTIVITIES).then((acts) =>
      setActivities(acts.map(a => a.statBoost === 'ART' ? { ...a, statBoost: 'FOC' } : a))
    );
    loadData<MindLog[]>(KEYS.mindLogs, []).then((logs) => setTodayLogs(logs.filter((l) => l.date === today)));
    loadData<FocusTask[]>(KEYS.focusTasks, []).then(setTasks);
  }, []);

  useEffect(() => { entryModeRef.current = entryMode; }, [entryMode]);
  useEffect(() => { pomodoroPhaseRef.current = pomodoroPhase; }, [pomodoroPhase]);
  useEffect(() => { phaseStartSecsRef.current = phaseStartSecs; }, [phaseStartSecs]);

  useEffect(() => {
    if (timerRunning) {
      timerStartRef.current = Date.now();
      elapsedAtStartRef.current = elapsedSecs;
      intervalRef.current = setInterval(() => {
        const elapsed = elapsedAtStartRef.current + Math.floor((Date.now() - (timerStartRef.current ?? Date.now())) / 1000);
        setElapsedSecs(elapsed);
        if (entryModeRef.current === 'pomodoro') {
          const phaseElapsed = elapsed - phaseStartSecsRef.current;
          const phaseDuration = pomodoroPhaseRef.current === 'work' ? 25 * 60 : 5 * 60;
          if (phaseElapsed >= phaseDuration) {
            if (pomodoroPhaseRef.current === 'work') {
              setWorkSecsAccum(w => w + phaseDuration);
              setPomodoroPhase('break');
              pomodoroPhaseRef.current = 'break';
            } else {
              setPomodoroPhase('work');
              pomodoroPhaseRef.current = 'work';
              setPomodoroRound(r => r + 1);
            }
            setPhaseStartSecs(elapsed);
            phaseStartSecsRef.current = elapsed;
          }
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const toggleTimer = () => { if (!selectedActivity) return; setTimerRunning((r) => !r); };
  const resetTimer = () => { setTimerRunning(false); setElapsedSecs(0); };
  const resetPomodoro = () => {
    setTimerRunning(false); setElapsedSecs(0);
    setPomodoroPhase('work'); setPomodoroRound(1);
    setPhaseStartSecs(0); setWorkSecsAccum(0);
  };

  const saveManualSession = async () => {
    const h = parseInt(manualHours || '0');
    const m = parseInt(manualMins || '0');
    const totalMins = h * 60 + m;
    if (!selectedActivity || totalMins <= 0) return;
    const log: MindLog = {
      id: generateId(), date: today,
      activityId: selectedActivity.id, activityName: selectedActivity.name,
      statBoost: selectedActivity.statBoost,
      durationMinutes: totalMins, feelingScore: feeling,
    };
    const updated = await appendToList<MindLog>(KEYS.mindLogs, log);
    setTodayLogs(updated.filter((l) => l.date === today));
    setManualHours(''); setManualMins('');
    const xpEarned = Math.min(Math.floor(log.durationMinutes / 5) * 2, 40);
    if (xpEarned > 0) await awardXP('foc', xpEarned);
  };

  const saveSession = async () => {
    if (!selectedActivity || elapsedSecs < 10) return;
    const durationMinutes = entryMode === 'pomodoro'
      ? Math.round((workSecsAccum + (pomodoroPhase === 'work' ? elapsedSecs - phaseStartSecs : 0)) / 60)
      : Math.round(elapsedSecs / 60);
    if (durationMinutes <= 0) return;
    const log: MindLog = {
      id: generateId(), date: today, activityId: selectedActivity.id,
      activityName: selectedActivity.name, statBoost: selectedActivity.statBoost,
      durationMinutes, feelingScore: feeling,
    };
    const updated = await appendToList<MindLog>(KEYS.mindLogs, log);
    setTodayLogs(updated.filter((l) => l.date === today));
    if (entryMode === 'pomodoro') resetPomodoro(); else resetTimer();
    const xpEarned = Math.min(Math.floor(durationMinutes / 5) * 2, 40);
    if (xpEarned > 0) await awardXP('foc', xpEarned);
  };

  const addTask = async () => {
    if (!newTaskText.trim()) return;
    const task: FocusTask = { id: generateId(), text: newTaskText.trim(), done: false, createdAt: today };
    const updated = [...tasks, task];
    await saveData(KEYS.focusTasks, updated);
    setTasks(updated);
    setNewTaskText('');
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    const updated = tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t);
    await saveData(KEYS.focusTasks, updated);
    setTasks(updated);
    if (activeTaskId === id) setActiveTaskId(null);
    if (task && !task.done) await awardXP('foc', 8);
  };

  const deleteTask = async (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    await saveData(KEYS.focusTasks, updated);
    setTasks(updated);
    if (activeTaskId === id) setActiveTaskId(null);
  };

  const clearDoneTasks = async () => {
    const updated = tasks.filter((t) => !t.done);
    await saveData(KEYS.focusTasks, updated);
    setTasks(updated);
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
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const totalTodayMins = todayLogs.reduce((s, l) => s + l.durationMinutes, 0);
  const accentColor = selectedActivity ? (STAT_COLOR[selectedActivity.statBoost] ?? colors.accent) : colors.accent;
  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;
  const pendingTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* ── Header ── */}
      <View style={[s.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[s.headerSub, { color: colors.textMuted }]}>FOCUS MODE</Text>
          <Text style={[s.headerTitle, { color: colors.text }]}>Focus</Text>
        </View>
        <View style={[s.streakBadge, { backgroundColor: colors.orange + '20' }]}>
          <Ionicons name="flame" size={18} color={colors.orange} />
          <Text style={[s.streakText, { color: colors.orange }]}>{todayLogs.length} sessions</Text>
        </View>
      </View>

      <ScrollView style={gs.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ width: '100%', maxWidth: layout.maxWidth, paddingHorizontal: layout.hPadding, paddingTop: 20, alignSelf: 'center' }}>

          {/* ── Today's Total ── */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 6 }}>
            <View>
              <Text style={[s.currentFocusLabel, { color: colors.textMuted }]}>TODAY'S FOCUS</Text>
              <Text style={[s.currentFocusValue, { color: colors.text }]}>
                {Math.floor(totalTodayMins / 60) > 0
                  ? `${Math.floor(totalTodayMins / 60)}h ${totalTodayMins % 60}m`
                  : `${totalTodayMins}m`}
              </Text>
            </View>
            {todayLogs.length > 0 && (
              <Text style={[s.trendsText, { color: colors.soc }]}>
                {todayLogs.length} session{todayLogs.length !== 1 ? 's' : ''} logged
              </Text>
            )}
          </View>

          {/* ── Task List ── */}
          <View style={[gs.card, { marginTop: 20, padding: 0, overflow: 'hidden' }]}>
            {/* Card header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="checkbox-outline" size={16} color={colors.foc} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, letterSpacing: -0.2 }}>Tasks</Text>
                {pendingTasks.length > 0 && (
                  <View style={{ backgroundColor: colors.foc + '20', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.foc }}>{pendingTasks.length}</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                {doneTasks.length > 0 && (
                  <TouchableOpacity onPress={clearDoneTasks}>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>Clear done</Text>
                  </TouchableOpacity>
                )}
                {tasks.length > 0 && (
                  <TouchableOpacity onPress={async () => {
                    await saveData(KEYS.focusTasks, []);
                    setTasks([]);
                    setActiveTaskId(null);
                  }}>
                    <Text style={{ fontSize: 12, color: colors.red }}>Clear all</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Task rows */}
            {tasks.length === 0 && (
              <View style={{ paddingHorizontal: 16, paddingVertical: 18, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: colors.textMuted, fontStyle: 'italic' }}>No tasks yet. Add what you'll work on today.</Text>
              </View>
            )}
            {tasks.map((task) => {
              const isActive = activeTaskId === task.id;
              return (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => !task.done && setActiveTaskId(isActive ? null : task.id)}
                  activeOpacity={task.done ? 1 : 0.7}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingHorizontal: 16, paddingVertical: 13,
                    borderBottomWidth: 1, borderBottomColor: colors.border,
                    backgroundColor: isActive ? colors.foc + '0d' : 'transparent',
                  }}
                >
                  {/* Checkbox */}
                  <TouchableOpacity onPress={() => toggleTask(task.id)} hitSlop={8}>
                    <Ionicons
                      name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={task.done ? colors.foc : colors.border}
                    />
                  </TouchableOpacity>

                  {/* Text */}
                  <Text style={{
                    flex: 1, fontSize: 14,
                    color: task.done ? colors.textMuted : isActive ? colors.text : colors.text,
                    textDecorationLine: task.done ? 'line-through' : 'none',
                    fontWeight: isActive ? '600' : '400',
                  }}>
                    {task.text}
                  </Text>

                  {/* Active indicator */}
                  {isActive && (
                    <View style={{ backgroundColor: colors.foc + '20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.foc }}>FOCUS</Text>
                    </View>
                  )}

                  {/* Delete */}
                  <TouchableOpacity onPress={() => deleteTask(task.id)} hitSlop={8}>
                    <Ionicons name="close" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}

            {/* Add task input */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingHorizontal: 16 }}>
              <TextInput
                style={{
                  flex: 1, fontSize: 14, color: colors.text,
                  paddingVertical: 8, paddingHorizontal: 12,
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 8, borderWidth: 1, borderColor: colors.border,
                }}
                placeholder="Add a task..."
                placeholderTextColor={colors.textMuted}
                value={newTaskText}
                onChangeText={setNewTaskText}
                onSubmitEditing={addTask}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={addTask}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  backgroundColor: newTaskText.trim() ? colors.foc : colors.surfaceAlt,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={20} color={newTaskText.trim() ? '#fff' : colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Activity Picker ── */}
          <Text style={[gs.sectionTitle, { marginTop: 20 }]}>Select Activity</Text>
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16, marginHorizontal: -layout.hPadding }}
            contentContainerStyle={{ paddingHorizontal: layout.hPadding, paddingRight: 24, gap: 8 }}
          >
            {activities.map((a) => {
              const isActive = selectedActivity?.id === a.id;
              const statCol = STAT_COLOR[a.statBoost] ?? colors.accent;
              const actIcon = ACT_ICONS[a.name] ?? 'star';
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[s.activityChip, {
                    borderColor: isActive ? statCol + '80' : colors.border,
                    backgroundColor: isActive ? statCol + '18' : colors.surface,
                  }]}
                  onPress={() => setSelectedActivity(a)}
                >
                  <View style={[s.chipIconWrap, { backgroundColor: statCol + '20' }]}>
                    <Ionicons name={actIcon} size={14} color={statCol} />
                  </View>
                  <Text style={[s.activityText, { color: isActive ? statCol : colors.text }]}>{a.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Mode Toggle ── */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {(['timer', 'pomodoro', 'manual'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => {
                  setTimerRunning(false);
                  setEntryMode(mode);
                  if (mode === 'pomodoro') resetPomodoro();
                }}
                style={[s.modeBtn, {
                  backgroundColor: entryMode === mode ? colors.accentDim : colors.surfaceAlt,
                  borderColor: entryMode === mode ? colors.accent : colors.border,
                }]}
              >
                <Ionicons
                  name={mode === 'timer' ? 'timer-outline' : mode === 'pomodoro' ? 'cafe-outline' : 'create-outline'}
                  size={15}
                  color={entryMode === mode ? colors.accent : colors.textSub}
                />
                <Text style={[s.modeBtnText, { color: entryMode === mode ? colors.accent : colors.textSub }]}>
                  {mode === 'timer' ? 'Timer' : mode === 'pomodoro' ? 'Pomodoro' : 'Log Manually'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Manual Entry Card ── */}
          {entryMode === 'manual' && (
            <View style={[gs.card, { alignItems: 'center', paddingVertical: 28 }]}>
              {selectedActivity ? (
                <View style={[s.activityBadge, { backgroundColor: accentColor + '20', borderColor: accentColor + '40', marginBottom: 20 }]}>
                  <Ionicons name={ACT_ICONS[selectedActivity.name] ?? 'star'} size={12} color={accentColor} />
                  <Text style={[s.activityBadgeText, { color: accentColor }]}>{selectedActivity.name}</Text>
                </View>
              ) : (
                <Text style={[s.pickHint, { color: colors.textMuted, marginBottom: 20 }]}>Select an activity above ↑</Text>
              )}

              <Text style={[s.currentFocusLabel, { color: colors.textMuted, marginBottom: 12 }]}>HOW LONG DID YOU WORK?</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <View style={{ alignItems: 'center' }}>
                  <TextInput
                    style={[s.manualInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={manualHours}
                    onChangeText={setManualHours}
                    maxLength={2}
                  />
                  <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 1, marginTop: 6 }}>HRS</Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 32, fontWeight: '200', marginBottom: 18 }}>:</Text>
                <View style={{ alignItems: 'center' }}>
                  <TextInput
                    style={[s.manualInput, { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                    placeholder="00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={manualMins}
                    onChangeText={setManualMins}
                    maxLength={2}
                  />
                  <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 1, marginTop: 6 }}>MIN</Text>
                </View>
              </View>

              <Text style={[gs.label, { marginBottom: 8 }]}>Session quality: {feeling}/10</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 24, justifyContent: 'center' }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[s.scoreBtn, {
                      backgroundColor: feeling === n ? colors.accent : colors.surfaceAlt,
                      borderColor: feeling === n ? colors.accent : colors.border,
                    }]}
                    onPress={() => setFeeling(n)}
                  >
                    <Text style={[s.scoreBtnText, { color: feeling === n ? '#fff' : colors.textSub }]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[gs.btnPrimary, {
                  width: '100%',
                  opacity: selectedActivity && (parseInt(manualHours || '0') * 60 + parseInt(manualMins || '0')) > 0 ? 1 : 0.4,
                }]}
                onPress={saveManualSession}
                disabled={!selectedActivity}
              >
                <Text style={gs.btnPrimaryText}>Save Session</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Timer Card ── */}
          {entryMode === 'timer' && (
          <View style={[gs.card, { alignItems: 'center', paddingVertical: 28, position: 'relative', overflow: 'hidden' }]}>
            {/* Glow */}
            <View style={[s.timerGlow, { backgroundColor: accentColor + '15' }]} />

            {selectedActivity ? (
              <View style={{ alignItems: 'center', gap: 6 }}>
                <View style={[s.activityBadge, { backgroundColor: accentColor + '20', borderColor: accentColor + '40' }]}>
                  <Ionicons name={ACT_ICONS[selectedActivity.name] ?? 'star'} size={12} color={accentColor} />
                  <Text style={[s.activityBadgeText, { color: accentColor }]}>
                    {selectedActivity.name}
                  </Text>
                </View>
                {activeTask && (
                  <Text style={{ fontSize: 13, color: colors.textSub, fontWeight: '500', maxWidth: 220, textAlign: 'center' }} numberOfLines={1}>
                    {activeTask.text}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={[s.pickHint, { color: colors.textMuted }]}>Select an activity above ↑</Text>
            )}

            <View style={{ marginVertical: 24 }}>
              <TimerRing
                progress={elapsedSecs > 0 ? (elapsedSecs % (25 * 60)) / (25 * 60) : 0}
                elapsed={formatTime(elapsedSecs)}
                isRunning={timerRunning}
                color={accentColor}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                style={[gs.btnPrimary, {
                  flex: 1,
                  backgroundColor: timerRunning ? colors.vit : colors.accent,
                  opacity: selectedActivity ? 1 : 0.4,
                }]}
                onPress={toggleTimer}
                disabled={!selectedActivity}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name={timerRunning ? 'pause' : 'play'} size={16} color="#fff" />
                  <Text style={gs.btnPrimaryText}>{timerRunning ? 'Pause' : 'Start'}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[gs.btnSecondary, { flex: 1 }]} onPress={resetTimer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="refresh" size={16} color={colors.text} />
                  <Text style={gs.btnSecondaryText}>Reset</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          )}

          {/* ── Pomodoro Card ── */}
          {entryMode === 'pomodoro' && (
            <View style={[gs.card, { alignItems: 'center', paddingVertical: 28 }]}>
              <Text style={{ color: pomodoroPhase === 'work' ? colors.foc : colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>
                {pomodoroPhase === 'work' ? `WORK · Round ${pomodoroRound}` : 'BREAK'}
              </Text>
              {activeTask && pomodoroPhase === 'work' && (
                <Text style={{ fontSize: 13, color: colors.textSub, fontWeight: '500', marginBottom: 8, maxWidth: 220, textAlign: 'center' }} numberOfLines={1}>
                  {activeTask.text}
                </Text>
              )}
              <View style={{ marginVertical: 12 }}>
                {(() => {
                  const phaseElapsed = elapsedSecs - phaseStartSecs;
                  const phaseDuration = pomodoroPhase === 'work' ? 25 * 60 : 5 * 60;
                  const progress = phaseElapsed / phaseDuration;
                  const remaining = phaseDuration - phaseElapsed;
                  return (
                    <TimerRing
                      progress={progress}
                      elapsed={formatTime(remaining > 0 ? remaining : 0)}
                      isRunning={timerRunning}
                      color={pomodoroPhase === 'work' ? colors.foc : colors.textMuted}
                    />
                  );
                })()}
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' }}>
                <TouchableOpacity
                  style={[gs.btnPrimary, { flex: 1, backgroundColor: colors.foc, opacity: selectedActivity ? 1 : 0.4 }]}
                  onPress={() => { if (selectedActivity) setTimerRunning(r => !r); }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name={timerRunning ? 'pause' : 'play'} size={16} color="#fff" />
                    <Text style={gs.btnPrimaryText}>{timerRunning ? 'Pause' : 'Start'}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={gs.btnSecondary} onPress={resetPomodoro}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="refresh" size={16} color={colors.text} />
                    <Text style={gs.btnSecondaryText}>Reset</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Pomodoro Save ── */}
          {entryMode === 'pomodoro' && (workSecsAccum > 0 || (pomodoroPhase === 'work' && elapsedSecs > phaseStartSecs)) && (
            <View style={gs.card}>
              <Text style={[gs.cardTitle, { marginBottom: 4 }]}>Session Quality</Text>
              <Text style={[s.feelingHint, { color: colors.textMuted }]}>
                How focused were you? {feeling}/10 · {Math.round((workSecsAccum + (pomodoroPhase === 'work' ? elapsedSecs - phaseStartSecs : 0)) / 60)}m work
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16, justifyContent: 'center' }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[s.scoreBtn, {
                      backgroundColor: feeling === n ? colors.foc : colors.surfaceAlt,
                      borderColor: feeling === n ? colors.foc : colors.border,
                    }]}
                    onPress={() => setFeeling(n)}
                  >
                    <Text style={[s.scoreBtnText, { color: feeling === n ? '#fff' : colors.textSub }]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[gs.btnPrimary, { backgroundColor: colors.foc }]} onPress={saveSession}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={gs.btnPrimaryText}>Save Session</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Feeling + Save (when timer has run) ── */}
          {entryMode === 'timer' && elapsedSecs > 0 && (
            <View style={gs.card}>
              <Text style={[gs.cardTitle, { marginBottom: 4 }]}>Session Quality</Text>
              <Text style={[s.feelingHint, { color: colors.textMuted }]}>How focused were you? {feeling}/10</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16, justifyContent: 'center' }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[s.scoreBtn, {
                      backgroundColor: feeling === n ? colors.foc : colors.surfaceAlt,
                      borderColor: feeling === n ? colors.foc : colors.border,
                    }]}
                    onPress={() => setFeeling(n)}
                  >
                    <Text style={[s.scoreBtnText, { color: feeling === n ? '#fff' : colors.textSub }]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[gs.btnPrimary, { backgroundColor: colors.foc }]} onPress={saveSession}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={gs.btnPrimaryText}>Save Session</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Today's Sessions History ── */}
          {todayLogs.length > 0 && (
            <>
              <Text style={[gs.sectionTitle, { marginTop: 8 }]}>Today's Sessions</Text>
              {todayLogs.map((l, idx) => {
                const col = STAT_COLOR[l.statBoost] ?? colors.accent;
                const actIcon = ACT_ICONS[l.activityName] ?? 'star';
                return (
                  <View
                    key={l.id}
                    style={[gs.card, { padding: 14, marginBottom: 10,
                      opacity: 1 - (idx * 0.12), // subtle fade for older sessions
                    }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[s.sessionIconWrap, { backgroundColor: colors.surfaceAlt }]}>
                        <Ionicons name={actIcon} size={20} color={colors.textSub} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.sessionName, { color: colors.text }]}>{l.activityName}</Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                          <View style={[s.sessionTag, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                            <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: '600' }}>
                              {l.feelingScore}/10
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={[s.sessionDuration, { color: colors.text }]}>{l.durationMinutes}m</Text>
                        <TouchableOpacity onPress={() => deleteMindLog(l.id)}>
                          <Ionicons name="trash-outline" size={16} color={colors.red} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {/* ── Add Custom Activity ── */}
          <Text style={[gs.sectionTitle, { marginTop: 8 }]}>Add Activity</Text>
          <View style={gs.card}>
            <TextInput
              style={[gs.input, { color: colors.text }]}
              placeholder="Activity name (e.g. Journaling)"
              placeholderTextColor={colors.textMuted}
              value={newActivityName}
              onChangeText={setNewActivityName}
            />
            <Text style={[gs.label, { marginBottom: 8 }]}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {STAT_OPTS.map((st) => {
                const stCol = STAT_COLOR[st];
                const stIcon = STAT_ICONS[st] ?? 'star';
                return (
                  <TouchableOpacity
                    key={st}
                    style={[s.statOptBtn, {
                      backgroundColor: newActivityStat === st ? stCol + '20' : colors.surfaceAlt,
                      borderColor: newActivityStat === st ? stCol : colors.border,
                    }]}
                    onPress={() => setNewActivityStat(st)}
                  >
                    <Ionicons name={stIcon} size={12} color={newActivityStat === st ? stCol : colors.textMuted} />
                    <Text style={[s.statOptText, { color: newActivityStat === st ? stCol : colors.textSub }]}>{st}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={[gs.btnPrimary, { backgroundColor: colors.accent }]} onPress={addActivity}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="add-circle" size={18} color="#fff" />
                <Text style={gs.btnPrimaryText}>Add Activity</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 20 }} />
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
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  streakText: { fontWeight: '700', fontSize: 13 },
  currentFocusLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  currentFocusValue: { fontSize: 42, fontWeight: '900', letterSpacing: -1.5, lineHeight: 48 },
  trendsText: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  activityChip: {
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', gap: 6, minWidth: 90,
  },
  chipIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  activityText: { fontSize: 13, fontWeight: '700' },
  statBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  timerGlow: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80 },
  activityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1,
  },
  activityBadgeText: { fontWeight: '700', fontSize: 13 },
  pickHint: { fontSize: 14, fontStyle: 'italic' },
  timerDisplay: { fontSize: 58, fontWeight: '900', letterSpacing: 2, fontVariant: ['tabular-nums'] },
  timerLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 2, marginTop: 4 },
  feelingHint: { fontSize: 13, marginBottom: 4 },
  scoreBtn: {
    width: 42, height: 42, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreBtnText: { fontWeight: '700', fontSize: 14 },
  sessionIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sessionName: { fontSize: 14, fontWeight: '700' },
  sessionTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  sessionDuration: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 11, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1,
    justifyContent: 'center',
  },
  modeBtnText: { fontSize: 14, fontWeight: '500' },
  manualInput: {
    width: 72, height: 72, textAlign: 'center',
    fontSize: 30, fontWeight: '300', letterSpacing: -0.5,
    borderRadius: 12, borderWidth: 1,
  },
  statOptBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
  },
  statOptText: { fontSize: 12, fontWeight: '700' },
});
