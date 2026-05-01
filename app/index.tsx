import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollView, Text, View, StyleSheet, RefreshControl,
  useWindowDimensions, TouchableOpacity, Animated, LogBox,
  LayoutAnimation, Platform, UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

LogBox.ignoreLogs([
  'Invalid DOM property `transform-origin`',
  'Unknown event handler property `onResponderTerminate`',
]);

import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Polygon, Line, Circle, Text as SvgText, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
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

// ── SVG Hexagon Chart (Stitch style) ──
function HexagonChart({
  stats, size = 260, colors, activeStat, setActiveStat
}: {
  stats: Record<StatKey, number>; size?: number; colors: any;
  activeStat: StatKey | null; setActiveStat: (s: StatKey | null) => void;
}) {
  const center = size / 2;
  const radius = (size / 2) - 44;

  const statKeys: StatKey[] = ['STR', 'FOC', 'ART', 'SOC', 'DIS', 'VIT'];
  const statColors = [colors.str, colors.foc, colors.art, colors.soc, colors.dis, colors.vit];
  const statLabels = ['STR', 'FOC', 'ART', 'SOC', 'DIS', 'VIT'];

  const getPoint = (val: number, angle: number) => {
    const r = (val / 100) * radius;
    const rad = angle * (Math.PI / 180);
    return { x: center + r * Math.sin(rad), y: center - r * Math.cos(rad) };
  };

  const points = statKeys.map((key) => getPoint(stats[key], statKeys.indexOf(key) * 60));
  const polyPoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const webs = [25, 50, 75, 100].map((v) =>
    statKeys.map((_, i) => getPoint(v, i * 60)).map((p) => `${p.x},${p.y}`).join(' ')
  );

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size}>
        {/* Web rings */}
        {webs.map((pts, i) => (
          <Polygon key={`web-${i}`} points={pts} stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
        ))}
        {/* Axis lines */}
        {statKeys.map((_, i) => {
          const p = getPoint(100, i * 60);
          return <Line key={`axis-${i}`} x1={center} y1={center} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
        })}
        {/* Data fill with gradient glow */}
        <Polygon
          points={polyPoints}
          fill="rgba(99,102,241,0.22)"
          stroke="#6366F1"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Vertex dots */}
        {points.map((p, i) => (
          <Circle key={`pt-${i}`} cx={p.x} cy={p.y} r="4" fill={statColors[i]} />
        ))}
        {/* Labels */}
        {statKeys.map((key, i) => {
          const p = getPoint(130, i * 60);
          const isActive = activeStat === key;
          return (
            <SvgText
              key={`lbl-${i}`}
              x={p.x} y={p.y + 5}
              fill={isActive ? '#ffffff' : 'rgba(199,196,215,0.8)'}
              fontSize={isActive ? '13' : '11'}
              fontWeight="700"
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor="middle"
            >
              {statLabels[i]}
            </SvgText>
          );
        })}
      </Svg>

      {/* Hit areas */}
      {statKeys.map((key, i) => {
        const pHit = getPoint(100, i * 60);
        return (
          <TouchableOpacity
            key={`hit-${i}`}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveStat(activeStat === key ? null : key);
            }}
            style={{
              position: 'absolute',
              left: pHit.x - 40,
              top: pHit.y - 40,
              width: 80,
              height: 80,
              borderRadius: 40,
              zIndex: 10,
            }}
          />
        );
      })}
    </View>
  );
}

// ── Stat attribute card ──
function AttributeCard({ statKey, value, color, isActive, onPress }: {
  statKey: string; value: number; color: string; isActive: boolean; onPress: () => void;
}) {
  const { colors } = useTheme();
  const statIcons: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
    VIT: 'heart', STR: 'barbell-outline', FOC: 'timer-outline', ART: 'brush-outline', SOC: 'chatbubbles-outline', DIS: 'shield-checkmark-outline',
  };
  const statNames: Record<string, string> = {
    VIT: 'Vitality', STR: 'Strength', FOC: 'Focus', ART: 'Creative', SOC: 'Social', DIS: 'Discipline',
  };
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.attrCard, {
        backgroundColor: isActive ? color + '22' : colors.surface,
        borderColor: isActive ? color + '60' : colors.border,
      }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={[s.attrIconWrap, { backgroundColor: color + '20' }]}>
          <Ionicons name={statIcons[statKey] ?? 'star'} size={14} color={color} />
        </View>
        <Text style={[s.attrLabel, { color: colors.textMuted }]}>{statNames[statKey]}</Text>
      </View>
      <Text style={[s.attrValue, { color: isActive ? color : colors.text }]}>{value}</Text>
      <View style={[s.attrBar, { backgroundColor: colors.border }]}>
        <View style={[s.attrBarFill, { width: `${value}%` as any, backgroundColor: color }]} />
      </View>
    </TouchableOpacity>
  );
}

