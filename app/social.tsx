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
  Person, PersonType, SocialLog,
} from '../lib/storage';

const PERSON_TYPES: PersonType[] = ['Aile', 'Arkadaş', 'Hayvan', 'Diğer'];
const TYPE_ICON: Record<PersonType, React.ComponentProps<typeof Ionicons>['name']> = {
  Aile: 'home-outline', Arkadaş: 'people-outline', Hayvan: 'paw-outline', Diğer: 'person-outline',
};
const TYPE_DISPLAY: Record<PersonType, string> = {
  Aile: 'Family', Arkadaş: 'Friend', Hayvan: 'Pet', Diğer: 'Other',
};

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={{
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: color + '40',
    }}>
      <Text style={{ color, fontWeight: '600', fontSize: 15 }}>{initials}</Text>
    </View>
  );
}

export default function SocialScreen() {
  const { colors } = useTheme();
  const layout = useLayout();
  const gs = makeGlobalStyles(colors);

  const TYPE_COLOR: Record<PersonType, string> = {
    Aile: colors.vit, Arkadaş: colors.soc, Hayvan: colors.str, Diğer: colors.textSub,
  };

  const [activeView, setActiveView] = useState<'log' | 'people'>('log');
  const [people, setPeople] = useState<Person[]>([]);
  const [todayLogs, setTodayLogs] = useState<SocialLog[]>([]);
  const [allSocialLogs, setAllSocialLogs] = useState<SocialLog[]>([]);
  const [personName, setPersonName] = useState('');
  const [personType, setPersonType] = useState<PersonType>('Arkadaş');
  const [closeness, setCloseness] = useState(5);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState('');
  const today = toDay();

  useEffect(() => {
    loadData<Person[]>(KEYS.people, []).then(setPeople);
    loadData<SocialLog[]>(KEYS.socialLogs, []).then((logs) => {
      setAllSocialLogs(logs);
      setTodayLogs(logs.filter((l) => l.date === today));
    });
  }, []);

  const addPerson = async () => {
    if (!personName.trim()) return;
    const updated = [...people, { id: generateId(), name: personName.trim(), type: personType, closeness }];
    await saveData(KEYS.people, updated);
    setPeople(updated); setPersonName(''); setCloseness(5);
  };

  const deletePerson = async (id: string) => {
    Alert.alert('Remove', 'Remove this person?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { const updated = people.filter((p) => p.id !== id); await saveData(KEYS.people, updated); setPeople(updated); } },
    ]);
  };

  const logTime = async () => {
    const mins = parseInt(minutes);
    if (!selectedPersonId || isNaN(mins) || mins <= 0) return;
    const person = people.find((p) => p.id === selectedPersonId);
    if (!person) return;
    const updated = await appendToList<SocialLog>(KEYS.socialLogs, { id: generateId(), date: today, personId: selectedPersonId, personName: person.name, minutes: mins });
    setAllSocialLogs(updated);
    setTodayLogs(updated.filter((l) => l.date === today));
    setMinutes(''); setSelectedPersonId(null);
  };

  const deleteSocialLog = async (id: string) => {
    const all = await loadData<SocialLog[]>(KEYS.socialLogs, []);
    const updated = all.filter((l) => l.id !== id);
    await saveData(KEYS.socialLogs, updated);
    setAllSocialLogs(updated);
    setTodayLogs(updated.filter((l) => l.date === today));
  };

  const totalMinutesToday = todayLogs.reduce((s, l) => s + l.minutes, 0);
  const fw = { alignSelf: 'center' as const, width: '100%' as const, maxWidth: layout.inputMaxWidth };

  const getLastContact = (personId: string): string | null => {
    const logs = allSocialLogs.filter((l) => l.personId === personId);
    if (!logs.length) return null;
    return logs.sort((a, b) => b.date.localeCompare(a.date))[0].date;
  };

  const getDaysSince = (dateStr: string | null): number | null => {
    if (!dateStr) return null;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  };
  const contentStyle = { width: '100%', maxWidth: layout.maxWidth, paddingHorizontal: layout.hPadding, paddingTop: 20 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Toggle */}
      <View style={[s.viewToggle, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', gap: 8, maxWidth: layout.maxWidth, width: '100%', alignSelf: 'center', paddingHorizontal: layout.hPadding }}>
          {(['log', 'people'] as const).map((v) => (
            <TouchableOpacity key={v}
              style={[s.toggleBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                activeView === v && { backgroundColor: colors.soc + '22', borderColor: colors.soc }]}
              onPress={() => setActiveView(v)}>
              <Ionicons name={v === 'log' ? 'time-outline' : 'people-outline'} size={18} color={activeView === v ? colors.soc : colors.textSub} />
              <Text style={[s.toggleBtnText, { color: activeView === v ? colors.soc : colors.textSub }]}>
                {v === 'log' ? 'Log Time' : 'People'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={gs.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
        <View style={contentStyle}>

          {/* ── LOG TIME ── */}
          {activeView === 'log' && (
            <>
              <Text style={gs.screenTitle}>Social</Text>
              <Text style={gs.screenSub}>
                {totalMinutesToday > 0 ? `${totalMinutesToday} min with people today 🤝` : 'Log quality time with people'}
              </Text>

              {totalMinutesToday > 0 && (
                <View style={[gs.card, { alignItems: 'center', borderColor: colors.soc + '44', paddingVertical: 24 }]}>
                  <Text style={{ color: colors.soc, fontSize: 48, fontWeight: '900' }}>{totalMinutesToday}</Text>
                  <Text style={{ color: colors.textSub, fontSize: 16, marginTop: 4 }}>minutes today</Text>
                </View>
              )}

              {people.length === 0 ? (
                <View style={[gs.card, { alignItems: 'center', paddingVertical: 32 }]}>
                  <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                  <Text style={{ color: colors.textSub, textAlign: 'center', marginTop: 12, fontSize: 16 }}>No people yet.</Text>
                  <Text style={{ color: colors.textMuted, textAlign: 'center', fontSize: 14, marginTop: 4 }}>Go to "People" tab to add someone!</Text>
                </View>
              ) : (
                <>
                  <Text style={gs.sectionTitle}>Who did you spend time with?</Text>
                  {people.map((p) => {
                    const typeColor = TYPE_COLOR[p.type];
                    const daysSince = getDaysSince(getLastContact(p.id));
                    const isDrifting = daysSince === null || daysSince > 7;
                    return (
                      <TouchableOpacity key={p.id}
                        style={[gs.card, { flexDirection: 'row', alignItems: 'center', gap: 14 },
                          selectedPersonId === p.id && { borderColor: colors.soc, borderWidth: 2 }]}
                        onPress={() => setSelectedPersonId(selectedPersonId === p.id ? null : p.id)}>
                        <Avatar name={p.name} color={typeColor} />
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>{p.name}</Text>
                            {isDrifting && (
                              <View style={{ backgroundColor: colors.orangeDim, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                                <Text style={{ fontSize: 9, color: colors.orange, fontWeight: '600', letterSpacing: 0.4 }}>DRIFT</Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                            {TYPE_DISPLAY[p.type]}{daysSince !== null ? ` · ${daysSince}d ago` : ' · never logged'}
                          </Text>
                        </View>
                        {selectedPersonId === p.id && <Ionicons name="checkmark-circle" size={26} color={colors.soc} />}
                      </TouchableOpacity>
                    );
                  })}

                  {selectedPersonId && (
                    <View style={gs.card}>
                      <Text style={[gs.cardTitle, { textAlign: 'center', marginBottom: 16 }]}>
                        Time spent with {people.find((p) => p.id === selectedPersonId)?.name}
                      </Text>
                      <View style={fw}>
                        <TextInput style={gs.input} placeholder="Minutes (e.g. 60)" placeholderTextColor={colors.textSub} keyboardType="numeric" value={minutes} onChangeText={setMinutes} />
                        <TouchableOpacity style={[gs.btnPrimary, { backgroundColor: colors.soc }]} onPress={logTime}>
                          <Text style={gs.btnPrimaryText}>Log Time</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              )}

              {todayLogs.length > 0 && (
                <>
                  <Text style={gs.sectionTitle}>Today's Social Log</Text>
                  {todayLogs.map((l) => (
                    <View key={l.id} style={[gs.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16, flex: 1 }}>{l.personName}</Text>
                      <Text style={{ color: colors.soc, fontWeight: '800', fontSize: 18, marginRight: 12 }}>{l.minutes} min</Text>
                      <TouchableOpacity onPress={() => deleteSocialLog(l.id)} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={18} color={colors.red} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}
            </>
          )}

          {/* ── PEOPLE MANAGEMENT ── */}
          {activeView === 'people' && (
            <>
              <Text style={gs.screenTitle}>People</Text>
              <Text style={gs.screenSub}>Your social circle</Text>

              <View style={gs.card}>
                <Text style={[gs.cardTitle, { textAlign: 'center', marginBottom: 16 }]}>Add Person</Text>
                <View style={fw}>
                  <TextInput style={gs.input} placeholder="Name" placeholderTextColor={colors.textSub} value={personName} onChangeText={setPersonName} />
                  <Text style={gs.label}>Type</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    {PERSON_TYPES.map((t) => (
                      <TouchableOpacity key={t}
                        style={[s.typeBtn, { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                          personType === t && { backgroundColor: TYPE_COLOR[t] + '22', borderColor: TYPE_COLOR[t] }]}
                        onPress={() => setPersonType(t)}>
                        <Ionicons name={TYPE_ICON[t]} size={16} color={personType === t ? TYPE_COLOR[t] : colors.textSub} />
                        <Text style={[{ fontSize: 14, fontWeight: '600', color: personType === t ? TYPE_COLOR[t] : colors.textSub }]}>{TYPE_DISPLAY[t]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={gs.label}>Closeness: {closeness}/10</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <TouchableOpacity key={n}
                        style={[s.scoreBtn, { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                          closeness === n && { backgroundColor: colors.soc, borderColor: colors.soc }]}
                        onPress={() => setCloseness(n)}>
                        <Text style={[s.scoreBtnText, { color: closeness === n ? '#fff' : colors.textSub }]}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity style={[gs.btnPrimary, { backgroundColor: colors.soc }]} onPress={addPerson}>
                    <Text style={gs.btnPrimaryText}>Add Person</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {people.length > 0 && (
                <>
                  <Text style={gs.sectionTitle}>Your People ({people.length})</Text>
                  {people.map((p) => {
                    const typeColor = TYPE_COLOR[p.type];
                    const daysSince = getDaysSince(getLastContact(p.id));
                    const isDrifting = daysSince === null || daysSince > 7;
                    return (
                      <View key={p.id} style={[gs.card, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
                        <Avatar name={p.name} color={typeColor} />
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>{p.name}</Text>
                            {isDrifting && (
                              <View style={{ backgroundColor: colors.orangeDim, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                                <Text style={{ fontSize: 9, color: colors.orange, fontWeight: '600', letterSpacing: 0.4 }}>DRIFT</Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                            {TYPE_DISPLAY[p.type]} · {p.closeness}/10{daysSince !== null ? ` · ${daysSince}d ago` : ''}
                          </Text>
                        </View>
                        <TouchableOpacity style={[s.iconBtn, { backgroundColor: colors.redDim }]} onPress={() => deletePerson(p.id)}>
                          <Ionicons name="trash-outline" size={18} color={colors.red} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </>
              )}
            </>
          )}

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  viewToggle: { paddingVertical: 10, borderBottomWidth: 1 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  toggleBtnText: { fontWeight: '700', fontSize: 15 },
  personIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  scoreBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  scoreBtnText: { fontWeight: '700', fontSize: 14 },
});
