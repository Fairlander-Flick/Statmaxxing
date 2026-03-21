import { useState, useEffect } from 'react';
import {
  ScrollView, Text, View, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, globalStyles } from '../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  saveData, loadData, appendToList, KEYS, toDay, generateId,
  Program, ProgramDay, Exercise, WorkoutLog, SetLog,
} from '../lib/storage';

type TrainView = 'home' | 'create' | 'run';

export default function TrainScreen() {
  const [view, setView] = useState<TrainView>('home');
  const [programs, setPrograms] = useState<Program[]>([]);

  // Program builder state
  const [programName, setProgramName] = useState('');
  const [days, setDays] = useState<ProgramDay[]>([]);

  // Active workout runner state
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [activeDay, setActiveDay] = useState<ProgramDay | null>(null);
  const [exerciseStep, setExerciseStep] = useState(0);
  const [setLogs, setSetLogs] = useState<SetLog[]>([]);
  const [currentSets, setCurrentSets] = useState('');
  const [currentReps, setCurrentReps] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [rpe, setRpe] = useState(5);
  const [workoutDone, setWorkoutDone] = useState(false);

  useEffect(() => {
    loadData<Program[]>(KEYS.programs, []).then(setPrograms);
  }, []);

  // ── PROGRAM BUILDER HELPERS ──
  const addDay = () => {
    const day: ProgramDay = {
      id: generateId(),
      label: `Day ${days.length + 1}`,
      isRest: false,
      exercises: [],
    };
    setDays([...days, day]);
  };

  const toggleRest = (dayId: string) => {
    setDays(days.map((d) => d.id === dayId ? { ...d, isRest: !d.isRest, exercises: [] } : d));
  };

  const addExercise = (dayId: string) => {
    const ex: Exercise = {
      id: generateId(), name: '', targetSets: 3, targetReps: 8, targetWeight: 0,
    };
    setDays(days.map((d) => d.id === dayId ? { ...d, exercises: [...d.exercises, ex] } : d));
  };

  const updateExercise = (dayId: string, exId: string, field: keyof Exercise, value: string | number) => {
    setDays(days.map((d) =>
      d.id === dayId
        ? { ...d, exercises: d.exercises.map((e) => e.id === exId ? { ...e, [field]: value } : e) }
        : d
    ));
  };

  const removeExercise = (dayId: string, exId: string) => {
    setDays(days.map((d) => d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d));
  };

  const saveProgram = async () => {
    if (!programName.trim() || days.length === 0) return;
    const program: Program = { id: generateId(), name: programName.trim(), days };
    const updated = [...programs, program];
    await saveData(KEYS.programs, updated);
    setPrograms(updated);
    setProgramName('');
    setDays([]);
    setView('home');
  };

  // ── WORKOUT RUNNER HELPERS ──
  const startWorkout = (program: Program, day: ProgramDay) => {
    setActiveProgram(program);
    setActiveDay(day);
    setExerciseStep(0);
    setSetLogs([]);
    setCurrentSets('');
    setCurrentReps('');
    setCurrentWeight('');
    setRpe(5);
    setWorkoutDone(false);
    setView('run');
  };

  const logCurrentExercise = () => {
    if (!activeDay) return;
    const ex = activeDay.exercises[exerciseStep];
    const log: SetLog = {
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: parseInt(currentSets) || ex.targetSets,
      reps: parseInt(currentReps) || ex.targetReps,
      weight: parseFloat(currentWeight) || ex.targetWeight,
    };
    const newLogs = [...setLogs, log];
    setSetLogs(newLogs);
    setCurrentSets('');
    setCurrentReps('');
    setCurrentWeight('');
    if (exerciseStep + 1 >= activeDay.exercises.length) {
      setWorkoutDone(true);
    } else {
      setExerciseStep(exerciseStep + 1);
    }
  };

  const finishWorkout = async () => {
    if (!activeProgram || !activeDay) return;
    const avgDifficulty = 10 - rpe + 1; // RPE 10=easiest → difficulty 1; RPE 1=hardest → difficulty 10
    const log: WorkoutLog = {
      id: generateId(),
      date: toDay(),
      programId: activeProgram.id,
      programName: activeProgram.name,
      dayLabel: activeDay.label,
      sets: setLogs,
      rpe,
      avgDifficulty: rpe,
    };
    await appendToList<WorkoutLog>(KEYS.workoutLogs, log);
    setView('home');
    setWorkoutDone(false);
  };

  const deleteProgram = async (id: string) => {
    Alert.alert('Delete', 'Delete this program?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = programs.filter((p) => p.id !== id);
          await saveData(KEYS.programs, updated);
          setPrograms(updated);
        },
      },
    ]);
  };

  // ─────────────────────────────────────
  // ── HOME VIEW ──
  if (view === 'home') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
          <Text style={globalStyles.screenTitle}>Train</Text>
          <Text style={globalStyles.screenSub}>Your workout programs</Text>

          <TouchableOpacity
            style={[globalStyles.btnPrimary, { backgroundColor: COLORS.str, marginBottom: 20 }]}
            onPress={() => setView('create')}
          >
            <Text style={globalStyles.btnPrimaryText}>+ Create Your Program</Text>
          </TouchableOpacity>

          {programs.length === 0 && (
            <View style={globalStyles.card}>
              <Text style={{ color: COLORS.textSub, textAlign: 'center', paddingVertical: 20 }}>
                No programs yet. Create one to get started!
              </Text>
            </View>
          )}

          {programs.map((prog) => (
            <View key={prog.id} style={globalStyles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ color: COLORS.text, fontWeight: '800', fontSize: 16 }}>{prog.name}</Text>
                <TouchableOpacity onPress={() => deleteProgram(prog.id)}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                </TouchableOpacity>
              </View>
              <Text style={{ color: COLORS.textSub, fontSize: 13, marginBottom: 12 }}>
                {prog.days.length} days · {prog.days.filter((d) => !d.isRest).length} training days
              </Text>
              {/* Day selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {prog.days.map((day) => (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      styles.dayChip,
                      day.isRest ? { backgroundColor: COLORS.surfaceAlt } : { backgroundColor: COLORS.str + '22', borderColor: COLORS.str + '66' },
                    ]}
                    onPress={() => !day.isRest && startWorkout(prog, day)}
                    disabled={day.isRest}
                  >
                    <Text style={{ color: day.isRest ? COLORS.textSub : COLORS.str, fontWeight: '700', fontSize: 12 }}>
                      {day.label}
                    </Text>
                    <Text style={{ color: COLORS.textSub, fontSize: 10, marginTop: 2 }}>
                      {day.isRest ? 'Rest' : `${day.exercises.length} ex`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────
  // ── CREATE PROGRAM VIEW ──
  if (view === 'create') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => setView('home')} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textSub} />
            <Text style={{ color: COLORS.textSub, marginLeft: 6, fontSize: 14 }}>Back</Text>
          </TouchableOpacity>
          <Text style={globalStyles.screenTitle}>New Program</Text>
          <Text style={globalStyles.screenSub}>Build your custom cycle</Text>

          <TextInput
            style={[globalStyles.input, { marginBottom: 16 }]}
            placeholder="Program name (e.g. Push/Pull/Legs)"
            placeholderTextColor={COLORS.textSub}
            value={programName}
            onChangeText={setProgramName}
          />

          {days.map((day, di) => (
            <View key={day.id} style={[globalStyles.card, { borderColor: day.isRest ? COLORS.border : COLORS.str + '44' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 15 }}>{day.label}</Text>
                <TouchableOpacity
                  style={[styles.restToggle, day.isRest && { backgroundColor: COLORS.surfaceAlt, borderColor: COLORS.textSub }]}
                  onPress={() => toggleRest(day.id)}
                >
                  <Text style={{ color: day.isRest ? COLORS.textSub : COLORS.str, fontSize: 12, fontWeight: '700' }}>
                    {day.isRest ? '😴 Rest' : '💪 Training'}
                  </Text>
                </TouchableOpacity>
              </View>

              {!day.isRest && (
                <>
                  {day.exercises.map((ex) => (
                    <View key={ex.id} style={styles.exRow}>
                      <TextInput
                        style={[globalStyles.input, { flex: 2, marginBottom: 0 }]}
                        placeholder="Exercise name"
                        placeholderTextColor={COLORS.textSub}
                        value={ex.name}
                        onChangeText={(v) => updateExercise(day.id, ex.id, 'name', v)}
                      />
                      <TextInput
                        style={[globalStyles.input, { width: 52, marginBottom: 0, textAlign: 'center' }]}
                        placeholder="Sets"
                        placeholderTextColor={COLORS.textSub}
                        keyboardType="numeric"
                        value={String(ex.targetSets)}
                        onChangeText={(v) => updateExercise(day.id, ex.id, 'targetSets', parseInt(v) || 0)}
                      />
                      <TextInput
                        style={[globalStyles.input, { width: 52, marginBottom: 0, textAlign: 'center' }]}
                        placeholder="Reps"
                        placeholderTextColor={COLORS.textSub}
                        keyboardType="numeric"
                        value={String(ex.targetReps)}
                        onChangeText={(v) => updateExercise(day.id, ex.id, 'targetReps', parseInt(v) || 0)}
                      />
                      <TextInput
                        style={[globalStyles.input, { width: 64, marginBottom: 0, textAlign: 'center' }]}
                        placeholder="kg"
                        placeholderTextColor={COLORS.textSub}
                        keyboardType="decimal-pad"
                        value={String(ex.targetWeight || '')}
                        onChangeText={(v) => updateExercise(day.id, ex.id, 'targetWeight', parseFloat(v) || 0)}
                      />
                      <TouchableOpacity onPress={() => removeExercise(day.id, ex.id)}>
                        <Ionicons name="close-circle" size={22} color={COLORS.red} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={[globalStyles.btnSecondary, { marginTop: 8 }]}
                    onPress={() => addExercise(day.id)}
                  >
                    <Text style={globalStyles.btnSecondaryText}>+ Add Exercise</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))}

          <TouchableOpacity style={[globalStyles.btnSecondary, { marginBottom: 12, borderStyle: 'dashed' }]} onPress={addDay}>
            <Text style={globalStyles.btnSecondaryText}>+ Add Day</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[globalStyles.btnPrimary, { backgroundColor: COLORS.str }]} onPress={saveProgram}>
            <Text style={globalStyles.btnPrimaryText}>Save Program</Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────
  // ── WORKOUT RUNNER VIEW ──
  if (view === 'run' && activeDay && activeProgram) {
    if (workoutDone) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
          <ScrollView style={globalStyles.container}>
            <Text style={[globalStyles.screenTitle, { color: COLORS.str }]}>Workout Complete! 💪</Text>
            <Text style={globalStyles.screenSub}>{activeProgram.name} · {activeDay.label}</Text>

            <Text style={globalStyles.sectionTitle}>Exercises Done</Text>
            {setLogs.map((l, i) => (
              <View key={i} style={globalStyles.card}>
                <Text style={{ color: COLORS.text, fontWeight: '700' }}>{l.exerciseName}</Text>
                <Text style={{ color: COLORS.textSub, fontSize: 13, marginTop: 4 }}>
                  {l.sets} sets × {l.reps} reps @ {l.weight} kg
                </Text>
              </View>
            ))}

            <View style={globalStyles.card}>
              <Text style={globalStyles.label}>How did it feel? ({rpe}/10)</Text>
              <Text style={{ color: COLORS.textSub, fontSize: 12, marginBottom: 10 }}>
                10 = Too easy  ·  1 = Couldn't do one more rep
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.scoreBtn, rpe === n && { backgroundColor: COLORS.str, borderColor: COLORS.str }]}
                      onPress={() => setRpe(n)}
                    >
                      <Text style={[styles.scoreBtnText, rpe === n && { color: '#fff' }]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <TouchableOpacity style={[globalStyles.btnPrimary, { backgroundColor: COLORS.str }]} onPress={finishWorkout}>
              <Text style={globalStyles.btnPrimaryText}>Finish & Save</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    const currentExercise = activeDay.exercises[exerciseStep];
    const progress = exerciseStep / activeDay.exercises.length;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <ScrollView style={globalStyles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => { setView('home'); }} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textSub} />
            <Text style={{ color: COLORS.textSub, marginLeft: 6, fontSize: 14 }}>Cancel Workout</Text>
          </TouchableOpacity>

          <Text style={[globalStyles.screenTitle, { color: COLORS.str }]}>{activeProgram.name}</Text>
          <Text style={globalStyles.screenSub}>{activeDay.label}</Text>

          {/* Progress Bar */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: COLORS.textSub, fontSize: 13 }}>
                Exercise {exerciseStep + 1} of {activeDay.exercises.length}
              </Text>
              <Text style={{ color: COLORS.str, fontSize: 13, fontWeight: '700' }}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
            <View style={{ height: 6, backgroundColor: COLORS.surfaceAlt, borderRadius: 3, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: COLORS.str, borderRadius: 3 }} />
            </View>
          </View>

          {/* Current exercise */}
          <View style={[globalStyles.card, { borderColor: COLORS.str + '44' }]}>
            <Text style={{ color: COLORS.str, fontWeight: '800', fontSize: 20, marginBottom: 4 }}>
              {currentExercise.name}
            </Text>
            <Text style={{ color: COLORS.textSub, fontSize: 13, marginBottom: 20 }}>
              Target: {currentExercise.targetSets} sets × {currentExercise.targetReps} reps @ {currentExercise.targetWeight > 0 ? `${currentExercise.targetWeight} kg` : 'bodyweight'}
            </Text>

            <Text style={globalStyles.label}>Actual sets done</Text>
            <TextInput
              style={globalStyles.input}
              placeholder={String(currentExercise.targetSets)}
              placeholderTextColor={COLORS.textSub}
              keyboardType="numeric"
              value={currentSets}
              onChangeText={setCurrentSets}
            />
            <Text style={globalStyles.label}>Actual reps</Text>
            <TextInput
              style={globalStyles.input}
              placeholder={String(currentExercise.targetReps)}
              placeholderTextColor={COLORS.textSub}
              keyboardType="numeric"
              value={currentReps}
              onChangeText={setCurrentReps}
            />
            <Text style={globalStyles.label}>Weight used (kg)</Text>
            <TextInput
              style={globalStyles.input}
              placeholder={currentExercise.targetWeight > 0 ? String(currentExercise.targetWeight) : 'bodyweight'}
              placeholderTextColor={COLORS.textSub}
              keyboardType="decimal-pad"
              value={currentWeight}
              onChangeText={setCurrentWeight}
            />
            <TouchableOpacity
              style={[globalStyles.btnPrimary, { backgroundColor: COLORS.str }]}
              onPress={logCurrentExercise}
            >
              <Text style={globalStyles.btnPrimaryText}>
                {exerciseStep + 1 >= activeDay.exercises.length ? 'Finish Exercises' : 'Next Exercise →'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  dayChip: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 64,
  },
  restToggle: {
    borderWidth: 1,
    borderColor: COLORS.str + '66',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.str + '22',
  },
  exRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreBtn: {
    width: 38,
    height: 38,
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
    fontSize: 13,
  },
});