// ── Today Stat Row (Stitch style) ──
function StatRow({ icon, label, value, color, subValue }: {
  icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string;
  color: string; subValue?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[s.statRow, { borderBottomColor: colors.border }]}>
      <View style={[s.statIconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.statLabel, { color: colors.textMuted }]}>{label}</Text>
        {subValue ? <Text style={[s.statSub, { color: colors.textSub }]}>{subValue}</Text> : null}
      </View>
      <Text style={[s.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
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

  useEffect(() => {
    if (activeStatHistory) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  }, [activeStatHistory]);

  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(51);
  const [weeklyHeatmap, setWeeklyHeatmap] = useState<number[]>([]);

  const [todaySummary, setTodaySummary] = useState<{
    sleep: number | null; water: number; waterGoal: number; workouts: number;
    mindMins: number; socialMins: number; calories: number; weight: number | null; steps: number;
  }>({ sleep: null, water: 0, waterGoal: 2500, workouts: 0, mindMins: 0, socialMins: 0, calories: 0, weight: null, steps: 0 });

  const [weeklySummary, setWeeklySummary] = useState<{
    sleepHrs: number; waterMl: number; workouts: number; mindMins: number;
    socialMins: number; calories: number; weightDiff: number; steps: number;
  }>({ sleepHrs: 0, waterMl: 0, workouts: 0, mindMins: 0, socialMins: 0, calories: 0, weightDiff: 0, steps: 0 });

  const [refreshing, setRefreshing] = useState(false);
  const today = toDay();

  const periods = [
    { value: 7, label: '7D' }, { value: 14, label: '14D' },
    { value: 30, label: '1M' }, { value: 365, label: '1Y' },
  ];

  const calcXp = (
    sleepLogs: SleepLog[], waterLogs: WaterLog[], workoutLogs: WorkoutLog[],
    stepLogs: StepLog[], mindLogs: MindLog[], socialLogs: SocialLog[], uniqueDates: string[]
  ) => {
    const vitSleep = sleepLogs.reduce((s, l) => s + Math.min(l.hours, 9) * 12, 0);
    const vitWater = waterLogs.reduce((s, l) => s + Math.min(l.totalMl, 3500) * 0.008, 0);
    const vitSteps = stepLogs.reduce((s, l) => s + Math.min(l.steps, 15000) * 0.003, 0);
    const vit = vitSleep + vitWater + vitSteps;
    const strWorkout = workoutLogs.reduce((s) => s + 150, 0);
    const strSteps = stepLogs.reduce((s, l) => s + Math.min(l.steps, 10000) * 0.002, 0);
    const str = strWorkout + strSteps;
    const foc = mindLogs.filter(l => l.statBoost === 'FOC').reduce((s, l) => s + Math.min(l.durationMinutes, 120) * 1.5, 0);
    const art = mindLogs.filter(l => l.statBoost === 'ART').reduce((s, l) => s + Math.min(l.durationMinutes, 120) * 1.5, 0);
    const soc = socialLogs.reduce((s, l) => s + Math.min(l.minutes, 180) * 1.2, 0);
    const dis = uniqueDates.length * 80;
    return { VIT: vit, STR: str, FOC: foc, ART: art, SOC: soc, DIS: dis };
  };

  const getSigmoidStat = (xpAmount: number) => {
    const k = 80000;
    return Math.max(1, Math.min(100, Math.round(1 + 99 * (1 - Math.exp(-xpAmount / k)))));
  };

  const computeStats = useCallback(async () => {
    const [sleepLogs, waterLogs, waterGoal, weightLogs, workoutLogs, mindLogs, socialLogs, nutritionLogs, stepLogs] =
      await Promise.all([
        loadData<SleepLog[]>(KEYS.sleepLogs, []), loadData<WaterLog[]>(KEYS.waterLogs, []),
        loadData<number>(KEYS.waterGoal, 2500), loadData<WeightLog[]>(KEYS.weightLogs, []),
        loadData<WorkoutLog[]>(KEYS.workoutLogs, []), loadData<MindLog[]>(KEYS.mindLogs, []),
        loadData<SocialLog[]>(KEYS.socialLogs, []), loadData<NutritionLog[]>(KEYS.nutritionLogs, []),
        loadData<StepLog[]>(KEYS.stepLogs, []),
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

    const uniqueDates = [...new Set([...sleepLogs, ...waterLogs, ...workoutLogs, ...mindLogs, ...socialLogs, ...stepLogs].map(l => l.date))];
    const totalXps = calcXp(sleepLogs, waterLogs, workoutLogs, stepLogs, mindLogs, socialLogs, uniqueDates);
    const newStats = {
      VIT: getSigmoidStat(totalXps.VIT), STR: getSigmoidStat(totalXps.STR), FOC: getSigmoidStat(totalXps.FOC),
      ART: getSigmoidStat(totalXps.ART), SOC: getSigmoidStat(totalXps.SOC), DIS: getSigmoidStat(totalXps.DIS),
    };
    setStats(newStats);

    const sumXp = Object.values(totalXps).reduce((s, v) => s + v, 0);
    setLevel(Math.floor(sumXp / 1000) + 1);
    setXp(Math.round(sumXp % 1000));

    // Weekly summary
    const daysAgoStart = (51 - selectedWeekIndex) * 7;
    const daysAgoEnd = daysAgoStart + 7;
    const weekStartStr = getDateBefore(daysAgoEnd);
    const weekEndStr = getDateBefore(daysAgoStart);
    const flt = (l: { date: string }) => l.date > weekStartStr && l.date <= weekEndStr;
    const wSleep = sleepLogs.filter(flt);
    const wWater = waterLogs.filter(flt);
    const wWork = workoutLogs.filter(flt);
    const wStep = stepLogs.filter(flt);
    const wMind = mindLogs.filter(flt);
    const wSoc = socialLogs.filter(flt);
    const wNut = nutritionLogs.filter(flt);
    let wDiff = 0;
    const wWeightLogs = weightLogs.filter(flt).sort((a, b) => a.date.localeCompare(b.date));
    if (wWeightLogs.length >= 2) wDiff = wWeightLogs[wWeightLogs.length - 1].kg - wWeightLogs[0].kg;
    setWeeklySummary({
      sleepHrs: wSleep.reduce((s, l) => s + l.hours, 0),
      waterMl: wWater.reduce((s, l) => s + l.totalMl, 0),
      workouts: wWork.length,
      mindMins: wMind.reduce((s, l) => s + l.durationMinutes, 0),
      socialMins: wSoc.reduce((s, l) => s + l.minutes, 0),
      calories: wNut.reduce((s, l) => s + l.macros.calories, 0),
      weightDiff: wDiff,
      steps: wStep.reduce((s, l) => s + l.steps, 0),
    });

    // Heatmap
    let hMap = new Array(52).fill(0);
    const todayNum = new Date(today).getTime();
    const assignToWeek = (logs: { date: string }[], getVal: (log: any) => number) => {
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
    const mXP = Math.max(1, ...hMap);
    setWeeklyHeatmap(hMap.map(val => val / mXP));

    // History line chart
    if (activeStat) {
      let historyLabels: string[] = [];
      let historyData: number[] = [];
      const now = new Date();
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
      if (historyData.length < 2) { historyLabels = ['...', 'Today']; historyData = [1, newStats[activeStat]]; }
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
  const chartColor = activeStat ? { VIT: colors.vit, STR: colors.str, FOC: colors.foc, ART: colors.art, SOC: colors.soc, DIS: colors.dis }[activeStat] : colors.accent;

  const monthLabels = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    return d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  });
  const gridDist = [4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5];
  let pointer = 0;
  const gridData = gridDist.map(size => {
    const weeks = [];
    for (let i = 0; i < size; i++) weeks.push(pointer++);
    return weeks;
  });

  const statKeys: StatKey[] = ['VIT', 'STR', 'FOC', 'ART', 'SOC', 'DIS'];
  const statColors = { VIT: colors.vit, STR: colors.str, FOC: colors.foc, ART: colors.art, SOC: colors.soc, DIS: colors.dis };

  // Determine greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* ── Header ── */}
      <View style={[s.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[s.headerSub, { color: colors.textMuted }]}>TECHNICAL ATHLETE</Text>
          <Text style={[s.headerTitle, { color: colors.text }]}>StatsEngine</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity
            style={[s.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={toggleTheme}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={colors.textSub} />
          </TouchableOpacity>
          <View style={[s.avatarRing, { borderColor: colors.accent }]}>
            <View style={[s.avatarInner, { backgroundColor: colors.accent + '40' }]}>
              <Ionicons name="person" size={16} color={colors.accent} />
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={gs.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View style={{ width: '100%', maxWidth: layout.maxWidth, paddingHorizontal: layout.hPadding, paddingTop: 20, alignSelf: 'center' }}>

          {/* ── Greeting ── */}
          <Text style={[s.greeting, { color: colors.text }]}>{greeting} 👋</Text>
          <Text style={[s.greetingDate, { color: colors.textSub }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>

          {/* ── Level / XP Hero Card ── */}
          <View style={[s.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Glow accent */}
            <View style={s.heroGlow} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <View>
                <Text style={[s.heroLevelLabel, { color: colors.textMuted }]}>LIFETIME LEVEL</Text>
                <Text style={[s.heroLevel, { color: colors.text }]}>{level}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={[gs.pill, { marginBottom: 4 }]}>
                  <Text style={gs.pillText}>Elite Class</Text>
                </View>
                <Text style={[s.heroXpSub, { color: colors.textSub }]}>{xp} / 1000 XP</Text>
              </View>
            </View>
            {/* XP bar */}
            <View style={[s.xpBarTrack, { backgroundColor: colors.border }]}>
              <View style={[s.xpBarFill, { width: `${xpPct}%` as any, backgroundColor: colors.accent }]} />
            </View>
            {/* Week dots */}
            <View style={s.weekDots}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => {
                const isToday = i === new Date().getDay() - 1;
                return (
                  <View key={i} style={s.weekDotCol}>
                    <View style={[s.weekDot, {
                      backgroundColor: i < (new Date().getDay() - 1) ? colors.accent : (isToday ? colors.accentDim : colors.border),
                      borderColor: isToday ? colors.accent : 'transparent',
                      borderWidth: isToday ? 1.5 : 0,
                    }]} />
                    <Text style={[s.weekDotLabel, { color: isToday ? colors.accent : colors.textMuted }]}>{d}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Today's Overview Cards ── */}
          <Text style={[gs.sectionTitle, { marginTop: 8 }]}>Today's Overview</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -layout.hPadding }} contentContainerStyle={{ paddingHorizontal: layout.hPadding, gap: 10 }}>
            {[
              { icon: 'trending-up' as const, label: 'Steps', value: todaySummary.steps.toLocaleString(), color: colors.str, tag: todaySummary.steps > 8000 ? 'Great' : 'Active' },
              { icon: 'moon' as const, label: 'Sleep', value: `${todaySummary.sleep ?? 0}h`, color: colors.vit, tag: (todaySummary.sleep ?? 0) >= 7 ? 'Optimal' : 'Track' },
              { icon: 'water' as const, label: 'Water', value: `${(todaySummary.water / 1000).toFixed(1)}L`, color: colors.foc, tag: todaySummary.water < 1500 ? 'Low' : 'Good' },
              { icon: 'nutrition' as const, label: 'Calories', value: `${Math.round(todaySummary.calories)} kcal`, color: colors.orange, tag: 'Log' },
              { icon: 'timer' as const, label: 'Focus', value: `${todaySummary.mindMins}m`, color: colors.art, tag: todaySummary.mindMins > 60 ? 'High' : 'Active' },
            ].map((item, i) => (
              <View key={i} style={[s.overviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <View style={[s.overviewIconWrap, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={[s.overviewTag, { color: item.color }]}>{item.tag}</Text>
                </View>
                <Text style={[s.overviewValue, { color: colors.text }]}>{item.value}</Text>
                <Text style={[s.overviewLabel, { color: colors.textMuted }]}>{item.label}</Text>
              </View>
            ))}
          </ScrollView>

          {/* ── Performance Radar (RPG Centerpiece) ── */}
          <Text style={[gs.sectionTitle, { marginTop: 20 }]}>Performance Radar</Text>
          <View style={[gs.card, { alignItems: 'center', paddingVertical: 28 }]}>
            <HexagonChart stats={stats} colors={colors} activeStat={activeStat} setActiveStat={(key) => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveStat(activeStat === key ? null : key);
            }} />
            {!activeStat && (
              <Text style={[s.radarHint, { color: colors.textMuted }]}>Tap an attribute to see history</Text>
            )}
          </View>

          {/* ── Attribute Cards 2×3 Grid ── */}
          <View style={s.attrGrid}>
            {statKeys.map((key) => (
              <AttributeCard
                key={key}
                statKey={key}
                value={stats[key]}
                color={statColors[key]}
                isActive={activeStat === key}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setActiveStat(activeStat === key ? null : key);
                }}
              />
            ))}
          </View>

          {/* ── Stat History Chart (when stat selected) ── */}
          {activeStat && activeStatHistory && (
            <Animated.View style={[gs.card, { opacity: fadeAnim, padding: 16 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View>
                  <Text style={[s.chartStatName, { color: chartColor }]}>
                    {activeStat} · {stats[activeStat]}
                  </Text>
                  <Text style={[s.chartStatSub, { color: colors.textMuted }]}>SCORE PROGRESSION</Text>
                </View>
                <TouchableOpacity
                  onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveStat(null); }}
                  style={[s.closeBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                >
                  <Ionicons name="close" size={16} color={colors.textSub} />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {periods.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    onPress={() => setActiveStatPeriod(p.value)}
                    style={[s.periodBtn, {
                      backgroundColor: activeStatPeriod === p.value ? chartColor + '22' : colors.surfaceAlt,
                      borderColor: activeStatPeriod === p.value ? chartColor : colors.border,
                    }]}
                  >
                    <Text style={[s.periodBtnText, { color: activeStatPeriod === p.value ? chartColor : colors.textSub }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ borderRadius: 12, overflow: 'hidden' }}>
                <LineChart
                  data={{
                    labels: activeStatHistory.labels.map((l, i) =>
                      i === 0 || i === activeStatHistory.labels.length - 1 ? l : ''
                    ),
                    datasets: [{ data: activeStatHistory.data }],
                  }}
                  width={Math.min(width - layout.hPadding * 2 - 40, 600)}
                  height={180}
                  chartConfig={{
                    backgroundColor: colors.surface,
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => {
                      const hex = chartColor.replace('#', '');
                      const r = parseInt(hex.substring(0, 2), 16) || 99;
                      const g = parseInt(hex.substring(2, 4), 16) || 102;
                      const b = parseInt(hex.substring(4, 6), 16) || 241;
                      return `rgba(${r},${g},${b},${opacity})`;
                    },
                    labelColor: () => colors.textMuted,
                    propsForDots: { r: '3', strokeWidth: '0', fill: chartColor },
                    propsForBackgroundLines: { stroke: colors.border },
                  }}
                  bezier
                  fromZero={false}
                  withInnerLines={false}
                  withDots={false}
                />
              </View>
            </Animated.View>
          )}

          {/* ── Today's Stats ── */}
          <Text style={[gs.sectionTitle, { marginTop: 8 }]}>Today</Text>
          <View style={gs.card}>
            <StatRow icon="trending-up" label="Steps" value={`${todaySummary.steps.toLocaleString()}`} color={colors.str} />
            <StatRow icon="moon" label="Sleep" value={`${todaySummary.sleep ?? 0}h`} color={colors.vit} subValue={todaySummary.sleep ? 'Logged' : 'Not logged'} />
            <StatRow icon="water" label="Water" value={`${todaySummary.water} ml`} color={colors.foc} subValue={`Goal: ${todaySummary.waterGoal} ml`} />
            <StatRow icon="nutrition" label="Calories" value={`${todaySummary.calories.toFixed(0)} kcal`} color={colors.orange} />
            <StatRow icon="barbell" label="Workouts" value={`${todaySummary.workouts} session${todaySummary.workouts !== 1 ? 's' : ''}`} color={colors.str} />
            <StatRow icon="timer" label="Focus" value={`${todaySummary.mindMins} min`} color={colors.art} />
            <StatRow icon="chatbubbles" label="Social" value={`${todaySummary.socialMins} min`} color={colors.soc} />
          </View>

          {/* ── Yearly Activity Heatmap ── */}
          <Text style={[gs.sectionTitle, { marginTop: 8 }]}>Yearly Activity</Text>
          <View style={[gs.card, { paddingVertical: 16 }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 5 }}>
                {gridData.map((mWeeks, mIdx) => (
                  <View key={`m-${mIdx}`} style={{ alignItems: 'center', gap: 5 }}>
                    <Text style={[s.monthLabel, { color: colors.textMuted }]}>{monthLabels[mIdx]}</Text>
                    {mWeeks.map(wIndex => {
                      const heat = weeklyHeatmap[wIndex] || 0;
                      const isSelected = wIndex === selectedWeekIndex;
                      return (
                        <TouchableOpacity
                          key={`w-${wIndex}`}
                          onPress={() => setSelectedWeekIndex(wIndex)}
                          style={[s.heatCell, {
                            backgroundColor: heat > 0 ? colors.accent : colors.border,
                            opacity: isSelected ? 1 : Math.max(0.12, heat),
                            borderWidth: isSelected ? 2 : 0,
                            borderColor: isSelected ? colors.text : 'transparent',
                          }]}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* ── Weekly Summary ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={gs.sectionTitle}>
              {selectedWeekIndex === 51 ? "This Week" : `Week of ${formatDateDDMMYYYY(getDateBefore((51 - selectedWeekIndex) * 7 + 7))}`}
            </Text>
            {selectedWeekIndex !== 51 && (
              <Text style={[s.weeksAgo, { color: colors.textMuted }]}>{51 - selectedWeekIndex}w ago</Text>
            )}
          </View>
          <View style={gs.card}>
            <StatRow icon="trending-up" label="Total Steps" value={weeklySummary.steps.toLocaleString()} color={colors.str} />
            <StatRow icon="moon" label="Total Sleep" value={`${weeklySummary.sleepHrs.toFixed(1)}h`} color={colors.vit} />
            <StatRow icon="water" label="Total Water" value={`${(weeklySummary.waterMl / 1000).toFixed(1)} L`} color={colors.foc} />
            <StatRow icon="nutrition" label="Total Calories" value={`${weeklySummary.calories.toFixed(0)} kcal`} color={colors.orange} />
            {weeklySummary.weightDiff !== 0 && (
              <StatRow icon="trending-down-outline" label="Weight Change"
                value={`${weeklySummary.weightDiff > 0 ? '+' : ''}${weeklySummary.weightDiff.toFixed(1)} kg`}
                color={weeklySummary.weightDiff > 0 ? colors.orange : colors.soc} />
            )}
            <StatRow icon="timer" label="Focus Time" value={`${weeklySummary.mindMins} min`} color={colors.art} />
          </View>
          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerSub: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  headerBtn: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  avatarRing: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, overflow: 'hidden' },
  avatarInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Greeting
  greeting: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4, marginBottom: 2 },
  greetingDate: { fontSize: 14, fontWeight: '300', marginBottom: 20 },
  // Hero Card
  heroCard: {
    borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 14,
    overflow: 'hidden', position: 'relative',
  },
  heroGlow: {
    position: 'absolute', right: -20, top: -20, width: 120, height: 120,
    backgroundColor: 'rgba(99,102,241,0.12)', borderRadius: 60,
  },
  heroLevelLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  heroLevel: { fontSize: 52, fontWeight: '900', lineHeight: 56, letterSpacing: -2 },
  heroXpSub: { fontSize: 12, fontWeight: '400' },
  xpBarTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 16 },
  xpBarFill: { height: '100%', borderRadius: 3 },
  weekDots: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDotCol: { alignItems: 'center', gap: 4 },
  weekDot: { width: 28, height: 4, borderRadius: 2 },
  weekDotLabel: { fontSize: 10, fontWeight: '600' },
  // Overview cards
  overviewCard: {
    minWidth: 120, padding: 14, borderRadius: 14, borderWidth: 1,
  },
  overviewIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  overviewTag: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  overviewValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, marginTop: 8, marginBottom: 2 },
  overviewLabel: { fontSize: 11, fontWeight: '500' },
  // Attribute cards
  attrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  attrCard: {
    flex: 1, minWidth: '45%', borderRadius: 12, padding: 12, borderWidth: 1, gap: 8,
  },
  attrIconWrap: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  attrLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  attrValue: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  attrBar: { height: 3, borderRadius: 2, overflow: 'hidden' },
  attrBarFill: { height: '100%', borderRadius: 2 },
  // Radar hint
  radarHint: { fontSize: 12, fontStyle: 'italic', marginTop: 12, textAlign: 'center' },
  // Chart
  chartStatName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  chartStatSub: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginTop: 2 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  periodBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  periodBtnText: { fontSize: 11, fontWeight: '700' },
  // Stat rows
  statRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 12,
  },
  statIconWrap: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 13, fontWeight: '600' },
  statSub: { fontSize: 11, fontWeight: '300' },
  statValue: { fontWeight: '700', fontSize: 14 },
  // Heatmap
  monthLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  heatCell: { width: 16, height: 16, borderRadius: 3 },
  // Weekly
  weeksAgo: { fontSize: 11, fontWeight: '600', marginBottom: 10 },
});
