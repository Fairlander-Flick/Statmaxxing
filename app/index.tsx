import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView, Text, View, StyleSheet, RefreshControl,
  useWindowDimensions, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle } from 'react-native-svg';
import { useTheme, makeGlobalStyles } from '../lib/ThemeContext';
import { useLayout } from '../lib/useLayout';
import {
  loadData, KEYS, toDay,
  SleepLog, WaterLog, WeightLog, WorkoutLog, MindLog, SocialLog, NutritionLog, StepLog,
} from '../lib/storage';

// ─── SVG Ring ────────────────────────────────────────────────────────────────
function Ring({
  pct, size = 56, strokeWidth = 4, color, trackColor,
}: {
  pct: number; size?: number; strokeWidth?: number; color: string; trackColor: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(pct, 1));
  const cx = size / 2;
  const cy = size / 2;
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <Circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${cx},${cy}`}
      />
    </Svg>
  );
}

// ─── SVG Spark line ──────────────────────────────────────────────────────────
function Spark({
  data, height = 70, accent, goalValue, maxValue,
}: {
  data: number[]; height?: number; accent: string; goalValue?: number; maxValue?: number;
}) {
  const { width: winWidth } = useWindowDimensions();
  const { hPadding } = useLayout();
  // 32 = inner card padding (16 each side)
  const width = winWidth - hPadding * 2 - 32;

  if (!data || data.length < 2) return <View style={{ height }} />;

  const max = maxValue ?? Math.max(...data, 1);
  const min = 0;
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const pts = data.map((v, i) => ({
    x: i * stepX,
    y: height - ((v - min) / range) * height,
  }));

  const pathD = pts
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(' ');

  const fillD =
    `M ${pts[0].x},${height} ` +
    pts.map((p) => `L ${p.x},${p.y}`).join(' ') +
    ` L ${pts[pts.length - 1].x},${height} Z`;

  const goalY =
    goalValue !== undefined
      ? height - ((goalValue - min) / range) * height
      : null;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={accent} stopOpacity="0.20" />
          <Stop offset="100%" stopColor={accent} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {/* Gradient fill */}
      <Path d={fillD} fill="url(#sparkGrad)" />
      {/* Line */}
      <Path d={pathD} stroke={accent} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      {/* Goal line */}
      {goalY !== null && (
        <Line
          x1={0} y1={goalY}
          x2={width} y2={goalY}
          stroke={accent}
          strokeWidth="1"
          strokeDasharray="4,4"
          strokeOpacity="0.5"
        />
      )}
    </Svg>
  );
}

// ─── Compare Bars ────────────────────────────────────────────────────────────
function CompareBars({
  pairs, labels, accent, borderColor,
}: {
  pairs: { thisWeek: number; lastWeek: number }[];
  labels: string[];
  accent: string;
  borderColor: string;
}) {
  const BAR_WIDTH = 10;
  const MAX_BAR_H = 40;

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' }}>
      {pairs.map((pair, i) => {
        const maxVal = Math.max(pair.thisWeek, pair.lastWeek, 1);
        const thisH = (pair.thisWeek / maxVal) * MAX_BAR_H;
        const lastH = (pair.lastWeek / maxVal) * MAX_BAR_H;
        return (
          <View key={i} style={{ alignItems: 'center', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: MAX_BAR_H }}>
              <View style={{
                width: BAR_WIDTH, height: Math.max(lastH, 2), borderRadius: 2,
                borderWidth: 1, borderColor,
                backgroundColor: 'transparent',
              }} />
              <View style={{
                width: BAR_WIDTH, height: Math.max(thisH, 2), borderRadius: 2,
                backgroundColor: accent,
              }} />
            </View>
            <Text style={{ fontSize: 9, color: borderColor, fontWeight: '500', letterSpacing: 0.5 }}>
              {labels[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Stat Row ────────────────────────────────────────────────────────────────
function StatRow({
  icon, label, value, color, sub,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; value: string; color: string; sub?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[ss.statRow, { borderBottomColor: colors.border }]}>
      <View style={[ss.statIcon, { backgroundColor: colors.accentDim }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ss.statLabel, { color: colors.textMuted }]}>{label}</Text>
        {sub ? <Text style={[ss.statSub, { color: colors.textSub }]}>{sub}</Text> : null}
      </View>
      <Text style={[ss.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

// ─── Ring Card ───────────────────────────────────────────────────────────────
function RingCard({
  label, value, goal, pct, color, trackColor, borderColor, surfaceColor, textColor, textMutedColor,
}: {
  label: string; value: string; goal: string; pct: number;
  color: string; trackColor: string; borderColor: string; surfaceColor: string;
  textColor: string; textMutedColor: string;
}) {
  return (
    <View style={[ss.ringCard, { backgroundColor: surfaceColor, borderColor }]}>
      <Ring pct={pct} size={56} strokeWidth={4} color={color} trackColor={trackColor} />
      <Text style={[ss.ringValue, { color: textColor }]}>{value}</Text>
      <Text style={[ss.ringLabel, { color: textMutedColor }]}>{label}</Text>
      <Text style={[ss.ringGoal, { color: textMutedColor }]}>{goal}</Text>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getDateBefore(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function computeDayScore(sleep: number | null, water: number, steps: number, workout: number, mindMins: number): number {
  const s = Math.min((sleep ?? 0) / 7.5, 1) * 25;
  const w = Math.min(water / 2500, 1) * 25;
  const st = Math.min(steps / 8000, 1) * 25;
  const f = workout > 0 ? 25 : Math.min(mindMins / 90, 1) * 25;
  return Math.round(s + w + st + f);
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const layout = useLayout();
  const gs = makeGlobalStyles(colors);

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

  const [lastWeekSummary, setLastWeekSummary] = useState<{
    sleepHrs: number; steps: number; workouts: number; mindMins: number; socialMins: number;
  }>({ sleepHrs: 0, steps: 0, workouts: 0, mindMins: 0, socialMins: 0 });

  const [dailyScores, setDailyScores] = useState<{ date: string; score: number }[]>([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(29);

  const [streak, setStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const today = toDay();

  const computeStats = useCallback(async () => {
    const [sleepLogs, waterLogs, waterGoal, weightLogs, workoutLogs, mindLogs, socialLogs, nutritionLogs, stepLogs] =
      await Promise.all([
        loadData<SleepLog[]>(KEYS.sleepLogs, []),
        loadData<WaterLog[]>(KEYS.waterLogs, []),
        loadData<number>(KEYS.waterGoal, 2500),
        loadData<WeightLog[]>(KEYS.weightLogs, []),
        loadData<WorkoutLog[]>(KEYS.workoutLogs, []),
        loadData<MindLog[]>(KEYS.mindLogs, []),
        loadData<SocialLog[]>(KEYS.socialLogs, []),
        loadData<NutritionLog[]>(KEYS.nutritionLogs, []),
        loadData<StepLog[]>(KEYS.stepLogs, []),
      ]);

    // Today
    const tSleep = sleepLogs.find((l) => l.date === today)?.hours ?? null;
    const tWater = waterLogs.find((l) => l.date === today)?.totalMl ?? 0;
    const tWork = workoutLogs.filter((l) => l.date === today).length;
    const tMind = mindLogs.filter((l) => l.date === today).reduce((s, l) => s + l.durationMinutes, 0);
    const tSoc = socialLogs.filter((l) => l.date === today).reduce((s, l) => s + l.minutes, 0);
    const tCal = nutritionLogs.filter((l) => l.date === today).reduce((s, l) => s + l.macros.calories, 0);
    const tWeight = weightLogs.find((l) => l.date === today)?.kg ?? null;
    const tSteps = stepLogs.find((l) => l.date === today)?.steps ?? 0;
    setTodaySummary({ sleep: tSleep, water: tWater, waterGoal, workouts: tWork, mindMins: tMind, socialMins: tSoc, calories: tCal, weight: tWeight, steps: tSteps });

    // This week
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

    // Last week (for comparison)
    const lwStart = getDateBefore(14);
    const lwEnd = getDateBefore(7);
    const fltLw = (l: { date: string }) => l.date > lwStart && l.date <= lwEnd;
    setLastWeekSummary({
      sleepHrs: sleepLogs.filter(fltLw).reduce((s, l) => s + l.hours, 0),
      steps: stepLogs.filter(fltLw).reduce((s, l) => s + l.steps, 0),
      workouts: workoutLogs.filter(fltLw).length,
      mindMins: mindLogs.filter(fltLw).reduce((s, l) => s + l.durationMinutes, 0),
      socialMins: socialLogs.filter(fltLw).reduce((s, l) => s + l.minutes, 0),
    });

    // 30-day momentum scores
    const scores: { date: string; score: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const dateStr = getDateBefore(i);
      const dSleep = sleepLogs.find((l) => l.date === dateStr)?.hours ?? null;
      const dWater = waterLogs.find((l) => l.date === dateStr)?.totalMl ?? 0;
      const dSteps = stepLogs.find((l) => l.date === dateStr)?.steps ?? 0;
      const dWork = workoutLogs.filter((l) => l.date === dateStr).length;
      const dMind = mindLogs.filter((l) => l.date === dateStr).reduce((s, l) => s + l.durationMinutes, 0);
      scores.push({ date: dateStr, score: computeDayScore(dSleep, dWater, dSteps, dWork, dMind) });
    }
    setDailyScores(scores);

    // Streak — count consecutive days with any data
    const allDates = new Set([
      ...sleepLogs, ...waterLogs, ...workoutLogs, ...mindLogs, ...socialLogs, ...stepLogs,
    ].map((l) => l.date));
    let s = 0;
    for (let i = 0; i <= 365; i++) {
      const d = getDateBefore(i);
      if (allDates.has(d)) { s++; } else { break; }
    }
    setStreak(s);

    // Heatmap
    const hMap = new Array(52).fill(0);
    const todayNum = new Date(today).getTime();
    const assignToWeek = (logs: { date: string }[], getVal: (log: any) => number) => {
      logs.forEach((l) => {
        const diffTime = todayNum - new Date(l.date).getTime();
        const daysAgo = Math.floor((diffTime || 0) / (1000 * 3600 * 24));
        const wIndex = 51 - Math.floor(daysAgo / 7);
        if (wIndex >= 0 && wIndex <= 51) hMap[wIndex] += getVal(l);
      });
    };
    assignToWeek(sleepLogs, (l) => l.hours * 10);
    assignToWeek(waterLogs, (l) => l.totalMl * 0.015);
    assignToWeek(workoutLogs, () => 100);
    assignToWeek(stepLogs, (l) => l.steps * 0.015);
    assignToWeek(mindLogs, (l) => l.durationMinutes * 1);
    assignToWeek(socialLogs, (l) => l.minutes * 1);
    const mXP = Math.max(1, ...hMap);
    setWeeklyHeatmap(hMap.map((val) => val / mXP));
  }, [today, selectedWeekIndex]);

  useEffect(() => { computeStats(); }, [computeStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await computeStats();
    setRefreshing(false);
  }, [computeStats]);

  // Date helpers
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning.' : hour < 17 ? 'Good afternoon.' : 'Good evening.';
  const dateKicker = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

  // Heatmap grid
  const monthLabels = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    return d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  });
  const gridDist = [4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5];
  let pointer = 0;
  const gridData = gridDist.map((size) => {
    const weeks = [];
    for (let i = 0; i < size; i++) weeks.push(pointer++);
    return weeks;
  });

  // Spark data
  const scoreValues = dailyScores.map((d) => d.score);
  const avg30 = scoreValues.length > 0 ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) : 0;
  const startDateLabel = dailyScores[0]?.date.slice(5) ?? '';
  const endDateLabel = dailyScores[29]?.date.slice(5) ?? '';

  // This week vs last week compare pairs
  const comparePairs = [
    { thisWeek: weeklySummary.steps, lastWeek: lastWeekSummary.steps },
    { thisWeek: weeklySummary.sleepHrs * 60, lastWeek: lastWeekSummary.sleepHrs * 60 },
    { thisWeek: weeklySummary.workouts, lastWeek: lastWeekSummary.workouts },
    { thisWeek: weeklySummary.mindMins, lastWeek: lastWeekSummary.mindMins },
    { thisWeek: weeklySummary.socialMins, lastWeek: lastWeekSummary.socialMins },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* ── Header (sticky) ── */}
      <View style={[ss.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[ss.headerKicker, { color: colors.textMuted }]}>{dateKicker}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={[ss.headerGreeting, { color: colors.text }]}>{greeting}</Text>
            {streak > 0 && (
              <Text style={[ss.streakText, { color: colors.accent }]}>
                {streak}-day rhythm
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={ss.themeBtn}>
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={19} color={colors.textSub} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={gs.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={{ width: '100%', maxWidth: layout.maxWidth, paddingHorizontal: layout.hPadding, paddingTop: 20, alignSelf: 'center' }}>

          {/* ── Ring Grid 2×2 ── */}
          <View style={ss.ringGrid}>
            <RingCard
              label="STEPS" value={todaySummary.steps.toLocaleString()}
              goal={`/ 8k`} pct={todaySummary.steps / 8000}
              color={colors.str} trackColor={colors.border}
              borderColor={colors.border} surfaceColor={colors.surface}
              textColor={colors.text} textMutedColor={colors.textMuted}
            />
            <RingCard
              label="WATER" value={`${(todaySummary.water / 1000).toFixed(1)}L`}
              goal={`/ ${(todaySummary.waterGoal / 1000).toFixed(1)}L`}
              pct={todaySummary.water / todaySummary.waterGoal}
              color={colors.foc} trackColor={colors.border}
              borderColor={colors.border} surfaceColor={colors.surface}
              textColor={colors.text} textMutedColor={colors.textMuted}
            />
            <RingCard
              label="SLEEP" value={`${todaySummary.sleep ?? 0}h`}
              goal="/ 7.5h" pct={(todaySummary.sleep ?? 0) / 7.5}
              color={colors.vit} trackColor={colors.border}
              borderColor={colors.border} surfaceColor={colors.surface}
              textColor={colors.text} textMutedColor={colors.textMuted}
            />
            <RingCard
              label="FOCUS" value={`${todaySummary.mindMins}m`}
              goal="/ 90m" pct={todaySummary.mindMins / 90}
              color={colors.accent} trackColor={colors.border}
              borderColor={colors.border} surfaceColor={colors.surface}
              textColor={colors.text} textMutedColor={colors.textMuted}
            />
          </View>

          {/* ── 30-Day Momentum ── */}
          <View style={[gs.card, { marginTop: 4 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[gs.sectionTitle, { marginBottom: 0, marginTop: 0 }]}>30-DAY MOMENTUM</Text>
              <Text style={[ss.tapHint, { color: colors.textMuted }]}>tap to explore</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginBottom: 16 }}>
              <View>
                <Text style={[ss.scoreNum, { color: colors.text }]}>
                  {dailyScores[selectedDayIdx]?.score ?? 0}
                </Text>
                <Text style={[ss.scoreSub, { color: colors.textMuted }]}>
                  {dailyScores[selectedDayIdx]?.date.slice(5) ?? '—'}
                </Text>
              </View>
              <View>
                <Text style={[ss.avgNum, { color: colors.textSub }]}>{avg30}</Text>
                <Text style={[ss.scoreSub, { color: colors.textMuted }]}>30D avg</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                // Cycle through days on tap for minimal interaction
              }}
            >
              <Spark
                data={scoreValues}
                height={88}
                accent={colors.accent}
                goalValue={75}
                maxValue={100}
              />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={[ss.sparkDate, { color: colors.textMuted }]}>{startDateLabel}</Text>
              <Text style={[ss.sparkDate, { color: colors.textMuted }]}>{endDateLabel}</Text>
            </View>
          </View>

          {/* ── This Week vs Last ── */}
          <View style={gs.card}>
            <Text style={[gs.sectionTitle, { marginBottom: 16 }]}>THIS WEEK VS LAST</Text>
            <CompareBars
              pairs={comparePairs}
              labels={['Steps', 'Sleep', 'Lifts', 'Focus', 'People']}
              accent={colors.accent}
              borderColor={colors.textMuted}
            />
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 14, justifyContent: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 8, height: 8, borderRadius: 1, borderWidth: 1, borderColor: colors.textMuted }} />
                <Text style={[ss.legendText, { color: colors.textMuted }]}>Last</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 8, height: 8, borderRadius: 1, backgroundColor: colors.accent }} />
                <Text style={[ss.legendText, { color: colors.textMuted }]}>This</Text>
              </View>
            </View>
          </View>

          {/* ── Today Log ── */}
          <View style={gs.card}>
            <Text style={[gs.sectionTitle, { marginBottom: 4 }]}>TODAY</Text>
            <StatRow icon="trending-up" label="Steps" value={todaySummary.steps.toLocaleString()} color={colors.str} />
            <StatRow icon="moon" label="Sleep" value={`${todaySummary.sleep ?? 0}h`} color={colors.vit} sub={todaySummary.sleep ? 'Logged' : 'Not logged'} />
            <StatRow icon="water" label="Water" value={`${todaySummary.water} ml`} color={colors.foc} sub={`Goal: ${todaySummary.waterGoal} ml`} />
            <StatRow icon="nutrition" label="Calories" value={`${todaySummary.calories.toFixed(0)} kcal`} color={colors.dis} />
            <StatRow icon="barbell" label="Workouts" value={`${todaySummary.workouts} session${todaySummary.workouts !== 1 ? 's' : ''}`} color={colors.str} />
            <StatRow icon="timer" label="Focus" value={`${todaySummary.mindMins} min`} color={colors.accent} />
          </View>

          {/* ── Year Heatmap ── */}
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
                    {mWeeks.map((wIndex) => {
                      const heat = weeklyHeatmap[wIndex] || 0;
                      const isSelected = wIndex === selectedWeekIndex;
                      return (
                        <TouchableOpacity
                          key={`w-${wIndex}`}
                          onPress={() => setSelectedWeekIndex(wIndex)}
                          style={[ss.heatCell, {
                            backgroundColor: heat > 0 ? colors.accent : colors.border,
                            opacity: isSelected ? 1 : Math.max(0.1, heat),
                            borderWidth: isSelected ? 1.5 : 0,
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

          {/* ── Weekly summary ── */}
          <View style={gs.card}>
            <Text style={[gs.sectionTitle, { marginBottom: 4 }]}>
              {selectedWeekIndex === 51 ? 'THIS WEEK' : `WEEK ${51 - selectedWeekIndex}W AGO`}
            </Text>
            <StatRow icon="trending-up" label="Total Steps" value={weeklySummary.steps.toLocaleString()} color={colors.str} />
            <StatRow icon="moon" label="Total Sleep" value={`${weeklySummary.sleepHrs.toFixed(1)}h`} color={colors.vit} />
            <StatRow icon="water" label="Total Water" value={`${(weeklySummary.waterMl / 1000).toFixed(1)} L`} color={colors.foc} />
            <StatRow icon="nutrition" label="Calories" value={`${weeklySummary.calories.toFixed(0)} kcal`} color={colors.dis} />
            {weeklySummary.weightDiff !== 0 && (
              <StatRow
                icon="trending-down-outline" label="Weight Change"
                value={`${weeklySummary.weightDiff > 0 ? '+' : ''}${weeklySummary.weightDiff.toFixed(1)} kg`}
                color={weeklySummary.weightDiff > 0 ? colors.orange : colors.green}
              />
            )}
            <StatRow icon="timer" label="Focus Time" value={`${weeklySummary.mindMins} min`} color={colors.accent} />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerKicker: {
    fontSize: 10, fontWeight: '600', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 3,
  },
  headerGreeting: {
    fontSize: 22, fontWeight: '300', letterSpacing: -0.44,
  },
  streakText: {
    fontSize: 12, fontWeight: '500',
  },
  themeBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  // Ring grid
  ringGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10,
  },
  ringCard: {
    flex: 1, minWidth: '45%', borderRadius: 12, padding: 14, borderWidth: 1,
    alignItems: 'center', gap: 4,
  },
  ringValue: {
    fontSize: 17, fontWeight: '500', letterSpacing: -0.3,
  },
  ringLabel: {
    fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase',
  },
  ringGoal: {
    fontSize: 10, fontWeight: '400',
  },
  // Momentum
  tapHint: { fontSize: 10, fontWeight: '400' },
  scoreNum: {
    fontSize: 28, fontWeight: '300', letterSpacing: -0.8,
  },
  avgNum: {
    fontSize: 18, fontWeight: '300', letterSpacing: -0.4,
  },
  scoreSub: {
    fontSize: 10, fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase',
    marginTop: 1,
  },
  sparkDate: { fontSize: 10, fontWeight: '400' },
  // Compare bars
  legendText: { fontSize: 10, fontWeight: '500' },
  // Stat rows
  statRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 12,
  },
  statIcon: {
    width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center',
  },
  statLabel: { fontSize: 13, fontWeight: '500' },
  statSub: { fontSize: 11, fontWeight: '300', marginTop: 1 },
  statValue: { fontWeight: '500', fontSize: 14 },
  // Heatmap
  monthLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.4 },
  heatCell: { width: 14, height: 14, borderRadius: 3 },
  // Streak badge
  streakBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999,
  },
  streakBadgeText: {
    fontSize: 11, fontWeight: '600', letterSpacing: 0.3,
  },
});
