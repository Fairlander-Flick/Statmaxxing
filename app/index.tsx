import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollView, Text, View, StyleSheet, RefreshControl,
  Platform, useWindowDimensions, TouchableOpacity, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle, Rect } from 'react-native-svg';
import { useTheme, makeGlobalStyles, ThemeColors } from '../lib/ThemeContext';
import { useLayout } from '../lib/useLayout';
import {
  loadData, KEYS, toDay,
  SleepLog, WaterLog, WeightLog, WorkoutLog, MindLog, SocialLog, NutritionLog, StepLog,
  StatLevels, DEFAULT_STAT_LEVELS, Goals,
  WeeklyStreakState, WeeklyGoals, DEFAULT_WEEKLY_GOALS, DailyNote,
} from '../lib/storage';
import StreakCalendar, { DayData } from '../components/StreakCalendar';
import { useGoals } from '../lib/useGoals';
import PentagonChart, { PentagonStats } from '../components/PentagonChart';
import { xpProgress, xpToNextLevel } from '../lib/xp';
import { refreshWeeklyStreak, computeThisWeekProgress, WeeklyProgress } from '../lib/weeklyStats';

// ─── Types ───────────────────────────────────────────────────────────────────
type DayPoint = { date: string; value: number; extras?: Record<string, number> };

// ─── Ring ────────────────────────────────────────────────────────────────────
function Ring({ pct, size = 52, strokeWidth = 4, color, trackColor }: {
  pct: number; size?: number; strokeWidth?: number; color: string; trackColor: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  const c = size / 2;
  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
      <Circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" rotation="-90" origin={`${c},${c}`} />
    </Svg>
  );
}

// ─── Spark ───────────────────────────────────────────────────────────────────
function Spark({ data, height = 70, accent, goalValue, maxValue, width: wp }: {
  data: number[]; height?: number; accent: string;
  goalValue?: number; maxValue?: number; width?: number;
}) {
  const { width: winW } = useWindowDimensions();
  const { hPadding } = useLayout();
  const width = wp ?? (winW - hPadding * 2 - 32);
  if (!data || data.length < 2) return <View style={{ height }} />;
  const max = maxValue ?? Math.max(...data, 1);
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => ({ x: i * stepX, y: height - (v / max) * height }));
  const pathD = pts.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
  const fillD = `M ${pts[0].x},${height} ` + pts.map(p => `L ${p.x},${p.y}`).join(' ') + ` L ${pts[pts.length - 1].x},${height} Z`;
  const goalY = goalValue !== undefined ? height - (goalValue / max) * height : null;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={accent} stopOpacity="0.20" />
          <Stop offset="100%" stopColor={accent} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={fillD} fill="url(#sg)" />
      <Path d={pathD} stroke={accent} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      {goalY !== null && (
        <Line x1={0} y1={goalY} x2={width} y2={goalY}
          stroke={accent} strokeWidth="1" strokeDasharray="4,4" strokeOpacity="0.5" />
      )}
    </Svg>
  );
}

