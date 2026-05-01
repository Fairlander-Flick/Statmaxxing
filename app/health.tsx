import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollView, Text, View, StyleSheet, TouchableOpacity,
  TextInput, Modal, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme, makeGlobalStyles } from '../lib/ThemeContext';
import { useLayout } from '../lib/useLayout';
import {
  saveData, loadData, appendToList, KEYS, toDay, generateId,
  SleepLog, WaterLog, WeightLog, FoodItem, NutritionLog, Macro,
} from '../lib/storage';

type HealthTab = 'sleep' | 'water' | 'weight' | 'nutrition';
const WATER_GOAL_DEFAULT = 2500;

export default function HealthScreen() {
  const { colors } = useTheme();
  const layout = useLayout();
  const gs = makeGlobalStyles(colors);
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const TAB_CONFIG: { id: HealthTab; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; color: string }[] = [
    { id: 'sleep', label: 'Sleep', icon: 'moon-outline', color: colors.art },
    { id: 'water', label: 'Water', icon: 'water-outline', color: colors.foc },
    { id: 'weight', label: 'Weight', icon: 'barbell-outline', color: colors.soc },
    { id: 'nutrition', label: 'Food', icon: 'fast-food-outline', color: colors.str },
  ];

  const [activeTab, setActiveTab] = useState<HealthTab>('sleep');
  const [sleepHours, setSleepHours] = useState('');
  const [todaySleep, setTodaySleep] = useState<number | null>(null);
  const [waterToday, setWaterToday] = useState(0);
  const [waterGoal, setWaterGoal] = useState(WATER_GOAL_DEFAULT);
  const [customMl, setCustomMl] = useState('');
  const fillAnim = useRef(new Animated.Value(0)).current;
  const [weightKg, setWeightKg] = useState('');
  const [weightHistory, setWeightHistory] = useState<WeightLog[]>([]);
  const [weightPeriod, setWeightPeriod] = useState<number>(7);
  const [sleepHistory, setSleepHistory] = useState<SleepLog[]>([]);

  const weightPeriods = [
    { value: 7, label: '7D' },
    { value: 14, label: '14D' },
    { value: 30, label: '1M' },
    { value: 365, label: '1Y' },
    { value: 1825, label: '5Y' },
    { value: 3650, label: '10Y' }
  ];

  const [foodLibrary, setFoodLibrary] = useState<FoodItem[]>([]);
  const [todayNutrition, setTodayNutrition] = useState<NutritionLog[]>([]);
  const [showNewFoodForm, setShowNewFoodForm] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [baseGrams, setBaseGrams] = useState('');
  const [baseCalories, setBaseCalories] = useState('');
  const [baseCarbs, setBaseCarbs] = useState('');
  const [baseProtein, setBaseProtein] = useState('');
  const [baseFat, setBaseFat] = useState('');
  const [baseFiber, setBaseFiber] = useState('');
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [actualGrams, setActualGrams] = useState('');
  const today = toDay();

  useEffect(() => {
    loadData<SleepLog[]>(KEYS.sleepLogs, []).then((logs) => {
      const todayLog = logs.filter((l) => l.date === today).pop();
      if (todayLog) setTodaySleep(todayLog.hours);
      setSleepHistory(logs.slice(-10).reverse());
    });
    loadTodayWater();
    loadData<number>(KEYS.waterGoal, WATER_GOAL_DEFAULT).then(setWaterGoal);
    loadData<WeightLog[]>(KEYS.weightLogs, []).then(setWeightHistory);
    loadData<FoodItem[]>(KEYS.foodLibrary, []).then(setFoodLibrary);
    loadData<NutritionLog[]>(KEYS.nutritionLogs, []).then((logs) => setTodayNutrition(logs.filter((l) => l.date === today)));
  }, []);

  useEffect(() => {
    const pct = Math.min((waterToday / waterGoal) * 100, 100);
    Animated.spring(fillAnim, { toValue: pct, useNativeDriver: false, tension: 40, friction: 8 }).start();
  }, [waterToday, waterGoal]);

  const loadTodayWater = async () => {
    const logs = await loadData<WaterLog[]>(KEYS.waterLogs, []);
    setWaterToday(logs.find((l) => l.date === today)?.totalMl ?? 0);
  };

  const addWater = useCallback(async (ml: number) => {
    const logs = await loadData<WaterLog[]>(KEYS.waterLogs, []);
    const idx = logs.findIndex((l) => l.date === today);
    if (idx >= 0) {
      logs[idx].totalMl += ml;
      await saveData(KEYS.waterLogs, logs);
      setWaterToday(logs[idx].totalMl);
    } else {
      await saveData(KEYS.waterLogs, [...logs, { id: generateId(), date: today, totalMl: ml }]);
      setWaterToday(ml);
    }
  }, [today]);

  const saveSleep = async () => {
    const hrs = parseFloat(sleepHours);
    if (isNaN(hrs) || hrs <= 0 || hrs > 24) return;
    const updated = await appendToList<SleepLog>(KEYS.sleepLogs, { id: generateId(), date: today, hours: hrs });
    setSleepHistory(updated.slice(-10).reverse());
    setTodaySleep(hrs); setSleepHours('');
  };

  const deleteSleepLog = async (id: string) => {
    const all = await loadData<SleepLog[]>(KEYS.sleepLogs, []);
    const updated = all.filter((l) => l.id !== id);
    await saveData(KEYS.sleepLogs, updated);
    setSleepHistory(updated.slice(-10).reverse());
    const todayLog = updated.filter((l) => l.date === today).pop();
    setTodaySleep(todayLog?.hours ?? null);
  };

  const resetTodayWater = async () => {
    const all = await loadData<WaterLog[]>(KEYS.waterLogs, []);
    const updated = all.filter((l) => l.date !== today);
    await saveData(KEYS.waterLogs, updated);
    setWaterToday(0);
  };

  const saveWeight = async () => {
    const kg = parseFloat(weightKg);
    if (isNaN(kg) || kg <= 0) return;
    const updated = await appendToList<WeightLog>(KEYS.weightLogs, { id: generateId(), date: today, kg });
    setWeightHistory(updated); setWeightKg('');
  };

  const deleteWeightLog = async (id: string) => {
    const updated = weightHistory.filter((l) => l.id !== id);
    await saveData(KEYS.weightLogs, updated);
    setWeightHistory(updated);
  };

  const saveNewFood = async () => {
    const base = parseFloat(baseGrams), actual = parseFloat(actualGrams);
    if (!foodName.trim() || isNaN(base) || base <= 0 || isNaN(actual) || actual <= 0) return;
    const multiplier = actual / base;
    const baseMacros: Macro = { calories: parseFloat(baseCalories || '0'), carbs: parseFloat(baseCarbs || '0'), protein: parseFloat(baseProtein || '0'), fat: parseFloat(baseFat || '0'), fiber: parseFloat(baseFiber || '0') };
    const foodId = generateId();
    const updatedLib = [...foodLibrary, { id: foodId, name: foodName.trim(), baseGrams: base, baseMacros }];
    await saveData(KEYS.foodLibrary, updatedLib); setFoodLibrary(updatedLib);
    const macros: Macro = { calories: baseMacros.calories * multiplier, carbs: baseMacros.carbs * multiplier, protein: baseMacros.protein * multiplier, fat: baseMacros.fat * multiplier, fiber: baseMacros.fiber * multiplier };
    const updatedLogs = await appendToList<NutritionLog>(KEYS.nutritionLogs, { id: generateId(), date: today, foodId, foodName: foodName.trim(), multiplier, macros });
    setTodayNutrition(updatedLogs.filter((l) => l.date === today));
    setFoodName(''); setBaseGrams(''); setActualGrams(''); setBaseCalories(''); setBaseCarbs(''); setBaseProtein(''); setBaseFat(''); setBaseFiber('');
    setShowNewFoodForm(false);
  };

  const logFromLibrary = async () => {
    if (!selectedFood) return;
    const actual = parseFloat(actualGrams);
    if (isNaN(actual) || actual <= 0) return;
    const multiplier = actual / selectedFood.baseGrams;
    const macros: Macro = { calories: selectedFood.baseMacros.calories * multiplier, carbs: selectedFood.baseMacros.carbs * multiplier, protein: selectedFood.baseMacros.protein * multiplier, fat: selectedFood.baseMacros.fat * multiplier, fiber: selectedFood.baseMacros.fiber * multiplier };
    const updatedLogs = await appendToList<NutritionLog>(KEYS.nutritionLogs, { id: generateId(), date: today, foodId: selectedFood.id, foodName: selectedFood.name, multiplier, macros });
    setTodayNutrition(updatedLogs.filter((l) => l.date === today));
    setSelectedFood(null); setActualGrams(''); setShowLibraryModal(false);
  };

  const deleteFood = async (logId: string) => {
    const all = await loadData<NutritionLog[]>(KEYS.nutritionLogs, []);
    const updated = all.filter((l) => l.id !== logId);
    await saveData(KEYS.nutritionLogs, updated);
    setTodayNutrition(updated.filter((l) => l.date === today));
  };

  const waterPct = Math.min((waterToday / waterGoal) * 100, 100);
  
  let periodWeights = weightHistory.slice(-(weightPeriod));
  if (periodWeights.length > 50) {
    const factor = Math.ceil(periodWeights.length / 50);
    periodWeights = periodWeights.filter((_, i) => i % factor === 0);
  }

  const chartData = periodWeights.length >= 2 ? {
    labels: periodWeights.map((w, i) => periodWeights.length > 10 ? (i % Math.ceil(periodWeights.length / 6) === 0 ? w.date.slice(5) : '') : w.date.slice(5)),
    datasets: [{ data: periodWeights.map((w) => w.kg), color: () => colors.soc, strokeWidth: 2 }],
  } : null;
  const totalToday: Macro = todayNutrition.reduce(
    (acc, l) => ({ calories: acc.calories + l.macros.calories, carbs: acc.carbs + l.macros.carbs, protein: acc.protein + l.macros.protein, fat: acc.fat + l.macros.fat, fiber: acc.fiber + l.macros.fiber }),
    { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 }
  );
  const fillHeight = fillAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  // Centered form block wrapper
  const fw = { alignSelf: 'center' as const, width: '100%' as const, maxWidth: layout.inputMaxWidth };

  const activeTabConfig = TAB_CONFIG.find(t => t.id === activeTab)!;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* ── Header ── */}
      <View style={[s.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[s.headerSub, { color: colors.textMuted }]}>HEALTH TRACKER</Text>
          <Text style={[s.headerTitle, { color: activeTabConfig.color }]}>{activeTabConfig.label}</Text>
        </View>
        <View style={[s.headerBadge, { backgroundColor: activeTabConfig.color + '20', borderColor: activeTabConfig.color + '40' }]}>
          <Ionicons name={activeTabConfig.icon} size={20} color={activeTabConfig.color} />
        </View>
      </View>
      {/* ── Tab Pill Row ── */}
      <View style={[s.tabRow, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.hPadding, gap: 8, flexDirection: 'row', paddingVertical: 10 }}>
          {TAB_CONFIG.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <TouchableOpacity key={t.id}
                style={[s.tabBtn, { borderColor: isActive ? t.color + '60' : colors.border, backgroundColor: isActive ? t.color + '18' : colors.surface }]}
                onPress={() => setActiveTab(t.id)}>
                <Ionicons name={t.icon} size={16} color={isActive ? t.color : colors.textMuted} />
                <Text style={[s.tabBtnText, { color: isActive ? t.color : colors.textMuted }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={gs.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: layout.maxWidth, paddingHorizontal: layout.hPadding, paddingTop: 20 }}>

          {/* ── SLEEP ── */}
          {activeTab === 'sleep' && (
            <View>
              {todaySleep !== null && (
                <View style={[gs.card, { alignItems: 'center', borderColor: colors.art + '40', marginBottom: 14 }]}>
                  <View style={[s.statIconLarge, { backgroundColor: colors.art + '20' }]}>
                    <Ionicons name="moon" size={28} color={colors.art} />
                  </View>
                  <Text style={[s.bigStat, { color: colors.art }]}>
                    {Number.isInteger(todaySleep) ? todaySleep : Number(todaySleep).toFixed(1)}h
                  </Text>
                  <Text style={[s.bigStatSub, { color: colors.textSub }]}>Tonight's sleep logged ✓</Text>
                </View>
              )}
              <View style={gs.card}>
                <Text style={[gs.label, { marginBottom: 8 }]}>Hours slept</Text>
                <TextInput style={gs.input} placeholder="e.g. 7.5" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" value={sleepHours} onChangeText={setSleepHours} />
                <TouchableOpacity style={[gs.btnPrimary, { backgroundColor: colors.art }]} onPress={saveSleep}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="moon" size={16} color="#fff" />
                    <Text style={gs.btnPrimaryText}>Save Sleep</Text>
                  </View>
                </TouchableOpacity>
              </View>
              {sleepHistory.length > 0 && (
                <>
                  <Text style={gs.sectionTitle}>Recent Logs</Text>
                  {sleepHistory.map((w) => (
                    <View key={w.id} style={[gs.card, { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 }]}>
                      <View style={[s.logIconWrap, { backgroundColor: colors.art + '20' }]}>
                        <Ionicons name="moon" size={16} color={colors.art} />
                      </View>
                      <Text style={[s.logDate, { color: colors.textSub }]}>{w.date}</Text>
                      <Text style={[s.logValue, { color: colors.art, flex: 1, textAlign: 'right', marginRight: 12 }]}>
                        {Number.isInteger(w.hours) ? w.hours : Number(w.hours).toFixed(1)}h
                      </Text>
                      <TouchableOpacity onPress={() => deleteSleepLog(w.id)} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={17} color={colors.red} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

          {/* ── WATER ── */}
          {activeTab === 'water' && (
            <View>
              {/* Big water display */}
              <View style={[gs.card, { alignItems: 'center', borderColor: waterPct >= 100 ? colors.soc + '60' : colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <View style={[s.bottleOuter, { backgroundColor: colors.surfaceAlt, borderColor: colors.foc + '60' }]}>
                    <Animated.View style={[s.bottleFill, { height: fillHeight, backgroundColor: colors.foc }]} />
                  </View>
                  <View style={{ alignItems: 'flex-start' }}>
                    <Text style={[s.bigStat, { color: colors.foc, fontSize: 44 }]}>{waterToday} ml</Text>
                    <Text style={[s.bigStatSub, { color: colors.textSub }]}>{waterPct.toFixed(0)}% of {waterGoal} ml</Text>
                    {waterPct >= 100 && (
                      <View style={[gs.pill, { backgroundColor: colors.soc + '20', marginTop: 8 }]}>
                        <Text style={[gs.pillText, { color: colors.soc }]}>🎯 GOAL REACHED</Text>
                      </View>
                    )}
                  </View>
                </View>
                {/* Progress bar */}
                <View style={[s.waterProgressTrack, { backgroundColor: colors.border }]}>
                  <Animated.View style={[s.waterProgressFill, { width: fillAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) as any, backgroundColor: colors.foc }]} />
                </View>
                {waterToday > 0 && (
                  <TouchableOpacity
                    onPress={resetTodayWater}
                    style={[s.resetBtn, { backgroundColor: colors.red + '15', borderColor: colors.red + '30' }]}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.red} />
                    <Text style={[s.resetBtnText, { color: colors.red }]}>Reset Today</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={gs.sectionTitle}>Quick Add</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {[150, 250, 330, 500].map((ml) => (
                  <TouchableOpacity key={ml} style={[s.quickBtn, { backgroundColor: colors.foc + '15', borderColor: colors.foc + '40' }]} onPress={() => addWater(ml)}>
                    <Ionicons name="water" size={14} color={colors.foc} />
                    <Text style={[s.quickBtnText, { color: colors.foc }]}>+{ml}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <TextInput
                  style={[gs.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Custom amount (ml)…"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={customMl}
                  onChangeText={setCustomMl}
                />
                <TouchableOpacity
                  style={[gs.btnPrimary, { backgroundColor: colors.foc, paddingHorizontal: 20, justifyContent: 'center' }]}
                  onPress={() => { const ml = parseInt(customMl); if (!isNaN(ml) && ml > 0) { addWater(ml); setCustomMl(''); } }}>
                  <Text style={gs.btnPrimaryText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── WEIGHT ── */}
          {activeTab === 'weight' && (
            <View>
              {weightHistory.length > 0 && (
                <View style={[gs.card, { alignItems: 'center', borderColor: colors.soc + '40', marginBottom: 14 }]}>
                  <View style={[s.statIconLarge, { backgroundColor: colors.soc + '20' }]}>
                    <Ionicons name="scale" size={28} color={colors.soc} />
                  </View>
                  <Text style={[s.bigStat, { color: colors.soc }]}>
                    {weightHistory[weightHistory.length - 1].kg} kg
                  </Text>
                  <Text style={[s.bigStatSub, { color: colors.textSub }]}>Latest reading</Text>
                </View>
              )}
              <View style={gs.card}>
                <Text style={[gs.label, { marginBottom: 8 }]}>Morning weight (kg)</Text>
                <TextInput style={gs.input} placeholder="e.g. 75.4" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" value={weightKg} onChangeText={setWeightKg} />
                <TouchableOpacity style={[gs.btnPrimary, { backgroundColor: colors.soc }]} onPress={saveWeight}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="scale" size={16} color="#fff" />
                    <Text style={gs.btnPrimaryText}>Log Weight</Text>
                  </View>
                </TouchableOpacity>
              </View>
              {weightHistory.length >= 2 && (
                <>
                  <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }, fw]}>
                    {weightPeriods.map((p) => (
                      <TouchableOpacity key={p.value} style={[
                          s.periodBtn, 
                          { borderColor: colors.border, backgroundColor: colors.surfaceAlt, flex: 0, paddingHorizontal: 12 }, 
                          weightPeriod === p.value && { backgroundColor: colors.soc + '33', borderColor: colors.soc }
                        ]} 
                        onPress={() => setWeightPeriod(p.value)}>
                        <Text style={[s.periodBtnText, { color: weightPeriod === p.value ? colors.soc : colors.textSub }]}>{p.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {chartData && (
                    <View style={[gs.card, { paddingHorizontal: 0, paddingVertical: 12, overflow: 'hidden' }]}>
                      <LineChart
                        data={chartData}
                        width={Math.min(SCREEN_WIDTH - layout.hPadding * 2, layout.maxWidth - layout.hPadding * 2)}
                        height={200}
                        chartConfig={{ backgroundColor: colors.surface, backgroundGradientFrom: colors.surface, backgroundGradientTo: colors.surface, decimalPlaces: 1, color: (opacity = 1) => `rgba(34,197,94,${opacity})`, labelColor: () => colors.textSub, propsForDots: { r: '5', strokeWidth: '2', stroke: colors.soc }, propsForBackgroundLines: { stroke: colors.border } }}
                        bezier style={{ borderRadius: 16 }} withInnerLines={false} withDots={periodWeights.length <= 14}
                      />
                    </View>
                  )}
                </>
              )}
              {weightHistory.length > 0 && (
                <>
                  <Text style={gs.sectionTitle}>Recent</Text>
                  {weightHistory.slice(-10).reverse().map((w) => (
                    <View key={w.id} style={[gs.card, { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 }]}>
                      <View style={[s.logIconWrap, { backgroundColor: colors.soc + '20' }]}>
                        <Ionicons name="scale" size={16} color={colors.soc} />
                      </View>
                      <Text style={[s.logDate, { color: colors.textSub }]}>{w.date}</Text>
                      <Text style={[s.logValue, { color: colors.soc, flex: 1, textAlign: 'right', marginRight: 12 }]}>{w.kg} kg</Text>
                      <TouchableOpacity onPress={() => deleteWeightLog(w.id)} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={17} color={colors.red} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

          {/* ── NUTRITION ── */}
          {activeTab === 'nutrition' && (
            <View>

              {/* Macro overview card */}
              <View style={gs.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <View style={[s.logIconWrap, { backgroundColor: colors.str + '20' }]}><Ionicons name="restaurant" size={16} color={colors.str} /></View>
                  <Text style={[gs.cardTitle, { marginBottom: 0 }]}>Today's Totals</Text>
                </View>
                {/* Big calorie display */}
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Text style={[s.bigStat, { color: colors.dis, fontSize: 44 }]}>{totalToday.calories.toFixed(0)}</Text>
                  <Text style={[s.bigStatSub, { color: colors.textMuted }]}>kcal consumed</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  <MacroChip label="Carbs" value={totalToday.carbs} color={colors.str} bg={colors.surfaceAlt} />
                  <MacroChip label="Protein" value={totalToday.protein} color={colors.foc} bg={colors.surfaceAlt} />
                  <MacroChip label="Fat" value={totalToday.fat} color={colors.vit} bg={colors.surfaceAlt} />
                  <MacroChip label="Fiber" value={totalToday.fiber} color={colors.soc} bg={colors.surfaceAlt} />
                </View>
              </View>

              <View style={[{ flexDirection: 'row', gap: 10, marginBottom: 14 }, fw]}>
                {foodLibrary.length > 0 && (
                  <TouchableOpacity style={[gs.btnPrimary, { flex: 1, backgroundColor: colors.str }]} onPress={() => setShowLibraryModal(true)}>
                    <Text style={gs.btnPrimaryText}>📚 Library</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[gs.btnSecondary, { flex: 1 }]} onPress={() => setShowNewFoodForm(!showNewFoodForm)}>
                  <Text style={gs.btnSecondaryText}>+ New Food</Text>
                </TouchableOpacity>
              </View>

              {showNewFoodForm && (
                <View style={gs.card}>
                  <Text style={[gs.cardTitle, { textAlign: 'center', marginBottom: 16 }]}>Add New Food</Text>
                  <View style={fw}>
                    <TextInput style={gs.input} placeholder="Food name (e.g. Oats)" placeholderTextColor={colors.textSub} value={foodName} onChangeText={setFoodName} />
                    <Text style={gs.label}>Base macros per how many grams?</Text>
                    <TextInput style={gs.input} placeholder="Base grams (e.g. 100)" placeholderTextColor={colors.textSub} keyboardType="decimal-pad" value={baseGrams} onChangeText={setBaseGrams} />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                      {[['Kcal', baseCalories, setBaseCalories], ['Carbs g', baseCarbs, setBaseCarbs], ['Protein g', baseProtein, setBaseProtein], ['Fat g', baseFat, setBaseFat], ['Fiber g', baseFiber, setBaseFiber]].map(([ph, val, fn]) => (
                        <TextInput key={ph as string} style={[gs.input, { width: '30%', marginBottom: 0, fontSize: 14 }]} placeholder={ph as string} placeholderTextColor={colors.textSub} keyboardType="decimal-pad" value={val as string} onChangeText={fn as any} />
                      ))}
                    </View>
                    <Text style={[gs.label, { marginTop: 12 }]}>How much did you eat today? (grams)</Text>
                    <TextInput style={gs.input} placeholder="e.g. 150" placeholderTextColor={colors.textSub} keyboardType="decimal-pad" value={actualGrams} onChangeText={setActualGrams} />
                    <TouchableOpacity style={[gs.btnPrimary, { backgroundColor: colors.str }]} onPress={saveNewFood}>
                      <Text style={gs.btnPrimaryText}>Add to Today & Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {todayNutrition.length > 0 && (
                <>
                  <Text style={gs.sectionTitle}>Today's Meals</Text>
                  {todayNutrition.map((l) => (
                    <View key={l.id} style={gs.card}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16, flex: 1 }}>{l.foodName}</Text>
                        <Text style={{ color: colors.dis, fontWeight: '800', fontSize: 16, marginRight: 12 }}>{l.macros.calories.toFixed(0)} kcal</Text>
                        <TouchableOpacity onPress={() => deleteFood(l.id)}><Ionicons name="close-circle" size={20} color={colors.red} /></TouchableOpacity>
                      </View>
                      <Text style={{ color: colors.textSub, fontSize: 13, marginTop: 6 }}>
                        C:{l.macros.carbs.toFixed(1)}g · P:{l.macros.protein.toFixed(1)}g · F:{l.macros.fat.toFixed(1)}g
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>

      {/* Library Modal */}
      <Modal visible={showLibraryModal} transparent animationType="slide" onRequestClose={() => setShowLibraryModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[gs.cardTitle, { fontSize: 20 }]}>Food Library</Text>
              <TouchableOpacity onPress={() => { setShowLibraryModal(false); setSelectedFood(null); setActualGrams(''); }}>
                <Ionicons name="close" size={26} color={colors.textSub} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {foodLibrary.map((food) => (
                <TouchableOpacity key={food.id}
                  style={[s.libraryItem, { backgroundColor: colors.surfaceAlt, borderColor: selectedFood?.id === food.id ? colors.str : colors.border }]}
                  onPress={() => setSelectedFood(food)}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{food.name}</Text>
                    <Text style={{ color: colors.textSub, fontSize: 13, marginTop: 2 }}>per {food.baseGrams}g · {food.baseMacros.calories.toFixed(0)} kcal</Text>
                  </View>
                  {selectedFood?.id === food.id && <Ionicons name="checkmark-circle" size={24} color={colors.str} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            {selectedFood && (
              <View style={{ marginTop: 16 }}>
                <Text style={gs.label}>How much did you eat? (base: {selectedFood.baseGrams}g)</Text>
                <TextInput style={[gs.input, { marginBottom: 12 }]} placeholder={`e.g. ${selectedFood.baseGrams}`} placeholderTextColor={colors.textSub} keyboardType="decimal-pad" value={actualGrams} onChangeText={setActualGrams} />
                <TouchableOpacity style={[gs.btnPrimary, { backgroundColor: colors.str }]} onPress={logFromLibrary}>
                  <Text style={gs.btnPrimaryText}>Log It</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MacroChip({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <View style={[s.macroChip, { borderColor: color + '55', backgroundColor: bg }]}>
      <Text style={{ color, fontWeight: '800', fontSize: 18 }}>{value.toFixed(0)}</Text>
      <Text style={{ color: color + 'cc', fontSize: 12, fontWeight: '600', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerSub: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  headerBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  tabRow: { borderBottomWidth: 1 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, gap: 6, borderWidth: 1 },
  tabBtnText: { fontSize: 13, fontWeight: '700' },
  // Big stat display
  statIconLarge: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  bigStat: { fontSize: 52, fontWeight: '900', letterSpacing: -2, lineHeight: 58 },
  bigStatSub: { fontSize: 14, fontWeight: '300', marginTop: 4 },
  // Water
  bottleOuter: { width: 64, height: 160, borderRadius: 32, overflow: 'hidden', justifyContent: 'flex-end', borderWidth: 2 },
  bottleFill: { width: '100%', borderRadius: 32 },
  waterProgressTrack: { height: 6, width: '100%', borderRadius: 3, overflow: 'hidden', marginTop: 16 },
  waterProgressFill: { height: '100%', borderRadius: 3 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginTop: 12 },
  resetBtnText: { fontWeight: '700', fontSize: 13 },
  quickBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, gap: 4 },
  quickBtnText: { fontWeight: '700', fontSize: 13 },
  // Log rows
  logIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logDate: { fontSize: 13, fontWeight: '400' },
  logValue: { fontWeight: '800', fontSize: 17 },
  // Period buttons
  periodBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  periodBtnText: { fontWeight: '700', fontSize: 13 },
  // Nutrition
  macroChip: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', minWidth: 70 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%', borderTopWidth: 1 },
  libraryItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8 },
});
