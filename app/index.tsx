import { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollView, Text, View, StyleSheet, RefreshControl, useWindowDimensions, TouchableOpacity, Animated, LogBox, LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

LogBox.ignoreLogs([
  'Invalid DOM property `transform-origin`',
  'Unknown event handler property `onResponderTerminate`'
]);
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { LineChart } from 'react-native-chart-kit';
import { useTheme, makeGlobalStyles } from '../lib/ThemeContext';
import { useLayout } from '../lib/useLayout';
import {
  loadData, KEYS, toDay,
  SleepLog, WaterLog, WeightLog, WorkoutLog, MindLog, SocialLog, NutritionLog, StepLog
} from '../lib/storage';

type StatKey = 'VIT' | 'STR' | 'FOC' | 'ART' | 'SOC' | 'DIS';

function getDateBefore(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function formatDateDDMMYYYY(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

// ── SVG Hexagon Chart ──
function HexagonChart({
  stats, size = 280, colors, activeStat, setActiveStat
}: {
  stats: Record<StatKey, number>; size?: number; colors: any;
  activeStat: StatKey | null; setActiveStat: (s: StatKey | null) => void;
}) {
  const center = size / 2;
  const radius = (size / 2) - 40;

  const statKeys: StatKey[] = ['STR', 'FOC', 'ART', 'SOC', 'DIS', 'VIT'];
  const statColors = [colors.str, colors.foc, colors.art, colors.soc, colors.dis, colors.vit];

  const getPoint = (val: number, angle: number) => {
    const r = (val / 100) * radius;
    const rad = angle * (Math.PI / 180);
    return { x: center + r * Math.sin(rad), y: center - r * Math.cos(rad) };
  };

  const points = statKeys.map((key) => getPoint(stats[key], statKeys.indexOf(key) * 60));
  const polyPoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const webs = [20, 40, 60, 80, 100].map((v) => statKeys.map((_, i) => getPoint(v, i * 60)).map((p) => `${p.x},${p.y}`).join(' '));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size}>
        {webs.map((pts, i) => <Polygon key={`web-${i}`} points={pts} stroke={colors.border} strokeWidth="1" fill="none" />)}
        {statKeys.map((_, i) => {
          const p = getPoint(100, i * 60);
          return <Line key={`axis-${i}`} x1={center} y1={center} x2={p.x} y2={p.y} stroke={colors.border} strokeWidth="1" />;
        })}
        <Polygon points={polyPoints} fill={colors.accent + '33'} stroke={colors.accent} strokeWidth="4" strokeLinejoin="round" />
        {points.map((p, i) => <Circle key={`pt-${i}`} cx={p.x} cy={p.y} r="5" fill={statColors[i]} />)}
        {statKeys.map((key, i) => {
          const p = getPoint(125, i * 60);
          const isActive = activeStat === key;
          return (
            <SvgText key={`lbl-${i}`} x={p.x} y={p.y + 5} fill={isActive ? colors.text : statColors[i]} fontSize={isActive ? "16" : "13"} fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle">
              {key}
            </SvgText>
          );
        })}
      </Svg>

      {statKeys.map((key, i) => {
        const pHit = getPoint(100, i * 60);
        return (
          <TouchableOpacity key={`hit-${i}`} onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setActiveStat(activeStat === key ? null : key);
          }}
            style={{ position: 'absolute', left: pHit.x - 45, top: pHit.y - 45, width: 90, height: 90, borderRadius: 45, zIndex: 10 }}
          />
        );
      })}
    </View>
  );
}

