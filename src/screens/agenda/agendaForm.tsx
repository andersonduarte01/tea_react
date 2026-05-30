import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Switch,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DiasForm {
  segunda: boolean; terca: boolean; quarta: boolean;
  quinta:  boolean; sexta: boolean; sabado: boolean; domingo: boolean;
}

export interface AgendaForm {
  hora_inicio:               string;
  hora_fim:                  string;
  duracao_sessao:            string;
  intervalo:                 string;
  dias:                      DiasForm;
  temAlmoco:                 boolean;
  hora_almoco_inicio:        string;
  hora_almoco_fim:           string;
  atende_feriados_nacionais: boolean;
  atende_feriados_locais:    boolean;
}

export interface FieldErrors { [key: string]: string }

export const DIAS_CONFIG: { key: keyof DiasForm; label: string }[] = [
  { key: 'segunda', label: 'Seg' }, { key: 'terca',   label: 'Ter' },
  { key: 'quarta',  label: 'Qua' }, { key: 'quinta',  label: 'Qui' },
  { key: 'sexta',   label: 'Sex' }, { key: 'sabado',  label: 'Sáb' },
  { key: 'domingo', label: 'Dom' },
];

export const FORM_INICIAL: AgendaForm = {
  hora_inicio: '', hora_fim: '',
  duracao_sessao: '50', intervalo: '10',
  dias: { segunda: true, terca: true, quarta: true, quinta: true, sexta: true, sabado: false, domingo: false },
  temAlmoco: false, hora_almoco_inicio: '', hora_almoco_fim: '',
  atende_feriados_nacionais: false, atende_feriados_locais: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function maskTime(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

export function validateForm(form: AgendaForm): string | null {
  if (!form.hora_inicio.trim())  return 'Informe o horário de início.';
  if (!form.hora_fim.trim())     return 'Informe o horário de fim.';
  if (form.hora_inicio >= form.hora_fim) return 'Horário de fim deve ser posterior ao início.';
  const dur = parseInt(form.duracao_sessao, 10);
  if (!dur || dur < 1)           return 'Duração da sessão deve ser no mínimo 1 minuto.';
  const inv = parseInt(form.intervalo, 10);
  if (isNaN(inv) || inv < 0)     return 'Intervalo não pode ser negativo.';
  if (!Object.values(form.dias).some(v => v)) return 'Selecione ao menos um dia de trabalho.';
  if (form.temAlmoco) {
    if (!form.hora_almoco_inicio.trim()) return 'Informe o horário de início do almoço.';
    if (!form.hora_almoco_fim.trim())    return 'Informe o horário de fim do almoço.';
    if (form.hora_almoco_inicio >= form.hora_almoco_fim)
      return 'Fim do almoço deve ser posterior ao início.';
  }
  return null;
}

export function buildBody(form: AgendaForm, incluirProfissionalId?: number) {
  const body: any = {
    hora_inicio:    form.hora_inicio.trim(),
    hora_fim:       form.hora_fim.trim(),
    duracao_sessao: parseInt(form.duracao_sessao, 10),
    intervalo:      parseInt(form.intervalo, 10),
    dias_trabalho:  { ...form.dias },
    atende_feriados_nacionais: form.atende_feriados_nacionais,
    atende_feriados_locais:    form.atende_feriados_locais,
  };
  if (form.temAlmoco) {
    body.hora_almoco_inicio = form.hora_almoco_inicio.trim();
    body.hora_almoco_fim    = form.hora_almoco_fim.trim();
  } else {
    body.hora_almoco_inicio = null;
    body.hora_almoco_fim    = null;
  }
  if (incluirProfissionalId !== undefined) {
    body.profissional_id = incluirProfissionalId;
  }
  return body;
}

export function apiToForm(data: any): AgendaForm {
  return {
    hora_inicio:    data.hora_inicio?.slice(0, 5) ?? '',
    hora_fim:       data.hora_fim?.slice(0, 5)    ?? '',
    duracao_sessao: String(data.duracao_sessao ?? 50),
    intervalo:      String(data.intervalo      ?? 10),
    dias: {
      segunda: data.dias_trabalho?.segunda ?? false,
      terca:   data.dias_trabalho?.terca   ?? false,
      quarta:  data.dias_trabalho?.quarta  ?? false,
      quinta:  data.dias_trabalho?.quinta  ?? false,
      sexta:   data.dias_trabalho?.sexta   ?? false,
      sabado:  data.dias_trabalho?.sabado  ?? false,
      domingo: data.dias_trabalho?.domingo ?? false,
    },
    temAlmoco:                 !!data.hora_almoco_inicio,
    hora_almoco_inicio:        data.hora_almoco_inicio?.slice(0, 5) ?? '',
    hora_almoco_fim:           data.hora_almoco_fim?.slice(0, 5)    ?? '',
    atende_feriados_nacionais: data.atende_feriados_nacionais ?? false,
    atende_feriados_locais:    data.atende_feriados_locais    ?? false,
  };
}

// ─── Colors ───────────────────────────────────────────────────────────────────
export const C = {
  primary:   '#1565C0',
  primaryBg: '#EBF5FC',
  pageBg:    '#EEF2F7',
  surface:   '#FFFFFF',
  border:    '#E4EEF5',
  text:      '#1A2340',
  textMuted: '#8A9BB0',
  error:     '#C62828',
  green:     '#2E7D32',
  greenBg:   '#E8F5E9',
} as const;

// ─── TimeField ────────────────────────────────────────────────────────────────
export function TimeField({ label, value, onChange, error }: {
  label: string; value: string; onChange: (v: string) => void; error?: string;
}) {
  return (
    <View style={fc.fieldWrap}>
      <Text style={fc.label}>{label}</Text>
      <TextInput
        style={[fc.input, !!error && fc.inputError]}
        value={value}
        onChangeText={v => onChange(maskTime(v))}
        placeholder="HH:MM"
        placeholderTextColor={C.textMuted}
        keyboardType="numeric"
        maxLength={5}
        autoCapitalize="none"
      />
      {!!error && <Text style={fc.fieldError}>{error}</Text>}
    </View>
  );
}

// ─── NumberField ──────────────────────────────────────────────────────────────
export function NumberField({ label, value, onChange, suffix, error }: {
  label: string; value: string; onChange: (v: string) => void;
  suffix?: string; error?: string;
}) {
  return (
    <View style={fc.fieldWrap}>
      <Text style={fc.label}>{label}</Text>
      <View style={[fc.inputRow, !!error && fc.inputError]}>
        <TextInput
          style={fc.inputFlex}
          value={value}
          onChangeText={v => onChange(v.replace(/\D/g, ''))}
          placeholder="0"
          placeholderTextColor={C.textMuted}
          keyboardType="numeric"
          autoCapitalize="none"
        />
        {suffix && <Text style={fc.suffix}>{suffix}</Text>}
      </View>
      {!!error && <Text style={fc.fieldError}>{error}</Text>}
    </View>
  );
}

// ─── DaysSelector ─────────────────────────────────────────────────────────────
export function DaysSelector({ dias, onChange, error }: {
  dias: DiasForm; onChange: (d: DiasForm) => void; error?: string;
}) {
  const toggle = (key: keyof DiasForm) =>
    onChange({ ...dias, [key]: !dias[key] });

  return (
    <View style={fc.fieldWrap}>
      <Text style={fc.label}>Dias de trabalho</Text>
      <View style={fc.diasRow}>
        {DIAS_CONFIG.map(d => (
          <TouchableOpacity
            key={d.key}
            style={[fc.diaChip, dias[d.key] && fc.diaChipOn]}
            onPress={() => toggle(d.key)}
            activeOpacity={0.75}
          >
            <Text style={[fc.diaChipText, dias[d.key] && fc.diaChipTextOn]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {!!error && <Text style={fc.fieldError}>{error}</Text>}
    </View>
  );
}

// ─── ToggleRow ────────────────────────────────────────────────────────────────
export function ToggleRow({ label, desc, value, onChange }: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={fc.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={fc.toggleLabel}>{label}</Text>
        {desc && <Text style={fc.toggleDesc}>{desc}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E2E8F0', true: C.primaryBg }}
        thumbColor={value ? C.primary : '#94A3B8'}
      />
    </View>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
export const fc = StyleSheet.create({
  fieldWrap:   { marginBottom: 16 },
  label:       { fontSize: 11, fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  input:       { backgroundColor: C.pageBg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: C.text, textAlign: 'center', fontWeight: '600' },
  inputError:  { borderColor: C.error },
  inputRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.pageBg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14 },
  inputFlex:   { flex: 1, paddingVertical: 11, fontSize: 15, color: C.text, fontWeight: '600', textAlign: 'center' },
  suffix:      { fontSize: 12, color: C.textMuted, fontWeight: '500', paddingLeft: 4 },
  fieldError:  { fontSize: 11, color: C.error, marginTop: 4 },

  diasRow:       { flexDirection: 'row', gap: 6 },
  diaChip:       { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  diaChipOn:     { backgroundColor: C.primary, borderColor: C.primary },
  diaChipText:   { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  diaChipTextOn: { color: '#fff' },

  toggleRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  toggleDesc:  { fontSize: 12, color: C.textMuted, marginTop: 1 },
});
