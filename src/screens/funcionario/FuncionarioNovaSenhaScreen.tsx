import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Eye, EyeOff, Save } from 'lucide-react-native';
import { api, SessionExpiredError } from '../../services/httpClient';
import { AppStackParams } from '../../navigation/AppNavigator';

type Nav   = NativeStackNavigationProp<AppStackParams>;
type Route = RouteProp<AppStackParams, 'FuncionarioNovaSenha'>;

const C = {
  primary:   '#1565C0',
  headerBg:  '#1565C0',
  pageBg:    '#EEF2F7',
  surface:   '#FFFFFF',
  border:    '#E4EEF5',
  text:      '#1A2340',
  textMuted: '#8A9BB0',
  error:     '#C62828',
} as const;

interface FieldErrors { [key: string]: string }

function PasswordField({ label, value, onChange, placeholder, error }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.inputRow, !!error && s.inputRowError]}>
        <TextInput
          style={s.inputFlex}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          secureTextEntry={!visible}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setVisible(v => !v)} style={s.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          {visible ? <EyeOff size={18} color={C.textMuted} /> : <Eye size={18} color={C.textMuted} />}
        </TouchableOpacity>
      </View>
      {!!error && <Text style={s.fieldError}>{error}</Text>}
    </View>
  );
}

export function FuncionarioNovaSenhaScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();

  const [nova,      setNova]      = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [fieldErr,  setFieldErr]  = useState<FieldErrors>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const handleSave = async () => {
    setFieldErr({});
    setErroGeral(null);

    const errs: FieldErrors = {};
    if (!nova.trim())      errs.nova_senha    = 'Informe a nova senha.';
    if (!confirmar.trim()) errs.confirmar_nova = 'Confirme a nova senha.';
    if (Object.keys(errs).length) { setFieldErr(errs); return; }

    setSaving(true);
    try {
      await api.post(`/api/v1/funcionario/${params.id}/reset-senha/`, {
        nova_senha:     nova.trim(),
        confirmar_nova: confirmar.trim(),
      });
      Alert.alert('Sucesso', 'Senha redefinida com sucesso.', [
        { text: 'OK', onPress: () => navigation.navigate('FuncionarioPerfil', { id: params.id }) },
      ]);
    } catch (err: any) {
      if (err instanceof SessionExpiredError) {
        setErroGeral('Sessão expirada. Faça login novamente.');
      } else if (err?.errors) {
        const mapped: FieldErrors = {};
        for (const [k, v] of Object.entries(err.errors)) {
          mapped[k] = Array.isArray(v) ? (v as string[]).join(' ') : String(v);
        }
        setFieldErr(mapped);
      } else {
        setErroGeral(err?.message ?? 'Erro ao redefinir senha.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.headerBg} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Nova Senha</Text>
          <Text style={s.headerSub}>Redefinir senha do funcionário</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!!erroGeral && (
            <View style={s.erroBox}>
              <Text style={s.erroBoxText}>{erroGeral}</Text>
            </View>
          )}

          <View style={s.section}>
            <Text style={s.sectionTitle}>Redefinir senha</Text>
            <View style={s.card}>
              <PasswordField label="Nova senha"           value={nova}      onChange={setNova}      placeholder="Mínimo 8 caracteres" error={fieldErr.nova_senha} />
              <PasswordField label="Confirmar nova senha" value={confirmar} onChange={setConfirmar} placeholder="Repita a nova senha" error={fieldErr.confirmar_nova} />
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity
            style={[s.saveBtn, saving && s.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <><Save size={18} color="#fff" style={{ marginRight: 8 }} /><Text style={s.saveText}>Salvar nova senha</Text></>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.pageBg },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingBottom: 16 },

  header:      { backgroundColor: C.headerBg, flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 32, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 3 },
  headerSub:   { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },

  erroBox:     { margin: 16, backgroundColor: '#FFEBEE', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FFCDD2' },
  erroBoxText: { fontSize: 13, color: C.error, textAlign: 'center' },

  section:      { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  card:         { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },

  fieldWrap:    { marginBottom: 14 },
  label:        { fontSize: 11, fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  inputRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.pageBg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14 },
  inputRowError:{ borderColor: C.error },
  inputFlex:    { flex: 1, paddingVertical: 11, fontSize: 14, color: C.text },
  eyeBtn:       { padding: 4 },
  fieldError:   { fontSize: 11, color: C.error, marginTop: 4 },

  footer:          { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  saveBtn:         { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveText:        { color: '#fff', fontWeight: '700', fontSize: 15 },
});