// ─── Compare Bars ────────────────────────────────────────────────────────────
function CompareBars({ pairs, labels, accent, borderColor }: {
  pairs: { thisWeek: number; lastWeek: number }[];
  labels: string[]; accent: string; borderColor: string;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' }}>
      {pairs.map((pair, i) => {
        const m = Math.max(pair.thisWeek, pair.lastWeek, 1);
        return (
          <View key={i} style={{ alignItems: 'center', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 40 }}>
              <View style={{ width: 10, height: Math.max((pair.lastWeek / m) * 40, 2), borderRadius: 2, borderWidth: 1, borderColor, backgroundColor: 'transparent' }} />
              <View style={{ width: 10, height: Math.max((pair.thisWeek / m) * 40, 2), borderRadius: 2, backgroundColor: accent }} />
            </View>
            <Text style={{ fontSize: 9, color: borderColor, fontWeight: '500', letterSpacing: 0.5 }}>{labels[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── TodayChip ───────────────────────────────────────────────────────────────
function TodayChip({ icon, color, actual, goal, unit }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string; actual: number | null; goal: number; unit: string;
}) {
  const { colors } = useTheme();
  if (goal <= 0) return null;
  const met = actual !== null && actual >= goal;
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: 8, borderWidth: 1,
      borderColor: met ? color : colors.border,
      backgroundColor: colors.surface,
    }}>
      {met
        ? <Ionicons name="checkmark-circle" size={14} color={color} />
        : <Ionicons name={icon} size={14} color={actual === null ? colors.textMuted : color} />}
      {met
        ? <Text style={{ fontSize: 12, color, fontWeight: '600' }}>Done</Text>
        : actual === null
          ? <Text style={{ fontSize: 12, color: colors.textMuted }}>— / {goal} {unit}</Text>
          : <Text style={{ fontSize: 12, color: colors.textSub }}>{actual} / {goal} {unit}</Text>}
    </View>
  );
}

// ─── StatRow ─────────────────────────────────────────────────────────────────
function StatRow({ icon, label, value, color, sub }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; value: string; color: string; sub?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[ss.statRow, { borderBottomColor: colors.border }]}>
      <View style={[ss.statIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ss.statLabel, { color: colors.textMuted }]}>{label}</Text>
        {sub ? <Text style={[ss.statSub, { color: colors.textSub }]}>{sub}</Text> : null}
      </View>
      <Text style={[ss.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

// ─── RingCard ────────────────────────────────────────────────────────────────
function RingCard({ label, value, goal, pct, color, trackColor, borderColor, surfaceColor, textColor, textMutedColor }: {
  label: string; value: string; goal: string; pct: number;
  color: string; trackColor: string; borderColor: string;
  surfaceColor: string; textColor: string; textMutedColor: string;
}) {
  return (
    <View style={[ss.ringCard, { backgroundColor: surfaceColor, borderColor }]}>
      <Ring pct={pct} size={52} strokeWidth={4} color={color} trackColor={trackColor} />
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Text style={[ss.ringValue, { color: textColor }]}>{value}</Text>
        <Text style={[ss.ringLabel, { color: textMutedColor }]}>{label}</Text>
        <Text style={[ss.ringGoal, { color: textMutedColor }]}>{goal}</Text>
      </View>
    </View>
  );
}

// ─── SimpleBarChart ───────────────────────────────────────────────────────────
function SimpleBarChart({ data, color, unit, chartWidth }: {
  data: DayPoint[]; color: string; unit: string; chartWidth?: number;
}) {
  const { colors } = useTheme();
  const { width: winW } = useWindowDimensions();
  const w = chartWidth ?? winW - 64;
  const [sel, setSel] = useState<number | null>(null);
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(2, (w / data.length) - 2);

  return (
    <View>
      <View style={{ height: 80, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
        {data.map((d, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setSel(sel === i ? null : i)}
            style={{ width: barW, height: Math.max((d.value / max) * 80, 2), borderRadius: 2, backgroundColor: i === sel ? color : color + '55' }}
          />
        ))}
      </View>
      {sel !== null && (
        <View style={{ marginTop: 10, padding: 10, backgroundColor: colors.surfaceAlt, borderRadius: 8 }}>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>{data[sel].date}</Text>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '500', marginTop: 2 }}>
            {typeof data[sel].value === 'number' ? data[sel].value.toFixed(data[sel].value % 1 === 0 ? 0 : 1) : data[sel].value} {unit}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── CaloriesChart ────────────────────────────────────────────────────────────
function CaloriesChart({ data, chartWidth }: { data: DayPoint[]; chartWidth?: number }) {
  const { colors } = useTheme();
  const { width: winW } = useWindowDimensions();
  const w = chartWidth ?? winW - 64;
  const [sel, setSel] = useState<number | null>(null);
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(2, (w / data.length) - 2);
  const selDay = sel !== null ? data[sel] : null;

  return (
    <View>
      <View style={{ height: 80, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
        {data.map((d, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setSel(sel === i ? null : i)}
            style={{
              width: barW,
              height: Math.max((d.value / max) * 80, 2),
              borderRadius: 2,
              backgroundColor: i === sel ? colors.dis : colors.dis + '55',
            }}
          />
        ))}
      </View>
      {selDay && (
        <View style={{ marginTop: 10, padding: 12, backgroundColor: colors.surfaceAlt, borderRadius: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>{selDay.date}</Text>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '500' }}>{selDay.value.toFixed(0)} kcal</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[
              { label: 'Carbs', val: selDay.extras?.carbs, color: colors.str },
              { label: 'Protein', val: selDay.extras?.protein, color: colors.foc },
              { label: 'Fat', val: selDay.extras?.fat, color: colors.vit },
              { label: 'Fiber', val: selDay.extras?.fiber, color: colors.soc },
            ].map(m => (
              <View key={m.label} style={{ alignItems: 'center' }}>
                <Text style={{ color: m.color, fontSize: 14, fontWeight: '600' }}>{(m.val ?? 0).toFixed(0)}g</Text>
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '500', marginTop: 2 }}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── WeightRangeChart ─────────────────────────────────────────────────────────
function WeightRangeChart({ data, chartWidth }: { data: DayPoint[]; chartWidth?: number }) {
  const { colors } = useTheme();
  const { width: winW } = useWindowDimensions();
  const w = chartWidth ?? winW - 64;
  const H = 120;
  const [range, setRange] = useState<{ start: number; end: number } | null>(null);
  const startIdx = useRef(0);

  const xToIdx = (x: number) => Math.max(0, Math.min(data.length - 1, Math.round((x / w) * (data.length - 1))));
  const xForIdx = (i: number) => (i / Math.max(data.length - 1, 1)) * w;

  const kgValues = data.map(d => d.value).filter(v => v > 0);
  const minKg = kgValues.length ? Math.min(...kgValues) - 0.5 : 60;
  const maxKg = kgValues.length ? Math.max(...kgValues) + 0.5 : 100;
  const kgRange = maxKg - minKg || 1;
  const yForKg = (kg: number) => H - ((kg - minKg) / kgRange) * H;

  const pathD = data
    .filter(d => d.value > 0)
    .map((d, i, arr) => {
      const origIdx = data.indexOf(d);
      return `${i === 0 ? 'M' : 'L'} ${xForIdx(origIdx)},${yForKg(d.value)}`;
    })
    .join(' ');

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const idx = xToIdx(evt.nativeEvent.locationX);
      startIdx.current = idx;
      setRange({ start: idx, end: idx });
    },
    onPanResponderMove: (evt) => {
      const idx = xToIdx(evt.nativeEvent.locationX);
      setRange({ start: Math.min(startIdx.current, idx), end: Math.max(startIdx.current, idx) });
    },
    onPanResponderRelease: () => {},
    onPanResponderTerminate: () => {},
    onPanResponderTerminationRequest: () => true,
    onShouldBlockNativeResponder: () => false,
  })).current;

  const selInfo = (() => {
    if (!range || range.start === range.end) return null;
    const fromKg = data[range.start]?.value;
    const toKg = data[range.end]?.value;
    if (!fromKg || !toKg) return null;
    const delta = toKg - fromKg;
    const pct = (delta / fromKg) * 100;
    const days = range.end - range.start;
    return { delta, pct, from: fromKg, to: toKg, days };
  })();

  const selColor = selInfo ? (selInfo.delta <= 0 ? colors.green : colors.red) : colors.accent;

  return (
    <View>
      {selInfo ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 10 }}>
          <Text style={{ fontSize: 22, fontWeight: '400', color: selColor }}>
            {selInfo.delta > 0 ? '+' : ''}{selInfo.delta.toFixed(2)} kg
          </Text>
          <Text style={{ fontSize: 13, color: selColor, paddingBottom: 3 }}>
            {selInfo.delta > 0 ? '+' : ''}{selInfo.pct.toFixed(1)}%
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, paddingBottom: 3 }}>
            {selInfo.from.toFixed(1)} → {selInfo.to.toFixed(1)} kg · {selInfo.days}d
          </Text>
        </View>
      ) : (
        <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 10 }}>
          Drag to select a range
        </Text>
      )}
      <View
        {...panResponder.panHandlers}
        // Web mouse events as fallback
        {...(Platform.OS === 'web' ? {
          onMouseDown: (e: any) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const idx = xToIdx(e.clientX - rect.left);
            startIdx.current = idx;
            setRange({ start: idx, end: idx });
          },
          onMouseMove: (e: any) => {
            if (e.buttons !== 1) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const idx = xToIdx(e.clientX - rect.left);
            setRange({ start: Math.min(startIdx.current, idx), end: Math.max(startIdx.current, idx) });
          },
        } : {})}
      >
        <Svg width={w} height={H}>
          {range && range.start !== range.end && (
            <Rect
              x={xForIdx(range.start)} y={0}
              width={xForIdx(range.end) - xForIdx(range.start)} height={H}
              fill={selColor + '18'}
            />
          )}
          {data.length > 1 && pathD && (
            <Path d={pathD} stroke={colors.soc} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
          )}
          {range && data[range.start]?.value > 0 && (
            <Circle cx={xForIdx(range.start)} cy={yForKg(data[range.start].value)} r={4} fill={selColor} />
          )}
          {range && range.start !== range.end && data[range.end]?.value > 0 && (
            <Circle cx={xForIdx(range.end)} cy={yForKg(data[range.end].value)} r={4} fill={selColor} />
          )}
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ fontSize: 10, color: colors.textMuted }}>{data[0]?.date.slice(5)}</Text>
        <Text style={{ fontSize: 10, color: colors.textMuted }}>{data[data.length - 1]?.date.slice(5)}</Text>
      </View>
    </View>
  );
}

