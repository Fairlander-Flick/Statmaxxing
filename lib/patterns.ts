import { loadData, KEYS, SleepLog, MindLog, WorkoutLog, DailyNote } from './storage';

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(
    xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
    ys.reduce((s, y) => s + (y - my) ** 2, 0),
  );
  return den === 0 ? 0 : num / den;
}

export type Insight = { text: string; r: number };

export async function computeInsights(): Promise<Insight[]> {
  const [sleepLogs, mindLogs, workoutLogs, notes] = await Promise.all([
    loadData<SleepLog[]>(KEYS.sleepLogs, []),
    loadData<MindLog[]>(KEYS.mindLogs, []),
    loadData<WorkoutLog[]>(KEYS.workoutLogs, []),
    loadData<DailyNote[]>(KEYS.dailyNotes, []),
  ]);

  if (sleepLogs.length < 14) return [];

  const allDates = [...new Set([...sleepLogs, ...mindLogs].map(l => l.date))].sort();
  if (allDates.length < 14) return [];

  const insights: Insight[] = [];

  const sleepMap = Object.fromEntries(sleepLogs.map(l => [l.date, l.hours]));
  const focusMap: Record<string, number> = {};
  mindLogs.forEach(l => { focusMap[l.date] = (focusMap[l.date] ?? 0) + l.durationMinutes; });

  const pairs1 = allDates.slice(0, -1).flatMap(date => {
    const nextDate = allDates[allDates.indexOf(date) + 1];
    const s = sleepMap[date];
    const f = focusMap[nextDate];
    return s !== undefined && f !== undefined ? [{ s, f }] : [];
  });
  if (pairs1.length >= 10) {
    const r1 = pearson(pairs1.map(p => p.s), pairs1.map(p => p.f));
    if (Math.abs(r1) > 0.4) {
      const direction = r1 > 0 ? 'daha fazla' : 'daha az';
      insights.push({
        text: `8h+ uyuduğun günlerin ertesinde FOC ${direction} oluyor. Korelasyon: ${(r1 * 100).toFixed(0)}%`,
        r: r1,
      });
    }
  }

  if (notes.length >= 10) {
    const moodMap = Object.fromEntries(notes.map(n => [n.date, n.mood]));
    const workoutDates = new Set(workoutLogs.map(l => l.date));
    const pairs2 = allDates.slice(0, -1).flatMap(date => {
      const nextDate = allDates[allDates.indexOf(date) + 1];
      const worked = workoutDates.has(date) ? 1 : 0;
      const mood = moodMap[nextDate];
      return mood !== undefined ? [{ worked, mood }] : [];
    });
    if (pairs2.length >= 10) {
      const r2 = pearson(pairs2.map(p => p.worked), pairs2.map(p => p.mood));
      if (Math.abs(r2) > 0.4) {
        insights.push({
          text: `Antrenman yaptığın günlerin ertesinde ruh halin ortalama ${r2 > 0 ? 'daha iyi' : 'daha kötü'} görünüyor.`,
          r: r2,
        });
      }
    }
  }

  return insights.slice(0, 2);
}