// ── Today row ──
function TodayRow({ icon, label, value, color }: {
  icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string; color: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[todayRowStyles.row, { borderBottomColor: colors.border }]}>
      <View style={[todayRowStyles.iconWrap, { backgroundColor: color + '18' }]}><Ionicons name={icon} size={15} color={color} /></View>
      <Text style={[todayRowStyles.label, { color: colors.textSub }]}>{label}</Text>
      <Text style={[todayRowStyles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const todayRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 14 },
  value: { fontWeight: '700', fontSize: 14 },
});

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const layout = useLayout();
  const { width } = useWindowDimensions();
  const gs = makeGlobalStyles(colors);

  const [stats, setStats] = useState<Record<StatKey, number>>({ VIT: 1, STR: 1, FOC: 1, ART: 1, SOC: 1, DIS: 1 });
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [activeStat, setActiveStat] = useState<StatKey | null>(null);
  const [activeStatPeriod, setActiveStatPeriod] = useState<number>(30);
  const [activeStatHistory, setActiveStatHistory] = useState<{ labels: string[], data: number[] } | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Trigger animation when active history data mounts
  useEffect(() => {
    if (activeStatHistory) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [activeStatHistory]);

  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(51); // 0 = 51 weeks ago, 51 = this week.
  const [weeklyHeatmap, setWeeklyHeatmap] = useState<number[]>([]);

  const [todaySummary, setTodaySummary] = useState<{
    sleep: number | null; water: number; waterGoal: number; workouts: number; mindMins: number; socialMins: number; calories: number; weight: number | null; steps: number;
  }>({ sleep: null, water: 0, waterGoal: 2500, workouts: 0, mindMins: 0, socialMins: 0, calories: 0, weight: null, steps: 0 });
  const [weeklySummary, setWeeklySummary] = useState<{
    sleepHrs: number; waterMl: number; workouts: number; mindMins: number; socialMins: number; calories: number; weightDiff: number; steps: number;
  }>({ sleepHrs: 0, waterMl: 0, workouts: 0, mindMins: 0, socialMins: 0, calories: 0, weightDiff: 0, steps: 0 });

  const [refreshing, setRefreshing] = useState(false);
  const today = toDay();

  const mockPeriods = [
    { value: 7, label: '7D' }, { value: 14, label: '14D' }, { value: 30, label: '1M' }, { value: 365, label: '1Y' }, { value: 1825, label: '5Y' }
  ];

  // ── XP Calculation ──────────────────────────────────────────────────────────
  // Each stat accumulates XP from relevant logs. The XP amounts are calibrated
  // so that consistent daily effort over weeks → scores in the 30-60 range.
  // Reaching 80+ requires months of near-perfect habit adherence.
  const calcXp = (
    sleepLogs: SleepLog[], waterLogs: WaterLog[], workoutLogs: WorkoutLog[],
    stepLogs: StepLog[], mindLogs: MindLog[], socialLogs: SocialLog[], uniqueDates: string[]
  ) => {
    // VIT: sleep quality + hydration + steps (diminishing daily caps)
    const vitSleep = sleepLogs.reduce((s, l) => s + Math.min(l.hours, 9) * 12, 0); // max ~108/day
    const vitWater = waterLogs.reduce((s, l) => s + Math.min(l.totalMl, 3500) * 0.008, 0); // max ~28/day
    const vitSteps = stepLogs.reduce((s, l) => s + Math.min(l.steps, 15000) * 0.003, 0); // max ~45/day
    const vit = vitSleep + vitWater + vitSteps;

    // STR: workouts + steps bonus (capped per session)
    const strWorkout = workoutLogs.reduce((s, l) => s + 150, 0); // flat 150 XP per session
    const strSteps = stepLogs.reduce((s, l) => s + Math.min(l.steps, 10000) * 0.002, 0); // bonus for walking
    const str = strWorkout + strSteps;

    // FOC: dedicated focus/study sessions
    const foc = mindLogs
      .filter(l => l.statBoost === 'FOC')
      .reduce((s, l) => s + Math.min(l.durationMinutes, 120) * 1.5, 0); // cap at 2h/day = 180 XP

    // ART: creative/art practice
    const art = mindLogs
      .filter(l => l.statBoost === 'ART')
      .reduce((s, l) => s + Math.min(l.durationMinutes, 120) * 1.5, 0);

    // SOC: social engagement time
    const soc = socialLogs.reduce((s, l) => s + Math.min(l.minutes, 180) * 1.2, 0); // cap 3h/day

    // DIS: consistency — unique active days (hardest to fake, best long-term signal)
    const dis = uniqueDates.length * 80; // 80 XP per active day

    return { VIT: vit, STR: str, FOC: foc, ART: art, SOC: soc, DIS: dis };
  };

  // ── Stat Score (Sigmoid) ────────────────────────────────────────────────────
  // score(xp) = 1 + 99 * (1 - e^(-xp/k))
  // k = 80000 means: score ~50 at 55k XP, score ~75 at 110k XP, score ~90 at 184k XP
  // This means even a power user needs ~6 months of daily effort to see 80+.
  const getSigmoidStat = (xpAmount: number) => {
    const k = 80000;
    return Math.max(1, Math.min(100, Math.round(1 + 99 * (1 - Math.exp(-xpAmount / k)))));
  };

  const computeStats = useCallback(async () => {
    const [sleepLogs, waterLogs, waterGoal, weightLogs, workoutLogs, mindLogs, socialLogs, nutritionLogs, stepLogs] =
      await Promise.all([
        loadData<SleepLog[]>(KEYS.sleepLogs, []), loadData<WaterLog[]>(KEYS.waterLogs, []), loadData<number>(KEYS.waterGoal, 2500),
        loadData<WeightLog[]>(KEYS.weightLogs, []), loadData<WorkoutLog[]>(KEYS.workoutLogs, []), loadData<MindLog[]>(KEYS.mindLogs, []),
        loadData<SocialLog[]>(KEYS.socialLogs, []), loadData<NutritionLog[]>(KEYS.nutritionLogs, []), loadData<StepLog[]>(KEYS.stepLogs, []),
      ]);

    const tSleep = sleepLogs.find((l) => l.date === today)?.hours ?? null;
    const tWater = waterLogs.find((l) => l.date === today)?.totalMl ?? 0;
    const tWork = workoutLogs.filter((l) => l.date === today).length;
    const tMind = mindLogs.filter((l) => l.date === today).reduce((s, l) => s + l.durationMinutes, 0);
    const tSoc = socialLogs.filter((l) => l.date === today).reduce((s, l) => s + l.minutes, 0);
    const tCal = nutritionLogs.filter((l) => l.date === today).reduce((s, l) => s + l.macros.calories, 0);
    const tWeight = weightLogs.find((l) => l.date === today)?.kg ?? null;
    const tSteps = stepLogs.find((l) => l.date === today)?.steps ?? 0;
    setTodaySummary({ sleep: tSleep, water: tWater, waterGoal, workouts: tWork, mindMins: tMind, socialMins: tSoc, calories: tCal, weight: tWeight, steps: tSteps });

    const uniqueDates = [...new Set([...sleepLogs, ...waterLogs, ...workoutLogs, ...mindLogs, ...socialLogs, ...stepLogs].map(l=>l.date))];
    const totalXps = calcXp(sleepLogs, waterLogs, workoutLogs, stepLogs, mindLogs, socialLogs, uniqueDates);
    const newStats = {
      VIT: getSigmoidStat(totalXps.VIT), STR: getSigmoidStat(totalXps.STR), FOC: getSigmoidStat(totalXps.FOC),
      ART: getSigmoidStat(totalXps.ART), SOC: getSigmoidStat(totalXps.SOC), DIS: getSigmoidStat(totalXps.DIS),
    };
    setStats(newStats);

    const sumXp = Object.values(totalXps).reduce((s,v)=>s+v, 0);
    setLevel(Math.floor(sumXp / 1000) + 1);
    setXp(Math.round(sumXp % 1000));

    // 52-Week Logic & Dynamic Weekly Summary
    const daysAgoStart = (51 - selectedWeekIndex) * 7;
    const daysAgoEnd = daysAgoStart + 7;
    
    const weekStartStr = getDateBefore(daysAgoEnd);
    const weekEndStr = getDateBefore(daysAgoStart);
    
    const flt = (l: {date: string}) => l.date > weekStartStr && l.date <= weekEndStr;
    const wSleep = sleepLogs.filter(flt);
    const wWater = waterLogs.filter(flt);
    const wWork = workoutLogs.filter(flt);
    const wStep = stepLogs.filter(flt);
    const wMind = mindLogs.filter(flt);
    const wSoc = socialLogs.filter(flt);
    const wNut = nutritionLogs.filter(flt);
    
    let wDiff = 0;
    const wWeightLogs = weightLogs.filter(flt).sort((a,b)=>a.date.localeCompare(b.date));
    if (wWeightLogs.length >= 2) wDiff = wWeightLogs[wWeightLogs.length-1].kg - wWeightLogs[0].kg;

    setWeeklySummary({
      sleepHrs: wSleep.reduce((s,l)=>s+l.hours,0), waterMl: wWater.reduce((s,l)=>s+l.totalMl,0), workouts: wWork.length,
      mindMins: wMind.reduce((s,l)=>s+l.durationMinutes,0), socialMins: wSoc.reduce((s,l)=>s+l.minutes,0),
      calories: wNut.reduce((s,l)=>s+l.macros.calories,0), weightDiff: wDiff, steps: wStep.reduce((s,l)=>s+l.steps,0),
    });

    // Populate the 52-week Activity Heatmap
    let hMap = new Array(52).fill(0);
    const todayNum = new Date(today).getTime();
    const assignToWeek = (logs: {date: string}[], getVal: (log: any) => number) => {
       logs.forEach(l => {
          const diffTime = todayNum - new Date(l.date).getTime();
          const daysAgo = Math.floor((diffTime || 0) / (1000 * 3600 * 24));
          const wIndex = 51 - Math.floor(daysAgo / 7);
          if (wIndex >= 0 && wIndex <= 51) hMap[wIndex] += getVal(l);
       });
    };

    assignToWeek(sleepLogs, l => l.hours * 10);
    assignToWeek(waterLogs, l => l.totalMl * 0.015);
    assignToWeek(workoutLogs, () => 100);
    assignToWeek(stepLogs, l => l.steps * 0.015);
    assignToWeek(mindLogs, l => l.durationMinutes * 1);
    assignToWeek(socialLogs, l => l.minutes * 1);
    
    // Normalize heatmap for opacity 0.15 to 1.0
    const mXP = Math.max(1, ...hMap);
    setWeeklyHeatmap(hMap.map(val => val / mXP));

    // Generate active component history curve
    if (activeStat) {
      let historyLabels: string[] = [];
      let historyData: number[] = [];
      const now = new Date();
      // Downsample effectively to max ~14 points for performance
      const step = Math.max(1, Math.ceil(activeStatPeriod / 14));
      
      for (let i = activeStatPeriod; i >= 0; i -= step) {
        let cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - i);
        let cutoffStr = cutoff.toISOString().split('T')[0];
        
        const hSleep = sleepLogs.filter(l => l.date <= cutoffStr);
        const hWater = waterLogs.filter(l => l.date <= cutoffStr);
        const hWork = workoutLogs.filter(l => l.date <= cutoffStr);
        const hStep = stepLogs.filter(l => l.date <= cutoffStr);
        const hMind = mindLogs.filter(l => l.date <= cutoffStr);
        const hSoc = socialLogs.filter(l => l.date <= cutoffStr);
        const hUnique = [...new Set([...hSleep, ...hWater, ...hWork, ...hMind, ...hSoc, ...hStep].map(l => l.date))];
        
        const hXps = calcXp(hSleep, hWater, hWork, hStep, hMind, hSoc, hUnique);
        historyLabels.push(i === 0 ? 'Today' : `-${i}d`);
        historyData.push(getSigmoidStat(hXps[activeStat]));
      }

      // Sometimes array is sparse if user generated no data, react-native-chart-kit crashes on identical Ys or empty
      if (historyData.length < 2) {
         historyLabels = ['...', 'Today'];
         historyData = [1, newStats[activeStat]];
      }

      setActiveStatHistory({ labels: historyLabels, data: historyData });
    } else {
      setActiveStatHistory(null);
    }

  }, [today, activeStat, activeStatPeriod, selectedWeekIndex]);

  useEffect(() => { computeStats(); }, [computeStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await computeStats();
    setRefreshing(false);
  }, [computeStats]);

  const xpPct = Math.min((xp / 1000) * 100, 100);
  const chartColors = { VIT: colors.vit, STR: colors.str, FOC: colors.foc, ART: colors.art, SOC: colors.soc, DIS: colors.dis };

  const monthLabels = Array.from({length: 12}).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    return d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  });
  const gridDist = [4,4,5,4,4,5,4,4,5,4,4,5]; 
  let pointer = 0;
  const gridData = gridDist.map(size => {
     const weeks = [];
     for(let i=0; i<size; i++) weeks.push(pointer++);
     return weeks;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={gs.container} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />} contentContainerStyle={{ alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: layout.maxWidth, paddingHorizontal: layout.hPadding, paddingTop: 24 }}>
          
          <Text style={gs.screenTitle}>Statmaxxing</Text>
          <Text style={gs.screenSub}>Lifetime RPG dashboard · Pull to refresh</Text>

          <View style={[gs.card, { backgroundColor: isDark ? '#0f0f0f' : colors.surface, borderColor: colors.accent + '40', marginBottom: 16 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <View>
                <Text style={{ color: colors.textSub, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Lifetime Level</Text>
                <Text style={{ color: colors.text, fontSize: 48, fontWeight: '900', lineHeight: 52, letterSpacing: -2 }}>{level}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.textSub, fontSize: 12 }}>{xp} / 1000 XP</Text>
                <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700', marginTop: 2 }}>{1000 - xp} to Level {level + 1}</Text>
              </View>
            </View>
            <View style={{ height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 3, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${xpPct}%` as any, backgroundColor: colors.accent, borderRadius: 3 }} />
            </View>
          </View>

          {/* ── CORE ATTRIBUTES FLEX CONTAINER ── */}
          <Text style={gs.sectionTitle}>Core Attributes</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
            {/* HEXAGON */}
            <View style={[gs.card, { paddingVertical: 24, flex: 1, minWidth: 280, alignItems: 'center' }]}>
              <HexagonChart stats={stats} colors={colors} activeStat={activeStat} setActiveStat={setActiveStat} />
              <Text style={{ color: colors.textSub, fontSize: 12, marginTop: 12, fontStyle: 'italic', textAlign: 'center' }}>Tap an attribute to reveal history</Text>
            </View>

            {/* CHART CONTEXT (Only rendered if an activeStat is chosen) */}
            {activeStat && (
              <Animated.View style={[gs.card, { flex: 1, minWidth: 320, padding: 16, opacity: fadeAnim }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                   <View>
                     <Text style={{ fontSize: 24, fontWeight: '900', color: chartColors[activeStat] }}>{activeStat} {stats[activeStat]}</Text>
                     <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSub, textTransform: 'uppercase', letterSpacing: 1 }}>Score Progression</Text>
                   </View>
                   <TouchableOpacity onPress={() => {
                     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                     setActiveStat(null);
                   }} style={{ padding: 6, backgroundColor: colors.surfaceAlt, borderRadius: 20 }}>
                     <Ionicons name="close" size={20} color={colors.textSub} />
                   </TouchableOpacity>
                </View>

                {/* Period Selector */}
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                  {mockPeriods.map((p) => (
                    <TouchableOpacity key={p.value} onPress={() => setActiveStatPeriod(p.value)}
                      style={{
                        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
                        borderColor: activeStatPeriod === p.value ? chartColors[activeStat] : colors.border,
                        backgroundColor: activeStatPeriod === p.value ? chartColors[activeStat] + '22' : colors.surfaceAlt
                      }}>
                      <Text style={{ color: activeStatPeriod === p.value ? chartColors[activeStat] : colors.textSub, fontSize: 11, fontWeight: '700' }}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Line Chart Component */}
                {activeStatHistory && (
                  <View style={{ marginTop: 8, borderRadius: 16, overflow: 'hidden' }}>
                    <LineChart
                      data={{
                        labels: activeStatHistory.labels.map((l, i) => i === 0 || i === activeStatHistory.labels.length - 1 ? l : ''),
                        datasets: [{ data: activeStatHistory.data }],
                      }}
                      width={Math.min(width - layout.hPadding * 2 - 32, 600)} 
                      height={200}
                      chartConfig={{
                        backgroundColor: colors.surface, backgroundGradientFrom: colors.surface, backgroundGradientTo: colors.surface,
                        decimalPlaces: 0, 
                        color: (opacity = 1) => {
                          const hex = chartColors[activeStat].replace('#', '');
                          const r = parseInt(hex.substring(0,2), 16) || 0;
                          const g = parseInt(hex.substring(2,4), 16) || 0;
                          const b = parseInt(hex.substring(4,6), 16) || 0;
                          return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                        },
                        labelColor: () => colors.textSub,
                        propsForDots: { r: '4', strokeWidth: '0', fill: chartColors[activeStat] },
                        propsForBackgroundLines: { stroke: colors.border }
                      }}
                      bezier
                      fromZero={false}
                      withInnerLines={false}
                      withDots={false}
                    />
                  </View>
                )}
              </Animated.View>
            )}
          </View>

          {/* ── Today Summary ── */}
          <Text style={gs.sectionTitle}>Today</Text>
          <View style={[gs.card, { marginBottom: 16 }]}>
            <TodayRow icon="footsteps" label="Steps" value={`${todaySummary.steps}`} color={colors.str} />
            <TodayRow icon="moon" label="Sleep" value={`${todaySummary.sleep ?? 0}h`} color={colors.art} />
            <TodayRow icon="water" label="Water" value={`${todaySummary.water} ml`} color={colors.foc} />
            <TodayRow icon="restaurant" label="Calories" value={`${todaySummary.calories.toFixed(0)} kcal`} color={colors.str} />
            <TodayRow icon="barbell" label="Workouts" value={`${todaySummary.workouts} session`} color={colors.str} />
            <TodayRow icon="flash" label="Focus" value={`${todaySummary.mindMins} min`} color={colors.foc} />
            <TodayRow icon="people" label="Social" value={`${todaySummary.socialMins} min`} color={colors.soc} />
          </View>

          {/* ── Yearly Overview (GitHub Grid) ── */}
          <Text style={gs.sectionTitle}>Yearly Activity</Text>
          <View style={[gs.card, { paddingVertical: 18, marginBottom: 16 }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 6, minWidth: 280 }}>
                {gridData.map((mWeeks, mIdx) => (
                  <View key={`m-${mIdx}`} style={{ alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 10, color: colors.textSub, fontWeight: '700', letterSpacing: 0.5 }}>{monthLabels[mIdx]}</Text>
                    {mWeeks.map(wIndex => {
                      const heat = weeklyHeatmap[wIndex] || 0;
                      return (
                        <TouchableOpacity 
                          key={`w-${wIndex}`}
                          onPress={() => setSelectedWeekIndex(wIndex)}
                          style={{ 
                            width: 18, height: 18, borderRadius: 4, 
                            backgroundColor: heat > 0 ? colors.accent : colors.border,
                            opacity: wIndex === selectedWeekIndex ? 1 : Math.max(0.15, heat),
                            borderWidth: wIndex === selectedWeekIndex ? 2 : 0, 
                            borderColor: colors.text 
                          }} 
                        />
                      )
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* ── Dynamic Weekly Summary ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={gs.sectionTitle}>
              {selectedWeekIndex === 51 
                 ? "This Week's Totals" 
                 : `Week of ${formatDateDDMMYYYY(getDateBefore((51 - selectedWeekIndex) * 7 + 7))} - ${formatDateDDMMYYYY(getDateBefore((51 - selectedWeekIndex) * 7))}`}
            </Text>
            {selectedWeekIndex !== 51 && (
               <Text style={{ fontSize: 11, color: colors.textSub, fontWeight: '700' }}>{51 - selectedWeekIndex} weeks ago</Text>
            )}
          </View>
          <View style={[gs.card, { marginBottom: 16 }]}>
            <TodayRow icon="footsteps" label="Total Steps" value={`${weeklySummary.steps.toLocaleString()}`} color={colors.str} />
            <TodayRow icon="moon" label="Total Sleep" value={`${weeklySummary.sleepHrs.toFixed(1)}h`} color={colors.art} />
            <TodayRow icon="water" label="Total Water" value={`${(weeklySummary.waterMl/1000).toFixed(1)} L`} color={colors.foc} />
            <TodayRow icon="restaurant" label="Total Calories" value={`${weeklySummary.calories.toFixed(0)} kcal`} color={colors.str} />
            {weeklySummary.weightDiff !== 0 && (
              <TodayRow icon="scale" label="Weight Change" value={`${weeklySummary.weightDiff > 0 ? '+' : ''}${weeklySummary.weightDiff.toFixed(1)} kg`} color={colors.soc} />
            )}
            <TodayRow icon="flash" label="Mind/Focus" value={`${weeklySummary.mindMins} min`} color={colors.foc} />
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