// ─── Graph types ──────────────────────────────────────────────────────────────
const GRAPH_DEFS = [
  { id: 'momentum', label: 'Momentum', icon: 'analytics-outline' as const },
  { id: 'compare', label: 'Compare', icon: 'bar-chart-outline' as const },
  { id: 'calories', label: 'Calories', icon: 'restaurant-outline' as const },
  { id: 'weight', label: 'Weight', icon: 'scale-outline' as const },
  { id: 'sleep', label: 'Sleep', icon: 'moon-outline' as const },
  { id: 'water', label: 'Water', icon: 'water-outline' as const },
  { id: 'focus', label: 'Focus', icon: 'timer-outline' as const },
  { id: 'social', label: 'Social', icon: 'people-outline' as const },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDateBefore(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function computeDayScore(
  sleep: number | null, water: number, steps: number, workout: number, mindMins: number,
  goals: { sleepHours: number; waterMl: number; steps: number; focusMinutes: number },
): number {
  const s = goals.sleepHours > 0 ? Math.min((sleep ?? 0) / goals.sleepHours, 1) * 25 : 0;
  const w = goals.waterMl > 0 ? Math.min(water / goals.waterMl, 1) * 25 : 0;
  const st = goals.steps > 0 ? Math.min(steps / goals.steps, 1) * 25 : 0;
  const f = workout > 0 ? 25 : (goals.focusMinutes > 0 ? Math.min(mindMins / goals.focusMinutes, 1) * 25 : 0);
  return Math.round(s + w + st + f);
}

const last30 = Array.from({ length: 30 }, (_, i) => getDateBefore(29 - i));

function computeStatScores(
  sleep: number | null, water: number, steps: number,
  workout: number, mindMins: number, socialMins: number,
  goals: Goals,
): PentagonStats {
  const sleepPct  = goals.sleepHours > 0   ? Math.min((sleep ?? 0) / goals.sleepHours, 1) : 0;
  const waterPct  = goals.waterMl > 0      ? Math.min(water / goals.waterMl, 1) : 0;
  const stepsPct  = goals.steps > 0        ? Math.min(steps / goals.steps, 1) : 0;
  const focusPct  = goals.focusMinutes > 0  ? Math.min(mindMins / goals.focusMinutes, 1) : 0;
  const workout01 = workout > 0 ? 1 : 0;
  const socPct    = Math.min(socialMins / 60, 1);
  const dis       = (sleepPct + waterPct + stepsPct + focusPct + workout01) / 5;
  return {
    vit: Math.round((sleepPct * 0.5 + waterPct * 0.5) * 100),
    str: Math.round((stepsPct * 0.5 + workout01 * 0.5) * 100),
    foc: Math.round(focusPct * 100),
    soc: Math.round(socPct * 100),
    dis: Math.round(dis * 100),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const layout = useLayout();
  const gs = makeGlobalStyles(colors);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const { goals } = useGoals();

  // Graph selector state
  const [selectedGraphs, setSelectedGraphs] = useState<string[]>(['momentum', 'compare']);
  const toggleGraph = (id: string) => {
    setSelectedGraphs(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  // Right column width for chart sizing
  const [rightColW, setRightColW] = useState(0);

  // Core state
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(51);
  const [weeklyHeatmap, setWeeklyHeatmap] = useState<number[]>([]);
  const [todaySummary, setTodaySummary] = useState<{
    sleep: number | null; water: number; workouts: number;
    mindMins: number; socialMins: number; calories: number; weight: number | null; steps: number;
  }>({ sleep: null, water: 0, workouts: 0, mindMins: 0, socialMins: 0, calories: 0, weight: null, steps: 0 });
  const [weeklySummary, setWeeklySummary] = useState<{
    sleepHrs: number; waterMl: number; workouts: number; mindMins: number;
    socialMins: number; calories: number; weightDiff: number; steps: number;
  }>({ sleepHrs: 0, waterMl: 0, workouts: 0, mindMins: 0, socialMins: 0, calories: 0, weightDiff: 0, steps: 0 });
  const [lastWeekSummary, setLastWeekSummary] = useState<{
    sleepHrs: number; steps: number; workouts: number; mindMins: number; socialMins: number;
  }>({ sleepHrs: 0, steps: 0, workouts: 0, mindMins: 0, socialMins: 0 });
  const [dailyScores, setDailyScores] = useState<{ date: string; score: number }[]>([]);
  const [streak, setStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [statLevels, setStatLevels] = useState<StatLevels>(DEFAULT_STAT_LEVELS);
  const [weeklyStreak, setWeeklyStreak] = useState<WeeklyStreakState>({ current: 0, best: 0, lastCheckedWeek: '' });
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoals>(DEFAULT_WEEKLY_GOALS);
  const [weekProgress, setWeekProgress] = useState<WeeklyProgress>({ focusMinutes: 0, gymSessions: 0, waterMlTotal: 0, caloriesTotal: 0, stepsTotal: 0 });
  const [calendarDays, setCalendarDays] = useState<DayData[]>([]);
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);

  // Per-graph data
  const [caloriesData, setCaloriesData] = useState<DayPoint[]>([]);
  const [weightData, setWeightData] = useState<DayPoint[]>([]);
  const [sleepData, setSleepData] = useState<DayPoint[]>([]);
  const [waterData, setWaterData] = useState<DayPoint[]>([]);
  const [focusData, setFocusData] = useState<DayPoint[]>([]);
  const [socialData, setSocialData] = useState<DayPoint[]>([]);

  const today = toDay();

  const computeStats = useCallback(async () => {
    const [sleepLogs, waterLogs, weightLogs, workoutLogs, mindLogs, socialLogs, nutritionLogs, stepLogs] =
      await Promise.all([
        loadData<SleepLog[]>(KEYS.sleepLogs, []),
        loadData<WaterLog[]>(KEYS.waterLogs, []),
        loadData<WeightLog[]>(KEYS.weightLogs, []),
        loadData<WorkoutLog[]>(KEYS.workoutLogs, []),
        loadData<MindLog[]>(KEYS.mindLogs, []),
        loadData<SocialLog[]>(KEYS.socialLogs, []),
        loadData<NutritionLog[]>(KEYS.nutritionLogs, []),
        loadData<StepLog[]>(KEYS.stepLogs, []),
      ]);

    // Today
    const tSleep = sleepLogs.find(l => l.date === today)?.hours ?? null;
    const tWater = waterLogs.find(l => l.date === today)?.totalMl ?? 0;
    const tWork = workoutLogs.filter(l => l.date === today).length;
    const tMind = mindLogs.filter(l => l.date === today).reduce((s, l) => s + l.durationMinutes, 0);
    const tSoc = socialLogs.filter(l => l.date === today).reduce((s, l) => s + l.minutes, 0);
    const tCal = nutritionLogs.filter(l => l.date === today).reduce((s, l) => s + l.macros.calories, 0);
    const tWeight = weightLogs.find(l => l.date === today)?.kg ?? null;
    const tSteps = stepLogs.find(l => l.date === today)?.steps ?? 0;
    setTodaySummary({ sleep: tSleep, water: tWater, workouts: tWork, mindMins: tMind, socialMins: tSoc, calories: tCal, weight: tWeight, steps: tSteps });

    const levels = await loadData<StatLevels>(KEYS.statLevels, DEFAULT_STAT_LEVELS);
    setStatLevels(levels);

    const [wStreak, wGoals, wProg] = await Promise.all([
      refreshWeeklyStreak(),
      loadData<WeeklyGoals>(KEYS.weeklyGoals, DEFAULT_WEEKLY_GOALS),
      computeThisWeekProgress(),
    ]);
    setWeeklyStreak(wStreak);
    setWeeklyGoals(wGoals);
    setWeekProgress(wProg);

    // This week
    const dAgoStart = (51 - selectedWeekIndex) * 7;
    const dAgoEnd = dAgoStart + 7;
    const wkS = getDateBefore(dAgoEnd);
    const wkE = getDateBefore(dAgoStart);
    const flt = (l: { date: string }) => l.date > wkS && l.date <= wkE;
    const lwS = getDateBefore(14), lwE = getDateBefore(7);
    const fltLw = (l: { date: string }) => l.date > lwS && l.date <= lwE;
    let wDiff = 0;
    const wW = weightLogs.filter(flt).sort((a, b) => a.date.localeCompare(b.date));
    if (wW.length >= 2) wDiff = wW[wW.length - 1].kg - wW[0].kg;
    setWeeklySummary({
      sleepHrs: sleepLogs.filter(flt).reduce((s, l) => s + l.hours, 0),
      waterMl: waterLogs.filter(flt).reduce((s, l) => s + l.totalMl, 0),
      workouts: workoutLogs.filter(flt).length,
      mindMins: mindLogs.filter(flt).reduce((s, l) => s + l.durationMinutes, 0),
      socialMins: socialLogs.filter(flt).reduce((s, l) => s + l.minutes, 0),
      calories: nutritionLogs.filter(flt).reduce((s, l) => s + l.macros.calories, 0),
      weightDiff: wDiff,
      steps: stepLogs.filter(flt).reduce((s, l) => s + l.steps, 0),
    });
    setLastWeekSummary({
      sleepHrs: sleepLogs.filter(fltLw).reduce((s, l) => s + l.hours, 0),
      steps: stepLogs.filter(fltLw).reduce((s, l) => s + l.steps, 0),
      workouts: workoutLogs.filter(fltLw).length,
      mindMins: mindLogs.filter(fltLw).reduce((s, l) => s + l.durationMinutes, 0),
      socialMins: socialLogs.filter(fltLw).reduce((s, l) => s + l.minutes, 0),
    });

    // 30-day scores
    const scores = last30.map(dateStr => {
      const dS = sleepLogs.find(l => l.date === dateStr)?.hours ?? null;
      const dW = waterLogs.find(l => l.date === dateStr)?.totalMl ?? 0;
      const dSt = stepLogs.find(l => l.date === dateStr)?.steps ?? 0;
      const dWk = workoutLogs.filter(l => l.date === dateStr).length;
      const dM = mindLogs.filter(l => l.date === dateStr).reduce((s, l) => s + l.durationMinutes, 0);
      return { date: dateStr, score: computeDayScore(dS, dW, dSt, dWk, dM, goals) };
    });
    setDailyScores(scores);

    // Streak
    const allDates = new Set([...sleepLogs, ...waterLogs, ...workoutLogs, ...mindLogs, ...socialLogs, ...stepLogs].map(l => l.date));
    let str = 0;
    for (let i = 0; i <= 365; i++) { if (allDates.has(getDateBefore(i))) str++; else break; }
    setStreak(str);

    // Heatmap
    const hMap = new Array(52).fill(0);
    const todayNum = new Date(today).getTime();
    const assign = (logs: { date: string }[], fn: (l: any) => number) => {
      logs.forEach(l => {
        const dAgo = Math.floor((todayNum - new Date(l.date).getTime()) / 86400000);
        const wi = 51 - Math.floor(dAgo / 7);
        if (wi >= 0 && wi <= 51) hMap[wi] += fn(l);
      });
    };
    assign(sleepLogs, l => l.hours * 10);
    assign(waterLogs, l => l.totalMl * 0.015);
    assign(workoutLogs, () => 100);
    assign(stepLogs, l => l.steps * 0.015);
    assign(mindLogs, l => l.durationMinutes);
    assign(socialLogs, l => l.minutes);
    const mXP = Math.max(1, ...hMap);
    setWeeklyHeatmap(hMap.map(v => v / mXP));

    // Per-graph 30-day data
    setCaloriesData(last30.map(date => {
      const logs = nutritionLogs.filter(l => l.date === date);
      return {
        date,
        value: logs.reduce((s, l) => s + l.macros.calories, 0),
        extras: {
          carbs: logs.reduce((s, l) => s + l.macros.carbs, 0),
          protein: logs.reduce((s, l) => s + l.macros.protein, 0),
          fat: logs.reduce((s, l) => s + l.macros.fat, 0),
          fiber: logs.reduce((s, l) => s + l.macros.fiber, 0),
        },
      };
    }));
    setWeightData(last30.map(date => ({
      date,
      value: weightLogs.filter(l => l.date === date).slice(-1)[0]?.kg ?? 0,
    })));
    setSleepData(last30.map(date => ({
      date,
      value: sleepLogs.find(l => l.date === date)?.hours ?? 0,
    })));
    setWaterData(last30.map(date => ({
      date,
      value: (waterLogs.find(l => l.date === date)?.totalMl ?? 0) / 1000,
    })));
    setFocusData(last30.map(date => ({
      date,
      value: mindLogs.filter(l => l.date === date).reduce((s, l) => s + l.durationMinutes, 0),
    })));
    setSocialData(last30.map(date => ({
      date,
      value: socialLogs.filter(l => l.date === date).reduce((s, l) => s + l.minutes, 0),
    })));

    const notes = await loadData<DailyNote[]>(KEYS.dailyNotes, []);
    setDailyNotes(notes);

    const last90 = Array.from({ length: 90 }, (_, i) => getDateBefore(89 - i));
    const calDays: DayData[] = last90.map(date => {
      const dSleep = sleepLogs.find(l => l.date === date)?.hours ?? null;
      const dWater = waterLogs.find(l => l.date === date)?.totalMl ?? 0;
      const dSteps = stepLogs.find(l => l.date === date)?.steps ?? 0;
      const dWork  = workoutLogs.some(l => l.date === date);
      const dFocus = mindLogs.filter(l => l.date === date).reduce((s, l) => s + l.durationMinutes, 0);

      let goalsHit = 0;
      if (dSleep !== null && dSleep >= goals.sleepHours) goalsHit++;
      if (dWater >= goals.waterMl) goalsHit++;
      if (dSteps >= goals.steps) goalsHit++;
      if (dWork) goalsHit++;
      if (dFocus >= goals.focusMinutes) goalsHit++;

      return {
        date, goalsHit, totalGoals: 5,
        note: notes.find(n => n.date === date),
        sleepHours: dSleep,
        steps: dSteps,
        focusMins: dFocus,
      };
    });
    setCalendarDays(calDays);
  }, [today, selectedWeekIndex]);

  useEffect(() => { computeStats(); }, [computeStats]);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await computeStats();
    setRefreshing(false);
  }, [computeStats]);

  // Derived
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning.' : hour < 17 ? 'Good afternoon.' : 'Good evening.';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const dateKicker = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  const monthLabels = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (11 - i));
    return d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  });
  const gridDist = [4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5];
  let pointer = 0;
  const gridData = gridDist.map(size => {
    const weeks = [];
    for (let i = 0; i < size; i++) weeks.push(pointer++);
    return weeks;
  });

  const scoreValues = dailyScores.map(d => d.score);
  const avg30 = scoreValues.length ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) : 0;
  const comparePairs = [
    { thisWeek: weeklySummary.steps, lastWeek: lastWeekSummary.steps },
    { thisWeek: weeklySummary.sleepHrs * 60, lastWeek: lastWeekSummary.sleepHrs * 60 },
    { thisWeek: weeklySummary.workouts, lastWeek: lastWeekSummary.workouts },
    { thisWeek: weeklySummary.mindMins, lastWeek: lastWeekSummary.mindMins },
    { thisWeek: weeklySummary.socialMins, lastWeek: lastWeekSummary.socialMins },
  ];

  // Font weight helper for light mode readability
  const fw = (thin: '200' | '300', normal: '400' | '500') => isDark ? thin : normal;

  // ── Shared blocks ───────────────────────────────────────────────────────────

  const graphSelector = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={{ marginBottom: 12 }}
      contentContainerStyle={{ gap: 6, paddingHorizontal: isDesktop ? 0 : layout.hPadding, paddingVertical: 2 }}
    >
      {GRAPH_DEFS.map(g => {
        const on = selectedGraphs.includes(g.id);
        return (
          <TouchableOpacity
            key={g.id}
            onPress={() => toggleGraph(g.id)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999,
              backgroundColor: on ? colors.accentDim : colors.surface,
              borderWidth: 1, borderColor: on ? colors.accent : colors.border,
            }}
          >
            <Ionicons name={g.icon} size={13} color={on ? colors.accent : colors.textMuted} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: on ? colors.accent : colors.textMuted }}>
              {g.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const ringSection = (
    <View style={[gs.card, { marginBottom: 0 }]}>
      <Text style={[gs.sectionTitle, { marginBottom: 14 }]}>RINGS</Text>
      <View style={ss.ringGrid}>
        {[
          { label: 'STEPS', value: todaySummary.steps.toLocaleString(), goal: `/ ${goals.steps.toLocaleString()}`, pct: goals.steps > 0 ? todaySummary.steps / goals.steps : 0, color: colors.str },
          { label: 'WATER', value: `${(todaySummary.water / 1000).toFixed(1)}L`, goal: `/ ${(goals.waterMl / 1000).toFixed(1)}L`, pct: goals.waterMl > 0 ? todaySummary.water / goals.waterMl : 0, color: colors.foc },
          { label: 'SLEEP', value: `${todaySummary.sleep ?? 0}h`, goal: `/ ${goals.sleepHours}h`, pct: goals.sleepHours > 0 ? (todaySummary.sleep ?? 0) / goals.sleepHours : 0, color: colors.vit },
          { label: 'FOCUS', value: `${todaySummary.mindMins}m`, goal: `/ ${goals.focusMinutes}m`, pct: goals.focusMinutes > 0 ? todaySummary.mindMins / goals.focusMinutes : 0, color: colors.accent },
        ].map(r => (
          <RingCard key={r.label}
            label={r.label} value={r.value} goal={r.goal} pct={r.pct}
            color={r.color} trackColor={colors.border}
            borderColor={colors.border}
            surfaceColor={isDesktop ? colors.surfaceAlt : colors.surface}
            textColor={colors.text} textMutedColor={colors.textMuted}
          />
        ))}
      </View>
    </View>
  );

  const todayLog = (
    <View style={[gs.card, { marginTop: 0 }]}>
      <Text style={[gs.sectionTitle, { marginBottom: 4 }]}>TODAY</Text>
      <StatRow icon="trending-up" label="Steps" value={todaySummary.steps.toLocaleString()} color={colors.str} />
      <StatRow icon="moon" label="Sleep" value={`${todaySummary.sleep ?? 0}h`} color={colors.vit} sub={todaySummary.sleep ? 'Logged' : 'Not logged'} />
      <StatRow icon="water" label="Water" value={`${todaySummary.water} ml`} color={colors.foc} sub={`Goal: ${goals.waterMl} ml`} />
      <StatRow icon="nutrition" label="Calories" value={`${todaySummary.calories.toFixed(0)} kcal`} color={colors.dis} />
      <StatRow icon="barbell" label="Workouts" value={`${todaySummary.workouts} session${todaySummary.workouts !== 1 ? 's' : ''}`} color={colors.str} />
      <StatRow icon="timer" label="Focus" value={`${todaySummary.mindMins} min`} color={colors.accent} />
    </View>
  );

  const pentagonCard = (
    <View style={[gs.card, { alignItems: 'center', paddingVertical: 24, marginBottom: 0 }]}>
      <Text style={[gs.sectionTitle, { marginBottom: 16, alignSelf: 'flex-start' }]}>STAT PROFILE</Text>
      <PentagonChart
        stats={computeStatScores(
          todaySummary.sleep, todaySummary.water, todaySummary.steps,
          todaySummary.workouts, todaySummary.mindMins, todaySummary.socialMins,
          goals,
        )}
        levels={{
          vit: statLevels.vit.level,
          str: statLevels.str.level,
          foc: statLevels.foc.level,
          soc: statLevels.soc.level,
          dis: statLevels.dis.level,
        }}
        size={isDesktop ? 280 : 240}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20, width: '100%' }}>
        {(['vit', 'str', 'foc', 'soc', 'dis'] as const).map(stat => {
          const sl = statLevels[stat];
          const pct = xpProgress(sl);
          const statColor = colors[stat];
          return (
            <View key={stat} style={{ flex: 1, minWidth: 80 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: statColor, letterSpacing: 0.5 }}>{stat.toUpperCase()}</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>Lv.{sl.level}</Text>
              </View>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
                <View style={{ width: `${Math.round(pct * 100)}%` as any, height: 4, borderRadius: 2, backgroundColor: statColor }} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  const calendarCard = (
    <View style={gs.card}>
      <Text style={[gs.sectionTitle, { marginBottom: 12 }]}>HISTORY · 90D</Text>
      <StreakCalendar days={calendarDays} />
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, alignItems: 'center' }}>
        <Text style={{ fontSize: 10, color: colors.textMuted }}>less</Text>
        {[0, 0.3, 0.6, 0.9, 1].map((r, i) => (
          <View key={i} style={{
            width: 10, height: 10, borderRadius: 2,
            backgroundColor: r === 0 ? colors.surfaceAlt : colors.dis + Math.round(r * 255).toString(16).padStart(2, '0'),
          }} />
        ))}
        <Text style={{ fontSize: 10, color: colors.textMuted }}>more</Text>
      </View>
    </View>
  );

  const heatmapCard = (
    <View style={gs.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Text style={[gs.sectionTitle, { marginBottom: 0, marginTop: 0 }]}>A YEAR, QUIETLY</Text>
        {streak > 0 && (
          <View style={[ss.streakBadge, { backgroundColor: colors.accentDim }]}>
            <Text style={[ss.streakBadgeText, { color: colors.accent }]}>{streak}d</Text>
          </View>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {gridData.map((mWeeks, mIdx) => (
            <View key={`m-${mIdx}`} style={{ alignItems: 'center', gap: 4 }}>
              <Text style={[ss.monthLabel, { color: colors.textMuted }]}>{monthLabels[mIdx]}</Text>
              {mWeeks.map(wIndex => {
                const heat = weeklyHeatmap[wIndex] || 0;
                const isSel = wIndex === selectedWeekIndex;
                return (
                  <TouchableOpacity key={`w-${wIndex}`} onPress={() => setSelectedWeekIndex(wIndex)}
                    style={[ss.heatCell, {
                      backgroundColor: heat > 0 ? colors.accent : colors.border,
                      opacity: isSel ? 1 : Math.max(0.12, heat),
                      borderWidth: isSel ? 1.5 : 0,
                      borderColor: isSel ? colors.text : 'transparent',
                    }]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const weeklyCard = (
    <View style={gs.card}>
      <Text style={[gs.sectionTitle, { marginBottom: 4 }]}>
        {selectedWeekIndex === 51 ? 'THIS WEEK' : `${51 - selectedWeekIndex}W AGO`}
      </Text>
      <StatRow icon="trending-up" label="Total Steps" value={weeklySummary.steps.toLocaleString()} color={colors.str} />
      <StatRow icon="moon" label="Total Sleep" value={`${weeklySummary.sleepHrs.toFixed(1)}h`} color={colors.vit} />
      <StatRow icon="water" label="Total Water" value={`${(weeklySummary.waterMl / 1000).toFixed(1)} L`} color={colors.foc} />
      <StatRow icon="nutrition" label="Calories" value={`${weeklySummary.calories.toFixed(0)} kcal`} color={colors.dis} />
      {weeklySummary.weightDiff !== 0 && (
        <StatRow icon="trending-down-outline" label="Weight Change"
          value={`${weeklySummary.weightDiff > 0 ? '+' : ''}${weeklySummary.weightDiff.toFixed(1)} kg`}
          color={weeklySummary.weightDiff > 0 ? colors.orange : colors.green}
        />
      )}
      <StatRow icon="timer" label="Focus Time" value={`${weeklySummary.mindMins} min`} color={colors.accent} />
    </View>
  );

  const renderGraphCard = (id: string, cw?: number) => {
    const innerW = cw ? cw - 32 : undefined;
    switch (id) {
      case 'momentum':
        return (
          <View key="momentum" style={gs.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <View>
                <Text style={[gs.sectionTitle, { marginBottom: 4, marginTop: 0 }]}>30-DAY MOMENTUM</Text>
                <Text style={{ fontSize: 32, fontWeight: fw('300', '400'), color: colors.text, letterSpacing: -0.8 }}>
                  {dailyScores[dailyScores.length - 1]?.score ?? 0}
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.textMuted, paddingBottom: 4 }}>avg {avg30}</Text>
            </View>
            <Spark data={scoreValues} height={isDesktop ? 100 : 80} accent={colors.accent} goalValue={75} maxValue={100} width={innerW} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>{last30[0]?.slice(5)}</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>{last30[last30.length - 1]?.slice(5)}</Text>
            </View>
          </View>
        );
      case 'compare':
        return (
          <View key="compare" style={gs.card}>
            <Text style={[gs.sectionTitle, { marginBottom: 16 }]}>THIS WEEK VS LAST</Text>
            <CompareBars pairs={comparePairs} labels={['Steps', 'Sleep', 'Lifts', 'Focus', 'People']} accent={colors.accent} borderColor={colors.textMuted} />
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 14, justifyContent: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 8, height: 8, borderRadius: 1, borderWidth: 1, borderColor: colors.textMuted }} />
                <Text style={{ fontSize: 10, fontWeight: '500', color: colors.textMuted }}>Last</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 8, height: 8, borderRadius: 1, backgroundColor: colors.accent }} />
                <Text style={{ fontSize: 10, fontWeight: '500', color: colors.textMuted }}>This</Text>
              </View>
            </View>
          </View>
        );
      case 'calories':
        return (
          <View key="calories" style={gs.card}>
            <Text style={[gs.sectionTitle, { marginBottom: 2 }]}>CALORIES · 30D</Text>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 12 }}>Tap a bar for macro breakdown</Text>
            <CaloriesChart data={caloriesData} chartWidth={innerW} />
          </View>
        );
      case 'weight':
        return (
          <View key="weight" style={gs.card}>
            <Text style={[gs.sectionTitle, { marginBottom: 2 }]}>WEIGHT · 30D</Text>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 10 }}>Drag to compare any range</Text>
            <WeightRangeChart data={weightData} chartWidth={innerW} />
          </View>
        );
      case 'sleep':
        return (
          <View key="sleep" style={gs.card}>
            <Text style={[gs.sectionTitle, { marginBottom: 12 }]}>SLEEP · 30D</Text>
            <SimpleBarChart data={sleepData} color={colors.vit} unit="h" chartWidth={innerW} />
          </View>
        );
      case 'water':
        return (
          <View key="water" style={gs.card}>
            <Text style={[gs.sectionTitle, { marginBottom: 12 }]}>WATER · 30D</Text>
            <SimpleBarChart data={waterData} color={colors.foc} unit="L" chartWidth={innerW} />
          </View>
        );
      case 'focus':
        return (
          <View key="focus" style={gs.card}>
            <Text style={[gs.sectionTitle, { marginBottom: 12 }]}>FOCUS · 30D</Text>
            <SimpleBarChart data={focusData} color={colors.accent} unit="min" chartWidth={innerW} />
          </View>
        );
      case 'social':
        return (
          <View key="social" style={gs.card}>
            <Text style={[gs.sectionTitle, { marginBottom: 12 }]}>SOCIAL · 30D</Text>
            <SimpleBarChart data={socialData} color={colors.soc} unit="min" chartWidth={innerW} />
          </View>
        );
      default: return null;
    }
  };

  // ── Desktop ─────────────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={[ss.desktopHeader, { borderBottomColor: colors.border, backgroundColor: colors.bg }]}>
          <View>
            <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textMuted, marginBottom: 4 }}>{dateStr}</Text>
            <Text style={{ fontSize: 28, fontWeight: fw('200', '300'), color: colors.text, letterSpacing: -0.7 }}>{greeting}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {streak > 0 && (
              <View style={[ss.streakPill, { backgroundColor: colors.accentDim }]}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: colors.accent }}>{streak}-day rhythm</Text>
              </View>
            )}
            {weeklyStreak.current > 0 && (
              <View style={[ss.streakPill, { backgroundColor: colors.orange + '20' }]}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.orange }}>{weeklyStreak.current}w streak</Text>
              </View>
            )}
          </View>
        </View>

        {/* Today Goal Chips — web */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 28, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <TodayChip icon="footsteps-outline" color={colors.str} actual={todaySummary.steps > 0 ? todaySummary.steps : null} goal={goals.steps} unit="steps" />
          <TodayChip icon="water-outline" color={colors.vit} actual={todaySummary.water > 0 ? todaySummary.water : null} goal={goals.waterMl} unit="ml" />
          <TodayChip icon="moon-outline" color={colors.art} actual={todaySummary.sleep} goal={goals.sleepHours} unit="h" />
          <TodayChip icon="timer-outline" color={colors.foc} actual={todaySummary.mindMins > 0 ? todaySummary.mindMins : null} goal={goals.focusMinutes} unit="min" />
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
        >
          {/* Graph selector */}
          {graphSelector}

          <View style={{ flexDirection: 'row', gap: 20 }}>
            {/* Left col — fixed */}
            <View style={{ width: 340, gap: 12 }}>
              {ringSection}
              {pentagonCard}
              {todayLog}
            </View>

            {/* Right col — selected graphs */}
            <View style={{ flex: 1, gap: 12 }} onLayout={e => setRightColW(e.nativeEvent.layout.width)}>
              {selectedGraphs.length === 0 && (
                <View style={[gs.card, { alignItems: 'center', paddingVertical: 48 }]}>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>Select graphs above to display here</Text>
                </View>
              )}
              {GRAPH_DEFS.filter(g => selectedGraphs.includes(g.id)).map(g => renderGraphCard(g.id, rightColW))}
            </View>
          </View>

          {/* Bottom row */}
          <View style={{ gap: 12, marginTop: 20 }}>
            {calendarCard}
            {heatmapCard}
            {weeklyCard}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Mobile ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[ss.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[ss.headerKicker, { color: colors.textMuted }]}>{dateKicker}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 22, fontWeight: fw('300', '400'), color: colors.text, letterSpacing: -0.44 }}>{greeting}</Text>
            {streak > 0 && <Text style={{ fontSize: 12, fontWeight: '500', color: colors.accent }}>{streak}-day rhythm</Text>}
            {weeklyStreak.current > 0 && (
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: colors.orange + '20' }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.orange }}>{weeklyStreak.current}w</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={ss.themeBtn}>
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={19} color={colors.textSub} />
        </TouchableOpacity>
      </View>

      {/* Today Goal Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingHorizontal: layout.hPadding, paddingVertical: 10 }}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <TodayChip icon="footsteps-outline" color={colors.str} actual={todaySummary.steps > 0 ? todaySummary.steps : null} goal={goals.steps} unit="steps" />
        <TodayChip icon="water-outline" color={colors.vit} actual={todaySummary.water > 0 ? todaySummary.water : null} goal={goals.waterMl} unit="ml" />
        <TodayChip icon="moon-outline" color={colors.art} actual={todaySummary.sleep} goal={goals.sleepHours} unit="h" />
        <TodayChip icon="timer-outline" color={colors.foc} actual={todaySummary.mindMins > 0 ? todaySummary.mindMins : null} goal={goals.focusMinutes} unit="min" />
      </ScrollView>

      <ScrollView style={gs.container} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={{ width: '100%', maxWidth: layout.maxWidth, paddingHorizontal: layout.hPadding, paddingTop: 16, alignSelf: 'center' }}>
          <View style={[ss.ringGrid, { marginBottom: 12 }]}>
            {[
              { label: 'STEPS', value: todaySummary.steps.toLocaleString(), goal: `/ ${goals.steps.toLocaleString()}`, pct: goals.steps > 0 ? todaySummary.steps / goals.steps : 0, color: colors.str },
              { label: 'WATER', value: `${(todaySummary.water / 1000).toFixed(1)}L`, goal: `/ ${(goals.waterMl / 1000).toFixed(1)}L`, pct: goals.waterMl > 0 ? todaySummary.water / goals.waterMl : 0, color: colors.foc },
              { label: 'SLEEP', value: `${todaySummary.sleep ?? 0}h`, goal: `/ ${goals.sleepHours}h`, pct: goals.sleepHours > 0 ? (todaySummary.sleep ?? 0) / goals.sleepHours : 0, color: colors.vit },
              { label: 'FOCUS', value: `${todaySummary.mindMins}m`, goal: `/ ${goals.focusMinutes}m`, pct: goals.focusMinutes > 0 ? todaySummary.mindMins / goals.focusMinutes : 0, color: colors.accent },
            ].map(r => (
              <RingCard key={r.label}
                label={r.label} value={r.value} goal={r.goal} pct={r.pct}
                color={r.color} trackColor={colors.border} borderColor={colors.border}
                surfaceColor={colors.surface} textColor={colors.text} textMutedColor={colors.textMuted}
              />
            ))}
          </View>

          {pentagonCard}

          {/* Graph selector */}
          <View style={{ marginHorizontal: -layout.hPadding, marginBottom: 4, marginTop: 12 }}>
            {graphSelector}
          </View>
          {GRAPH_DEFS.filter(g => selectedGraphs.includes(g.id)).map(g => renderGraphCard(g.id))}
          {todayLog}
          {calendarCard}
          {heatmapCard}
          {weeklyCard}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerKicker: { fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 3 },
  themeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  desktopHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 28, paddingVertical: 20, borderBottomWidth: 1,
  },
  streakPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  ringGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ringCard: {
    flex: 1, minWidth: '45%', borderRadius: 10, padding: 12, borderWidth: 1,
    alignItems: 'center', gap: 4,
  },
  ringValue: { fontSize: 16, fontWeight: '500', letterSpacing: -0.3 },
  ringLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  ringGoal: { fontSize: 10, fontWeight: '400' },
  statRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 11,
  },
  statIcon: { width: 26, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 13, fontWeight: '500' },
  statSub: { fontSize: 11, fontWeight: '300', marginTop: 1 },
  statValue: { fontWeight: '500', fontSize: 14 },
  monthLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.4 },
  heatCell: { width: 13, height: 13, borderRadius: 3 },
  streakBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  streakBadgeText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
});
