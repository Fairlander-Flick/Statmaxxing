import { useState, useEffect } from 'react';
import {
  ScrollView, Text, View, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, globalStyles } from '../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  saveData, loadData, appendToList, KEYS, toDay, generateId,
  Person, PersonType, SocialLog,
} from '../lib/storage';

const PERSON_TYPES: PersonType[] = ['Aile', 'Arkadaş', 'Hayvan', 'Diğer'];
const TYPE_ICON: Record<PersonType, React.ComponentProps<typeof Ionicons>['name']> = {
  Aile: 'home-outline',
  Arkadaş: 'people-outline',
  Hayvan: 'paw-outline',
  Diğer: 'person-outline',
};
const TYPE_COLOR: Record<PersonType, string> = {
  Aile: COLORS.vit,
  Arkadaş: COLORS.soc,
  Hayvan: COLORS.orange,
  Diğer: COLORS.textSub,
};

type View = 'log' | 'people';

export default function SocialScreen() {
  const [activeView, setActiveView] = useState<'log' | 'people'>('log');
  const [people, setPeople] = useState<Person[]>([]);
  const [todayLogs, setTodayLogs] = useState<SocialLog[]>([]);

  // Add person form
  const [personName, setPersonName] = useState('');
  const [personType, setPersonType] = useState<PersonType>('Arkadaş');
  const [closeness, setCloseness] = useState(5);

  // Log time form
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState('');

  const today = toDay();

  useEffect(() => {
    loadData<Person[]>(KEYS.people, []).then(setPeople);
    loadData<SocialLog[]>(KEYS.socialLogs, []).then((logs) =>
      setTodayLogs(logs.filter((l) => l.date === today))
    );
  }, []);

  const addPerson = async () => {
    if (!personName.trim()) return;
    const person: Person = {
      id: generateId(), name: personName.trim(), type: personType, closeness,
    };
    const updated = [...people, person];
    await saveData(KEYS.people, updated);
    setPeople(updated);
    setPersonName('');
    setCloseness(5);
  };

  const deletePerson = async (id: string) => {
    Alert.alert('Remove', 'Remove this person?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const updated = people.filter((p) => p.id !== id);
          await saveData(KEYS.people, updated);
          setPeople(updated);
        },
      },
    ]);
  };

  const logTime = async () => {
    const mins = parseInt(minutes);
    if (!selectedPersonId || isNaN(mins) || mins <= 0) return;
    const person = people.find((p) => p.id === selectedPersonId);
    if (!person) return;
    const log: SocialLog = {
      id: generateId(), date: today, personId: selectedPersonId,
      personName: person.name, minutes: mins,
    };
    const updated = await appendToList<SocialLog>(KEYS.socialLogs, log);
    setTodayLogs(updated.filter((l) => l.date === today));
    setMinutes('');
    setSelectedPersonId(null);
  };

  const totalMinutesToday = todayLogs.reduce((s, l) => s + l.minutes, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, activeView === 'log' && { backgroundColor: COLORS.soc }]}
          onPress={() => setActiveView('log')}
        >
          <Text style={[styles.toggleBtnText, activeView === 'log' && { color: '#000' }]}>Log Time</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, activeView === 'people' && { backgroundColor: COLORS.soc }]}
          onPress={() => setActiveView('people')}
        >
          <Text style={[styles.toggleBtnText, activeView === 'people' && { color: '#000' }]}>People</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
        {/* ── LOG TIME VIEW ── */}
        {activeView === 'log' && (
          <>
            <Text style={globalStyles.screenTitle}>Social</Text>
            <Text style={globalStyles.screenSub}>
              {totalMinutesToday > 0 ? `${totalMinutesToday} min with people today` : 'Log time with people'}
            </Text>

            {people.length === 0 ? (
              <View style={globalStyles.card}>
                <Text style={{ color: COLORS.textSub, textAlign: 'center', paddingVertical: 20 }}>
                  No people yet. Go to "People" tab to add someone!
                </Text>
              </View>
            ) : (
              <>
                <Text style={globalStyles.sectionTitle}>Who did you spend time with?</Text>
                {people.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      globalStyles.card,
                      { flexDirection: 'row', alignItems: 'center' },
                      selectedPersonId === p.id && { borderColor: COLORS.soc },
                    ]}
                    onPress={() => setSelectedPersonId(selectedPersonId === p.id ? null : p.id)}
                  >
                    <Ionicons name={TYPE_ICON[p.type]} size={20} color={TYPE_COLOR[p.type]} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: COLORS.text, fontWeight: '700' }}>{p.name}</Text>
                      <Text style={{ color: COLORS.textSub, fontSize: 12 }}>
                        {p.type} · Closeness {p.closeness}/10
                      </Text>
                    </View>
                    {selectedPersonId === p.id && (
                      <Ionicons name="checkmark-circle" size={22} color={COLORS.soc} />
                    )}
                  </TouchableOpacity>
                ))}

                {selectedPersonId && (
                  <View style={globalStyles.card}>
                    <Text style={globalStyles.label}>Time spent (minutes)</Text>
                    <TextInput
                      style={globalStyles.input}
                      placeholder="e.g. 60"
                      placeholderTextColor={COLORS.textSub}
                      keyboardType="numeric"
                      value={minutes}
                      onChangeText={setMinutes}
                    />
                    <TouchableOpacity style={[globalStyles.btnPrimary, { backgroundColor: COLORS.soc }]} onPress={logTime}>
                      <Text style={globalStyles.btnPrimaryText}>Log Time</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {/* Today's logs */}
            {todayLogs.length > 0 && (
              <>
                <Text style={globalStyles.sectionTitle}>Today's Social Log</Text>
                {todayLogs.map((l) => (
                  <View key={l.id} style={[globalStyles.card, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                    <Text style={{ color: COLORS.text, fontWeight: '700' }}>{l.personName}</Text>
                    <Text style={{ color: COLORS.soc, fontWeight: '700' }}>{l.minutes} min</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {/* ── PEOPLE MANAGEMENT ── */}
        {activeView === 'people' && (
          <>
            <Text style={globalStyles.screenTitle}>People</Text>
            <Text style={globalStyles.screenSub}>Manage your social circle</Text>

            {/* Add person form */}
            <View style={globalStyles.card}>
              <Text style={styles.cardTitle}>Add Person</Text>
              <TextInput style={globalStyles.input} placeholder="Name" placeholderTextColor={COLORS.textSub} value={personName} onChangeText={setPersonName} />
              <Text style={globalStyles.label}>Type</Text>
              <View style={styles.typeRow}>
                {PERSON_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, personType === t && { backgroundColor: TYPE_COLOR[t] + '33', borderColor: TYPE_COLOR[t] }]}
                    onPress={() => setPersonType(t)}
                  >
                    <Ionicons name={TYPE_ICON[t]} size={16} color={personType === t ? TYPE_COLOR[t] : COLORS.textSub} />
                    <Text style={[styles.typeBtnText, personType === t && { color: TYPE_COLOR[t] }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={globalStyles.label}>Closeness: {closeness}/10</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.scoreBtn, closeness === n && { backgroundColor: COLORS.soc, borderColor: COLORS.soc }]}
                      onPress={() => setCloseness(n)}
                    >
                      <Text style={[styles.scoreBtnText, closeness === n && { color: '#000' }]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <TouchableOpacity style={[globalStyles.btnPrimary, { backgroundColor: COLORS.soc }]} onPress={addPerson}>
                <Text style={globalStyles.btnPrimaryText}>Add Person</Text>
              </TouchableOpacity>
            </View>

            {/* Current people list */}
            {people.length > 0 && (
              <>
                <Text style={globalStyles.sectionTitle}>Your People ({people.length})</Text>
                {people.map((p) => (
                  <View key={p.id} style={[globalStyles.card, { flexDirection: 'row', alignItems: 'center' }]}>
                    <Ionicons name={TYPE_ICON[p.type]} size={22} color={TYPE_COLOR[p.type]} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 15 }}>{p.name}</Text>
                      <Text style={{ color: COLORS.textSub, fontSize: 12 }}>
                        {p.type} · Closeness {p.closeness}/10
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => deletePerson(p.id)}>
                      <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  toggleBtnText: {
    color: COLORS.textSub,
    fontWeight: '600',
    fontSize: 14,
  },
  cardTitle: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  typeBtnText: {
    color: COLORS.textSub,
    fontWeight: '600',
    fontSize: 13,
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
