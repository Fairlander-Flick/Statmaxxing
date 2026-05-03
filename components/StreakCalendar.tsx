import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/ThemeContext';
import { DailyNote } from '../lib/storage';

export type DayData = {
  date: string;
  goalsHit: number;
  totalGoals: number;
  note?: DailyNote;
  focusMins?: number;
  steps?: number;
  sleepHours?: number | null;
};

interface Props {
  days: DayData[];
}

function cellColor(goalsHit: number, total: number, colors: any): string {
  if (total === 0 || goalsHit === 0) return colors.surfaceAlt;
  const ratio = goalsHit / total;
  if (ratio < 0.4) return colors.dis + '30';
  if (ratio < 0.7) return colors.dis + '60';
  if (ratio < 1.0) return colors.dis + '90';
  return colors.dis;
}

export default function StreakCalendar({ days }: Props) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<DayData | null>(null);

  const weeks: DayData[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {weeks.map((week, wi) => (
          <View key={wi} style={{ flexDirection: 'column', gap: 3 }}>
            {week.map((day, di) => (
              <TouchableOpacity
                key={di}
                onPress={() => setSelected(day)}
                style={{
                  width: 14, height: 14, borderRadius: 3,
                  backgroundColor: cellColor(day.goalsHit, day.totalGoals, colors),
                }}
              />
            ))}
          </View>
        ))}
      </View>

      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setSelected(null)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              padding: 24, paddingBottom: 40,
              borderTopWidth: 1, borderTopColor: colors.border,
            }}>
              {selected && (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                      {new Date(selected.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>
                    <TouchableOpacity onPress={() => setSelected(null)}>
                      <Ionicons name="close" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
                    <View style={{
                      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
                      backgroundColor: colors.dis + '20',
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.dis }}>
                        {selected.goalsHit}/{selected.totalGoals} goals
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
                    {selected.sleepHours != null && (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.vit }}>{selected.sleepHours}h</Text>
                        <Text style={{ fontSize: 10, color: colors.textMuted }}>sleep</Text>
                      </View>
                    )}
                    {(selected.steps ?? 0) > 0 && (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.str }}>{selected.steps?.toLocaleString()}</Text>
                        <Text style={{ fontSize: 10, color: colors.textMuted }}>steps</Text>
                      </View>
                    )}
                    {(selected.focusMins ?? 0) > 0 && (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foc }}>{selected.focusMins}m</Text>
                        <Text style={{ fontSize: 10, color: colors.textMuted }}>focus</Text>
                      </View>
                    )}
                  </View>

                  {selected.note ? (
                    <View style={{
                      padding: 14, borderRadius: 10,
                      backgroundColor: colors.surfaceAlt,
                      borderWidth: 1, borderColor: colors.border,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 }}>JOURNAL</Text>
                        <View style={{ flexDirection: 'row', gap: 2 }}>
                          {Array.from({ length: 10 }, (_, i) => (
                            <View
                              key={i}
                              style={{
                                width: 6, height: 6, borderRadius: 3,
                                backgroundColor: i < selected.note!.mood ? colors.accent : colors.border,
                              }}
                            />
                          ))}
                        </View>
                        <Text style={{ fontSize: 10, color: colors.textMuted }}>{selected.note.mood}/10</Text>
                      </View>
                      <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>
                        {selected.note.text}
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 13, color: colors.textMuted, fontStyle: 'italic' }}>
                      No journal note for this day.
                    </Text>
                  )}
                </>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
