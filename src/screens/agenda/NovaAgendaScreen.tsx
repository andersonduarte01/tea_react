import React, { useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Save } from 'lucide-react-native';
import { AppStackParams } from '../../navigation/AppNavigator';
import { api, ApiError, SessionExpiredError } from '../../services/httpClient';
import {
  AgendaForm, FORM_INICIAL, C,
  validateForm, buildBody,
  TimeField, NumberField, DaysSelector, ToggleRow,
} from './agendaForm';

type Nav   = NativeStackNavigationProp<AppStackParams>;
type Route = RouteProp<AppStackParams, 'NovaAgenda'>;

export function NovaAgendaScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();

  const [form,   setForm]   = useState<AgendaForm>(FORM_INICIAL);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof AgendaForm>(key: K, val: AgendaForm[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    const err = validateForm(form);
    if (err) { Alert.alert('Atenção', err); return; }

    setSaving(true);
    try {
      const body = buildBody(form, params.profissionalId);
      await api.post('/api/v1/agenda/profissionais/', body);
      Alert.alert('Sucesso', 'Agenda criada com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: unknown) {
      if (e instanceof SessionExpiredError) {
        Alert.alert('Sessão expirada', 'Faça login novamente.');
      } else if (e instanceof ApiError && e.status === 409) {
        Alert.alert('Conflito', 'Este profissional já possui uma agenda ativa. Volte à lista e use a opção de edição.');
      } else if (e instanceof ApiError && e.status === 400) {
        const firstError = Object.values(e.errors ?? {}).flat()[0] as string | undefined;
        Alert.alert('Dados inválidos', firstError ?? 'Verifique os campos e tente novamente.');
      } else if (e instanceof ApiError && e.status === 404) {
        Alert.alert('Não encontrado', 'Profissional não encontrado nesta clínica. Volte e atualize a lista.');
      } else {
        Alert.alert('Erro', (e as ApiError)?.message ?? 'Não foi possível criar a agenda.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Nova Agenda</Text>
          <Text style={s.headerSub}>{params.nome}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.card}>
            <Text style={s.cardTitle}>Horário de atendimento</Text>
            <View style={s.row2}>
              <View style={s.col}>
                <TimeField label="Início" value={form.hora_inicio} onChange={v => set('hora_inicio', v)} />
              </View>
              <View style={s.col}>
                <TimeField label="Fim" value={form.hora_fim} onChange={v => set('hora_fim', v)} />
              </View>
            </View>
            <View style={s.row2}>
              <View style={s.col}>
                <NumberField label="Duração da sessão" value={form.duracao_sessao} onChange={v => set('duracao_sessao', v)} suffix="min" />
              </View>
              <View style={s.col}>
                <NumberField label="Intervalo" value={form.intervalo} onChange={v => set('intervalo', v)} suffix="min" />
              </View>
            </View>
          </View>

          <View style={s.card}>
            <DaysSelector dias={form.dias} onChange={dias => set('dias', dias)} />
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Pausa para almoço</Text>
            <ToggleRow
              label="Tem pausa para almoço"
              desc="Bloqueia o horário de almoço para novos agendamentos"
              value={form.temAlmoco}
              onChange={v => set('temAlmoco', v)}
            />
            {form.temAlmoco && (
              <View style={[s.row2, { marginTop: 4 }]}>
                <View style={s.col}>
                  <TimeField label="Início do almoço" value={form.hora_almoco_inicio} onChange={v => set('hora_almoco_inicio', v)} />
                </View>
                <View style={s.col}>
                  <TimeField label="Fim do almoço" value={form.hora_almoco_fim} onChange={v => set('hora_almoco_fim', v)} />
                </View>
              </View>
            )}
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Atendimento em feriados</Text>
            <ToggleRow
              label="Feriados nacionais"
              desc="Atende em feriados nacionais"
              value={form.atende_feriados_nacionais}
              onChange={v => set('atende_feriados_nacionais', v)}
            />
            <View style={s.divider} />
            <ToggleRow
              label="Feriados locais"
              desc="Atende em feriados locais da clínica"
              value={form.atende_feriados_locais}
              onChange={v => set('atende_feriados_locais', v)}
            />
          </View>

          <View style={{ height: 96 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : (
              <View style={s.saveBtnInner}>
                <Save size={18} color="#fff" />
                <Text style={s.saveBtnText}>Criar agenda</Text>
              </View>
            )
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.pageBg },
  header: {
    backgroundColor: C.primary,
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 12, paddingTop: 16, paddingBottom: 32,
    borderBottomLeftRadius: 18, borderBottomRightRadius: 18,
  },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 3 },
  headerSub:   { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },

  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },

  card: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    marginBottom: 12,
    shadowColor: '#1A2340', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 14, letterSpacing: 0.1 },
  divider:   { height: 1, backgroundColor: C.border, marginVertical: 4 },

  row2: { flexDirection: 'row', gap: 10 },
  col:  { flex: 1 },

  footer:  {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.surface, paddingHorizontal: 16, paddingVertical: 12,
    paddingBottom: 28, borderTopWidth: 1, borderTopColor: C.border,
  },
  saveBtn: {
    backgroundColor: C.primary, borderRadius: 14,
    height: 50, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtnText:  { fontSize: 15, fontWeight: '700', color: '#fff' },
});
