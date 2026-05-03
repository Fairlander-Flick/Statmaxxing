import { useState, useEffect } from 'react';
import {
  ScrollView, Text, View, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme, makeGlobalStyles } from '../lib/ThemeContext';
import { useLayout } from '../lib/useLayout';
import {
  saveData, loadData, appendToList, KEYS, toDay, generateId,
  Program, ProgramDay, Exercise, WorkoutLog, SetLog, StepLog,
} from '../lib/storage';
import { awardXP } from '../lib/xp';

type TrainView = 'home' | 'create' | 'run';

export default function TrainScreen() {
  const { colors } = useTheme();
  const layout = useLayout();
  const gs = makeGlobalStyles(colors);

  const [view, setView] = useState<TrainView>('home');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programName, setProgramName] = useState('');
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [activeDay, setActiveDay] = useState<ProgramDay | null>(null);
  const [exerciseStep, setExerciseStep] = useState(0);
  const [setLogs, setSetLogs] = useState<SetLog[]>([]);
  const [currentSets, setCurrentSets] = useState('');
  const [currentReps, setCurrentReps] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [rpe, setRpe] = useState(5);
  const [workoutDone, setWorkoutDone] = useState(false);

  const [stepsInput, setStepsInput] = useState('');
  const [todaySteps, setTodaySteps] = useState(0);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

  useEffect(() => { 
    loadData<Program[]>(KEYS.programs, []).then(setPrograms); 
    loadData<StepLog[]>(KEYS.stepLogs, []).then(logs => {
      const st = logs.find(l => l.date === toDay());
      if (st) setTodaySteps(st.steps);
    });
    loadData<WorkoutLog[]>(KEYS.workoutLogs, []).then(logs =>
      setWorkoutLogs(logs.slice(-10).reverse())
    );
  }, []);

  const saveSteps = async () => {
    const s = parseInt(stepsInput);
    if (isNaN(s) || s <= 0) return;
    const logs = await loadData<StepLog[]>(KEYS.stepLogs, []);
    const today = toDay();
    const idx = logs.findIndex(l => l.date === today);
    if (idx >= 0) {
      logs[idx].steps += s;
      await saveData(KEYS.stepLogs, logs);
      setTodaySteps(logs[idx].steps);
    } else {
      await saveData(KEYS.stepLogs, [...logs, { id: generateId(), date: today, steps: s }]);
      setTodaySteps(s);
    }
    setStepsInput('');
    await awardXP('str', 15);
  };

  const resetTodaySteps = async () => {
    const today = toDay();
    const logs = await loadData<StepLog[]>(KEYS.stepLogs, []);
    const updated = logs.filter(l => l.date !== today);
    await saveData(KEYS.stepLogs, updated);
    setTodaySteps(0);
  };

  const deleteWorkoutLog = async (id: string) => {
    const all = await loadData<WorkoutLog[]>(KEYS.workoutLogs, []);
    const updated = all.filter((l) => l.id !== id);
    await saveData(KEYS.workoutLogs, updated);
    setWorkoutLogs(updated.slice(-10).reverse());
  };

  const addDay = () => setDays([...days, { id: generateId(), label: `Day ${days.length + 1}`, isRest: false, exercises: [] }]);
  const toggleRest = (dayId: string) => setDays(days.map((d) => d.id === dayId ? { ...d, isRest: !d.isRest, exercises: [] } : d));
  const addExercise = (dayId: string) => setDays(days.map((d) => d.id === dayId ? { ...d, exercises: [...d.exercises, { id: generateId(), name: '', targetSets: 3, targetReps: 8, targetWeight: 0 }] } : d));
  const updateExercise = (dayId: string, exId: string, field: keyof Exercise, value: string | number) => setDays(days.map((d) => d.id === dayId ? { ...d, exercises: d.exercises.map((e) => e.id === exId ? { ...e, [field]: value } : e) } : d));
  const removeExercise = (dayId: string, exId: string) => setDays(days.map((d) => d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d));

  const saveProgram = async () => {
    if (!programName.trim() || days.length === 0) return;
    const updated = [...programs, { id: generateId(), name: programName.trim(), days }];
    await saveData(KEYS.programs, updated);
    setPrograms(updated); setProgramName(''); setDays([]); setView('home');
  };

  const startWorkout = (program: Program, day: ProgramDay) => {
    setActiveProgram(program); setActiveDay(day); setExerciseStep(0); setSetLogs([]);
    setCurrentSets(''); setCurrentReps(''); setCurrentWeight(''); setRpe(5); setWorkoutDone(false); setView('run');
  };

  const logCurrentExercise = () => {
    if (!activeDay) return;
    const ex = activeDay.exercises[exerciseStep];
    const newLogs = [...setLogs, { exerciseId: ex.id, exerciseName: ex.name, sets: parseInt(currentSets) || ex.targetSets, reps: parseInt(currentReps) || ex.targetReps, weight: parseFloat(currentWeight) || ex.targetWeight }];
    setSetLogs(newLogs); setCurrentSets(''); setCurrentReps(''); setCurrentWeight('');
    if (exerciseStep + 1 >= activeDay.exercises.length) setWorkoutDone(true);
    else setExerciseStep(exerciseStep + 1);
  };

  const finishWorkout = async () => {
    if (!activeProgram || !activeDay) return;
    await appendToList<WorkoutLog>(KEYS.workoutLogs, { id: generateId(), date: toDay(), programId: activeProgram.id, programName: activeProgram.name, dayLabel: activeDay.label, sets: setLogs, rpe, avgDifficulty: rpe });
    await awardXP('str', 20);
    setView('home'); setWorkoutDone(false);
  };

  const deleteProgram = async (id: string) => {
    Alert.alert('Delete', 'Delete this program?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { const updated = programs.filter((p) => p.id !== id); await saveData(KEYS.programs, updated); setPrograms(updated); } },
    ]);
  };

  const fw = { alignSelf: 'center' as const, width: '100%' as const, maxWidth: layout.inputMaxWidth };
  const contentStyle = { width: '100%', maxWidth: layout.maxWidth, paddingHorizontal: layout.hPadding, paddingTop: 20 };

  // ── HOME ──
  if (view === 'home') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView style={gs.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
          <View style={contentStyle}>
            <Text style={gs.screenTitle}>Train</Text>
            <Text style={gs.screenSub}>Your workout programs</Text>

            <View style={fw}>
              <TouchableOpacity style={[gs.btnPrimary, { backgroundColor: colors.str, marginBottom: 20 }]} onPress={() => setView('create')}>
                <Text style={gs.btnPrimaryText}>＋  Create Program</Text>
              </TouchableOpacity>
            </View>

            <View style={[gs.card, { marginBottom: 20 }]}>
              <Text style={gs.cardTitle}>Daily Steps</Text>
              <Text style={[gs.screenSub, { marginBottom: 16 }]}>Today: {todaySteps.toLocaleString()} steps</Text>
              <View style={[fw, { flexDirection: 'row', gap: 10 }]}>
                <TextInput 
                  style={[gs.input, { flex: 1, marginBottom: 0 }]} 
                  placeholder="e.g. 5000" 
                  placeholderTextColor={colors.textSub} 
                  keyboardType="numeric" 
                  value={stepsInput} 
                  onChangeText={setStepsInput} 
                />
                <TouchableOpacity style={[gs.btnPrimary, { backgroundColor: colors.vit, paddingHorizontal: 20 }]} onPress={saveSteps}>
                  <Text style={gs.btnPrimaryText}>Add</Text>
                </TouchableOpacity>
              </View>
              {todaySteps > 0 && (
                <TouchableOpacity
                  onPress={resetTodaySteps}
                  style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.red + '18', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start' }}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.red} />
                  <Text style={{ color: colors.red, fontWeight: '700', fontSize: 13 }}>Bugünü Sıfırla</Text>
                </TouchableOpacity>
              )}
            </View>

            {programs.length === 0 && (
              <View style={[gs.card, { alignItems: 'center', paddingVertical: 32 }]}>
                <Ionicons name="barbell-outline" size={48} color={colors.textMuted} />
                <Text style={{ color: colors.textSub, textAlign: 'center', marginTop: 12, fontSize: 16 }}>No programs yet.</Text>
                <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 14, marginTop: 4 }}>Create one to get started!</Text>
              </View>
            )}

            {programs.map((prog) => (
              <View key={prog.id} style={[gs.card, { borderColor: colors.str + '30' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18 }}>{prog.name}</Text>
                  <TouchableOpacity style={[s.iconBtn, { backgroundColor: colors.redDim }]} onPress={() => deleteProgram(prog.id)}>
                    <Ionicons name="trash-outline" size={18} color={colors.red} />
                  </TouchableOpacity>
                </View>
                <Text style={{ color: colors.textSub, fontSize: 14, marginBottom: 14 }}>
                  {prog.days.length} days · {prog.days.filter((d) => !d.isRest).length} training days
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {prog.days.map((day) => (
                      <TouchableOpacity key={day.id}
                        style={[s.dayChip, { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                          !day.isRest && { backgroundColor: colors.str + '22', borderColor: colors.str + '88' }]}
                        onPress={() => !day.isRest && startWorkout(prog, day)} disabled={day.isRest}>
                        <Ionicons name={day.isRest ? 'moon-outline' : 'barbell-outline'} size={16} color={day.isRest ? colors.textSub : colors.str} />
                        <Text style={{ color: day.isRest ? colors.textSub : colors.str, fontWeight: '700', fontSize: 13 }}>{day.label}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{day.isRest ? 'Rest' : `${day.exercises.length} ex`}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ))}

            {workoutLogs.length > 0 && (
              <>
                <Text style={gs.sectionTitle}>Recent Workouts</Text>
                {workoutLogs.map((log) => (
                  <View key={log.id} style={[gs.card, { flexDirection: 'row', alignItems: 'center' }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{log.programName}</Text>
                      <Text style={{ color: colors.textSub, fontSize: 13, marginTop: 2 }}>{log.dayLabel} · {log.date}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteWorkoutLog(log.id)} style={{ padding: 8 }}>
                      <Ionicons name="trash-outline" size={18} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
            <View style={{ height: 30 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── CREATE ──
  if (view === 'create') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView style={gs.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ alignItems: 'center' }}>
          <View style={contentStyle}>
            <TouchableOpacity onPress={() => setView('home')} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 }}>
              <Ionicons name="arrow-back" size={22} color={colors.textSub} />
              <Text style={{ color: colors.textSub, fontSize: 16 }}>Back</Text>
            </TouchableOpacity>
            <Text style={gs.screenTitle}>New Program</Text>
            <Text style={gs.screenSub}>Build your custom cycle</Text>

            <View style={fw}>
              <TextInput style={gs.input} placeholder="Program name (e.g. Push/Pull/Legs)" placeholderTextColor={colors.textSub} value={programName} onChangeText={setProgramName} />
            </View>

            {days.map((day) => (
              <View key={day.id} style={[gs.card, { borderColor: day.isRest ? colors.border : colors.str + '55' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18 }}>{day.label}</Text>
                  <TouchableOpacity
                    style={[s.toggleChip, { borderColor: day.isRest ? colors.border : colors.str, backgroundColor: day.isRest ? colors.surfaceAlt : colors.str + '22' }]}
                    onPress={() => toggleRest(day.id)}>
                    <Text style={{ color: day.isRest ? colors.textSub : colors.str, fontSize: 13, fontWeight: '700' }}>{day.isRest ? '😴 Rest Day' : '💪 Training'}</Text>
                  </TouchableOpacity>
                </View>

                {!day.isRest && (
                  <>
                    {day.exercises.map((ex) => (
                      <View key={ex.id} style={[s.exRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                        <TextInput style={[gs.input, { flex: 2, marginBottom: 0, backgroundColor: colors.surface }]} placeholder="Exercise name" placeholderTextColor={colors.textSub} value={ex.name} onChangeText={(v) => updateExercise(day.id, ex.id, 'name', v)} />
                        <TextInput style={[gs.input, { width: 56, marginBottom: 0, textAlign: 'center', backgroundColor: colors.surface }]} placeholder="Sets" placeholderTextColor={colors.textSub} keyboardType="numeric" value={String(ex.targetSets)} onChangeText={(v) => updateExercise(day.id, ex.id, 'targetSets', parseInt(v) || 0)} />
                        <TextInput style={[gs.input, { width: 56, marginBottom: 0, textAlign: 'center', backgroundColor: colors.surface }]} placeholder="Reps" placeholderTextColor={colors.textSub} keyboardType="numeric" value={String(ex.targetReps)} onChangeText={(v) => updateExercise(day.id, ex.id, 'targetReps', parseInt(v) || 0)} />
                        <TextInput style={[gs.input, { width: 68, marginBottom: 0, textAlign: 'center', backgroundColor: colors.surface }]} placeholder="kg" placeholderTextColor={colors.textSub} keyboardType="decimal-pad" value={String(ex.targetWeight || '')} onChangeText={(v) => updateExercise(day.id, ex.id, 'targetWeight', parseFloat(v) || 0)} />
                        <TouchableOpacity onPress={() => removeExercise(day.id, ex.id)} style={[s.iconBtn, { backgroundColor: colors.redDim }]}>
                          <Ionicons name="close" size={16} color={colors.red} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity style={[gs.btnSecondary, { marginTop: 8 }]} onPress={() => addExercise(day.id)}>
                      <Text style={gs.btnSecondaryText}>＋ Add Exercise</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ))}

            <View style={fw}>
              <TouchableOpacity style={[gs.btnSecondary, { marginBottom: 10, borderStyle: 'dashed' }]} onPress={addDay}>
                <Text style={gs.btnSecondaryText}>＋ Add Day</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[gs.btnPrimary, { backgroundColor: colors.str }]} onPress={saveProgram}>
                <Text style={gs.btnPrimaryText}>Save Program</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 30 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── WORKOUT RUNNER ──
  if (view === 'run' && activeDay && activeProgram) {
    if (workoutDone) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <ScrollView style={gs.container} contentContainerStyle={{ alignItems: 'center' }}>
            <View style={contentStyle}>
              <Text style={[gs.screenTitle, { color: colors.str }]}>Done! 💪</Text>
              <Text style={gs.screenSub}>{activeProgram.name} · {activeDay.label}</Text>
              <Text style={gs.sectionTitle}>Exercises Logged</Text>
              {setLogs.map((l, i) => (
                <View key={i} style={[gs.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16, flex: 1 }}>{l.exerciseName}</Text>
                  <Text style={{ color: colors.textSub, fontSize: 14 }}>{l.sets}×{l.reps} @ {l.weight}kg</Text>
                </View>
              ))}
              <View style={gs.card}>
                <Text style={[gs.cardTitle, { textAlign: 'center', marginBottom: 16 }]}>How did it feel? {rpe}/10</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <TouchableOpacity key={n} style={[s.scoreBtn, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }, rpe === n && { backgroundColor: colors.str, borderColor: colors.str }]} onPress={() => setRpe(n)}>
                      <Text style={[s.scoreBtnText, { color: rpe === n ? '#fff' : colors.textSub }]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 13, marginBottom: 16 }}>1 = Max effort · 10 = Too easy</Text>
              </View>
              <View style={fw}>
                <TouchableOpacity style={[gs.btnPrimary, { backgroundColor: colors.str }]} onPress={finishWorkout}>
                  <Text style={gs.btnPrimaryText}>Finish & Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    const currentExercise = activeDay.exercises[exerciseStep];
    const progress = exerciseStep / activeDay.exercises.length;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView style={gs.container} keyboardShouldPersistTaps="handled" contentContainerStyle={{ alignItems: 'center' }}>
          <View style={contentStyle}>
            <TouchableOpacity onPress={() => setView('home')} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 }}>
              <Ionicons name="arrow-back" size={22} color={colors.textSub} />
              <Text style={{ color: colors.textSub, fontSize: 16 }}>Cancel Workout</Text>
            </TouchableOpacity>
            <Text style={[gs.screenTitle, { color: colors.str }]}>{activeProgram.name}</Text>
            <Text style={gs.screenSub}>{activeDay.label}</Text>

            {/* Progress */}
            <View style={[gs.card, { padding: 16 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ color: colors.textSub, fontSize: 15 }}>Exercise {exerciseStep + 1} / {activeDay.exercises.length}</Text>
                <Text style={{ color: colors.str, fontSize: 15, fontWeight: '800' }}>{Math.round(progress * 100)}%</Text>
              </View>
              <View style={{ height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${progress * 100}%` as any, backgroundColor: colors.str, borderRadius: 4 }} />
              </View>
            </View>

            {/* Current exercise */}
            <View style={[gs.card, { borderColor: colors.str + '55' }]}>
              <Text style={{ color: colors.str, fontWeight: '900', fontSize: 24, marginBottom: 6 }}>{currentExercise.name}</Text>
              <Text style={{ color: colors.textSub, fontSize: 15, marginBottom: 24 }}>
                Target: {currentExercise.targetSets} × {currentExercise.targetReps} @ {currentExercise.targetWeight > 0 ? `${currentExercise.targetWeight} kg` : 'bodyweight'}
              </Text>
              <View style={fw}>
                <Text style={gs.label}>Sets done</Text>
                <TextInput style={gs.input} placeholder={String(currentExercise.targetSets)} placeholderTextColor={colors.textSub} keyboardType="numeric" value={currentSets} onChangeText={setCurrentSets} />
                <Text style={gs.label}>Reps</Text>
                <TextInput style={gs.input} placeholder={String(currentExercise.targetReps)} placeholderTextColor={colors.textSub} keyboardType="numeric" value={currentReps} onChangeText={setCurrentReps} />
                <Text style={gs.label}>Weight (kg)</Text>
                <TextInput style={gs.input} placeholder={currentExercise.targetWeight > 0 ? String(currentExercise.targetWeight) : 'bodyweight'} placeholderTextColor={colors.textSub} keyboardType="decimal-pad" value={currentWeight} onChangeText={setCurrentWeight} />
                <TouchableOpacity style={[gs.btnPrimary, { backgroundColor: colors.str }]} onPress={logCurrentExercise}>
                  <Text style={gs.btnPrimaryText}>{exerciseStep + 1 >= activeDay.exercises.length ? 'Finish Exercises ✓' : 'Next Exercise →'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  return null;
}

const s = StyleSheet.create({
  dayChip: { borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', minWidth: 72, gap: 4 },
  toggleChip: { borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  exRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 10, padding: 10, borderRadius: 14, borderWidth: 1 },
  scoreBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  scoreBtnText: { fontWeight: '700', fontSize: 14 },
});
