import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useTheme, makeGlobalStyles } from '../lib/ThemeContext';

interface Props {
  visible: boolean;
  title: string;
  unit: string;
  presets?: number[];
  onSave: (value: number) => void;
  onClose: () => void;
}

export default function QuickLogModal({ visible, title, unit, presets, onSave, onClose }: Props) {
  const { colors } = useTheme();
  const gs = makeGlobalStyles(colors);
  const [input, setInput] = useState('');

  const handleSave = () => {
    const v = parseFloat(input);
    if (isNaN(v) || v <= 0) return;
    onSave(v);
    setInput('');
    onClose();
  };

  const handlePreset = (v: number) => {
    onSave(v);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1}>
          <View style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: 24, paddingBottom: 40,
            borderTopWidth: 1, borderTopColor: colors.border,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 }}>{title}</Text>

            {presets && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {presets.map(p => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => handlePreset(p)}
                    style={{
                      flex: 1, paddingVertical: 12, borderRadius: 10,
                      backgroundColor: colors.accentDim, alignItems: 'center',
                      borderWidth: 1, borderColor: colors.accent + '40',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.accent }}>
                      +{p} {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TextInput
                style={[gs.input, { flex: 1, color: colors.text }]}
                placeholder={`Enter ${unit}...`}
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSave}
              />
              <TouchableOpacity
                onPress={handleSave}
                style={[gs.btnPrimary, { paddingHorizontal: 20 }]}
              >
                <Text style={gs.btnPrimaryText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
