import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView, Text, View, StyleSheet, TouchableOpacity,
  TextInput, Modal, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, globalStyles } from '../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  saveData, loadData, appendToList, KEYS, toDay, generateId,
  SleepLog, WaterLog, WeightLog, FoodItem, NutritionLog, Macro,
} from '../lib/storage';

type HealthTab = 'sleep' | 'water' | 'weight' | 'nutrition';

const WATER_GOAL_DEFAULT = 2500;

export default function HealthScreen() {
  const [activeTab, setActiveTab] = useState<HealthTab>('sleep');

  // Sleep
  const [sleepHours, setSleepHours] = useState('');

  // Water
  const [waterToday, setWaterToday] = useState(0);
  const [waterGoal, setWaterGoal] = useState(WATER_GOAL_DEFAULT);

  // Weight
  const [weightKg, setWeightKg] = useState('');
  const [weightHistory, setWeightHistory] = useState<WeightLog[]>([]);

  // Nutrition
  const [foodName, setFoodName] = useState('');
  const [baseGrams, setBaseGrams] = useState('');
  const [baseCalories, setBaseCalories] = useState('');
  const [baseCarbs, setBaseCarbs] = useState('');
  const [baseProtein, setBaseProtein] = useState('');
  const [baseFat, setBaseFat] = useState('');
  const [baseFiber, setBaseFiber] = useState('');
  const [actualGrams, setActualGrams] = useState('');
  const [foodLibrary, setFoodLibrary] = useState<FoodItem[]>([]);
  const [todayNutrition, setTodayNutrition] = useState<NutritionLog[]>([]);

  const today = toDay();

  useEffect(() => {
    loadTodayWater();
    loadData<number>(KEYS.waterGoal, WATER_GOAL_DEFAULT).then(setWaterGoal);
    loadData<WeightLog[]>(KEYS.weightLogs, []).then(setWeightHistory);
    loadData<FoodItem[]>(KEYS.foodLibrary, []).then(setFoodLibrary);
    loadData<NutritionLog[]>(KEYS.nutritionLogs, []).then((logs) => {
      setTodayNutrition(logs.filter((l) => l.date === today));
    });
  }, []);

  const loadTodayWater = async () => {
    const logs = await loadData<WaterLog[]>(KEYS.waterLogs, []);
    const todayLog = logs.find((l) => l.date === today);
    setWaterToday(todayLog?.totalMl ?? 0);
  };

  const addWater = useCallback(async (ml: number) => {
    const logs = await loadData<WaterLog[]>(KEYS.waterLogs, []);
    const idx = logs.findIndex((l) => l.date === today);
    if (idx >= 0) {
      logs[idx].totalMl += ml;
      await saveData(KEYS.waterLogs, logs);
      setWaterToday(logs[idx].totalMl);
    } else {
      const newLog: WaterLog = { id: generateId(), date: today, totalMl: ml };
      const updated = [...logs, newLog];
      await saveData(KEYS.waterLogs, updated);
      setWaterToday(ml);
    }
  }, [today]);

  const saveSleep = async () => {
    const hrs = parseFloat(sleepHours);
    if (isNaN(hrs) || hrs <= 0) return;
    const log: SleepLog = { id: generateId(), date: today, hours: hrs };
    await appendToList<SleepLog>(KEYS.sleepLogs, log);
    setSleepHours('');
    alert(`Saved: ${hrs} hours sleep`);
  };

  const saveWeight = async () => {
    const kg = parseFloat(weightKg);
    if (isNaN(kg) || kg <= 0) return;
    const log: WeightLog = { id: generateId(), date: today, kg };
    const updated = await appendToList<WeightLog>(KEYS.weightLogs, log);
    setWeightHistory(updated);
    setWeightKg('');
  };

  const saveFood = async () => {
    const base = parseFloat(baseGrams);
    const actual = parseFloat(actualGrams);
    if (!foodName || isNaN(base) || isNaN(actual)) return;
    const multiplier = actual / base;
    const macros: Macro = {
      calories: parseFloat(baseCalories || '0') * multiplier,
      carbs: parseFloat(baseCarbs || '0') * multiplier,
      protein: parseFloat(baseProtein || '0') * multiplier,
      fat: parseFloat(baseFat || '0') * multiplier,
      fiber: parseFloat(baseFiber || '0') * multiplier,
    };
    // Save to food library if new
    const foodId = generateId();
    const foodItem: FoodItem = {
      id: foodId, name: foodName, baseGrams: base,
      baseMacros: {
        calories: parseFloat(baseCalories || '0'),
        carbs: parseFloat(baseCarbs || '0'),
        protein: parseFloat(baseProtein || '0'),
        fat: parseFloat(baseFat || '0'),
        fiber: parseFloat(baseFiber || '0'),
      },
    };
    const updatedLib = [...foodLibrary, foodItem];
    await saveData(KEYS.foodLibrary, updatedLib);
    setFoodLibrary(updatedLib);

    const log: NutritionLog = {
      id: generateId(), date: today, foodId, foodName, multiplier, macros,
    };
    const updatedLogs = await appendToList<NutritionLog>(KEYS.nutritionLogs, log);
    setTodayNutrition(updatedLogs.filter((l) => l.date === today));
    // Reset
    setFoodName(''); setBaseGrams(''); setActualGrams('');
    setBaseCalories(''); setBaseCarbs(''); setBaseProtein('');
    setBaseFat(''); setBaseFiber('');
  };

  const waterPct = Math.min((waterToday / waterGoal) * 100, 100);
  const recentWeights = weightHistory.slice(-7).reverse();

  const totalToday: Macro = todayNutrition.reduce(
    (acc, l) => ({
      calories: acc.calories + l.macros.calories,
      carbs: acc.carbs + l.macros.carbs,
      protein: acc.protein + l.macros.protein,
      fat: acc.fat + l.macros.fat,
      fiber: acc.fiber + l.macros.fiber,
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 },
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Tab Selector */}
      <View style={styles.tabRow}>
        {(['sleep', 'water', 'weight', 'nutrition'] as HealthTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, activeTab === t && { backgroundColor: COLORS.cyan }]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabBtnText, activeTab === t && { color: '#000' }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
        {/* ── SLEEP ── */}
        {activeTab === 'sleep' && (
          <View>
            <Text style={globalStyles.screenTitle}>Sleep</Text>
            <Text style={globalStyles.screenSub}>Log your nightly rest</Text>
            <View style={globalStyles.card}>
              <Text style={globalStyles.label}>Hours slept</Text>
              <TextInput
                style={globalStyles.input}
                placeholder="e.g. 7.5"
                placeholderTextColor={COLORS.textSub}
                keyboardType="decimal-pad"
                value={sleepHours}
                onChangeText={setSleepHours}
              />
              <TouchableOpacity style={globalStyles.btnPrimary} onPress={saveSleep}>
                <Text style={globalStyles.btnPrimaryText}>Save Sleep</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── WATER ── */}
        {activeTab === 'water' && (
          <View>
            <Text style={globalStyles.screenTitle}>Water</Text>
            <Text style={globalStyles.screenSub}>Daily goal: {waterGoal} ml</Text>
            {/* Bottle / Progress */}
            <View style={[globalStyles.card, { alignItems: 'center' }]}>
              <View style={styles.bottleOuter}>
                <Animated.View
                  style={[
                    styles.bottleFill,
                    { height: `${waterPct}%`, backgroundColor: COLORS.cyan },
                  ]}
                />
              </View>
              <Text style={styles.waterAmount}>{waterToday} ml</Text>
              <Text style={{ color: COLORS.textSub, fontSize: 13 }}>
                {waterPct.toFixed(0)}% of daily goal
              </Text>
            </View>
            {/* Quick add buttons */}
            <Text style={globalStyles.sectionTitle}>Quick Add</Text>
            <View style={styles.quickRow}>
              {[150, 250, 330, 500].map((ml) => (
                <TouchableOpacity key={ml} style={styles.quickBtn} onPress={() => addWater(ml)}>
                  <Ionicons name="water" size={18} color={COLORS.cyan} />
                  <Text style={styles.quickBtnText}>+{ml}ml</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── WEIGHT ── */}
        {activeTab === 'weight' && (
          <View>
            <Text style={globalStyles.screenTitle}>Weight</Text>
            <Text style={globalStyles.screenSub}>Log your morning weight</Text>
            <View style={globalStyles.card}>
              <Text style={globalStyles.label}>Weight (kg)</Text>
              <TextInput
                style={globalStyles.input}
                placeholder="e.g. 75.4"
                placeholderTextColor={COLORS.textSub}
                keyboardType="decimal-pad"
                value={weightKg}
                onChangeText={setWeightKg}
              />
              <TouchableOpacity style={globalStyles.btnPrimary} onPress={saveWeight}>
                <Text style={globalStyles.btnPrimaryText}>Log Weight</Text>
              </TouchableOpacity>
            </View>
            {/* History */}
            {recentWeights.length > 0 && (
              <>
                <Text style={globalStyles.sectionTitle}>Recent</Text>
                {recentWeights.map((w) => (
                  <View key={w.id} style={[globalStyles.card, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                    <Text style={{ color: COLORS.textSub, fontSize: 13 }}>{w.date}</Text>
                    <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 16 }}>{w.kg} kg</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* ── NUTRITION ── */}
        {activeTab === 'nutrition' && (
          <View>
            <Text style={globalStyles.screenTitle}>Nutrition</Text>
            <Text style={globalStyles.screenSub}>Log food with macros</Text>

            {/* Today's totals */}
            <View style={globalStyles.card}>
              <Text style={styles.cardTitle}>Today's Totals</Text>
              <View style={styles.macroRow}>
                <MacroChip label="Kcal" value={totalToday.calories} color={COLORS.yellow} />
                <MacroChip label="Carbs" value={totalToday.carbs} color={COLORS.orange} />
                <MacroChip label="Protein" value={totalToday.protein} color={COLORS.cyan} />
                <MacroChip label="Fat" value={totalToday.fat} color={COLORS.red} />
                <MacroChip label="Fiber" value={totalToday.fiber} color={COLORS.green} />
              </View>
            </View>

            {/* Food entry form */}
            <View style={globalStyles.card}>
              <Text style={styles.cardTitle}>Add Food</Text>
              <TextInput style={globalStyles.input} placeholder="Food name" placeholderTextColor={COLORS.textSub} value={foodName} onChangeText={setFoodName} />
              <Text style={globalStyles.label}>Base macros (per {baseGrams || '100'}g)</Text>
              <TextInput style={globalStyles.input} placeholder="Base grams (e.g. 100)" placeholderTextColor={COLORS.textSub} keyboardType="decimal-pad" value={baseGrams} onChangeText={setBaseGrams} />
              <View style={styles.macroInputRow}>
                <TextInput style={[globalStyles.input, styles.macroInput]} placeholder="Kcal" placeholderTextColor={COLORS.textSub} keyboardType="decimal-pad" value={baseCalories} onChangeText={setBaseCalories} />
                <TextInput style={[globalStyles.input, styles.macroInput]} placeholder="Carbs g" placeholderTextColor={COLORS.textSub} keyboardType="decimal-pad" value={baseCarbs} onChangeText={setBaseCarbs} />
                <TextInput style={[globalStyles.input, styles.macroInput]} placeholder="Prot g" placeholderTextColor={COLORS.textSub} keyboardType="decimal-pad" value={baseProtein} onChangeText={setBaseProtein} />
                <TextInput style={[globalStyles.input, styles.macroInput]} placeholder="Fat g" placeholderTextColor={COLORS.textSub} keyboardType="decimal-pad" value={baseFat} onChangeText={setBaseFat} />
                <TextInput style={[globalStyles.input, styles.macroInput]} placeholder="Fiber g" placeholderTextColor={COLORS.textSub} keyboardType="decimal-pad" value={baseFiber} onChangeText={setBaseFiber} />
              </View>
              <Text style={globalStyles.label}>How much did you eat? (grams)</Text>
              <TextInput style={globalStyles.input} placeholder="e.g. 150" placeholderTextColor={COLORS.textSub} keyboardType="decimal-pad" value={actualGrams} onChangeText={setActualGrams} />
              {baseGrams && actualGrams && (
                <Text style={{ color: COLORS.textSub, fontSize: 12, marginBottom: 12 }}>
                  Multiplier: ×{(parseFloat(actualGrams) / parseFloat(baseGrams)).toFixed(2)}
                </Text>
              )}
              <TouchableOpacity style={globalStyles.btnPrimary} onPress={saveFood}>
                <Text style={globalStyles.btnPrimaryText}>Add to Today</Text>
              </TouchableOpacity>
            </View>

            {/* Today's food log */}
            {todayNutrition.length > 0 && (
              <>
                <Text style={globalStyles.sectionTitle}>Today's Meals</Text>
                {todayNutrition.map((l) => (
                  <View key={l.id} style={globalStyles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: COLORS.text, fontWeight: '700' }}>{l.foodName}</Text>
                      <Text style={{ color: COLORS.yellow, fontWeight: '700' }}>{l.macros.calories.toFixed(0)} kcal</Text>
                    </View>
                    <Text style={{ color: COLORS.textSub, fontSize: 12, marginTop: 4 }}>
                      C:{l.macros.carbs.toFixed(1)}g  P:{l.macros.protein.toFixed(1)}g  F:{l.macros.fat.toFixed(1)}g  Fiber:{l.macros.fiber.toFixed(1)}g
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.macroChip, { borderColor: color + '44' }]}>
      <Text style={{ color, fontWeight: '800', fontSize: 15 }}>{value.toFixed(0)}</Text>
      <Text style={{ color: COLORS.textSub, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  tabBtnText: {
    color: COLORS.textSub,
    fontSize: 12,
    fontWeight: '600',
  },
  bottleOuter: {
    width: 80,
    height: 200,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 40,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderWidth: 2,
    borderColor: COLORS.cyan + '66',
    marginVertical: 16,
  },
  bottleFill: {
    width: '100%',
    borderRadius: 40,
  },
  waterAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.cyan,
    marginBottom: 4,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.cyanDim,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cyan + '44',
    gap: 4,
  },
  quickBtnText: {
    color: COLORS.cyan,
    fontWeight: '700',
    fontSize: 13,
  },
  cardTitle: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroChip: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  macroInputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  macroInput: {
    width: '30%',
    fontSize: 13,
    paddingHorizontal: 10,
  },
});
