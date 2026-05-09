import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: W } = Dimensions.get('window');
export const ONBOARDING_KEY = '@tea:onboarding_v2';

// ─── Slide 1 ─────────────────────────────────────────────────────────────────
function Slide1() {
  return (
    <View style={[s.slide, { backgroundColor: '#EFF6FF' }]}>
      {/* decorative blobs */}
      <View style={[s.blob, { top: -40, right: -40, width: 160, height: 160, backgroundColor: '#BFDBFE', opacity: 0.5 }]} />
      <View style={[s.blob, { top: 60, left: -30, width: 100, height: 100, backgroundColor: '#FDE68A', opacity: 0.4 }]} />

      {/* logo */}
      <View style={s.logoArea}>
        <View style={s.logoIconRow}>
          <Text style={s.logoHeart}>🧩</Text>
        </View>
        <Text style={s.logoName}>VALENCARE</Text>
        <Text style={s.logoSub}>CLÍNICA INFANTIL</Text>
        <Text style={s.logoTagline}>CONECTAR  •  COMPREENDER  •  ACOLHER</Text>
      </View>

      {/* hero image */}
      <Image
        source={{ uri: 'https://picsum.photos/seed/child400/400/320' }}
        style={s.heroImage}
        resizeMode="cover"
      />

      {/* text */}
      <View style={s.textBlock}>
        <Text style={s.title}>Bem-vindo ao{'\n'}Valencare</Text>
        <Text style={s.body}>
          O cuidado que seu filho merece, na palma da sua mão.
        </Text>
      </View>
    </View>
  );
}

// ─── Slide 2 ─────────────────────────────────────────────────────────────────
function Slide2() {
  return (
    <View style={[s.slide, { backgroundColor: '#ffffff' }]}>
      <View style={[s.blob, { bottom: 80, right: -20, width: 120, height: 200, backgroundColor: '#D1FAE5', opacity: 0.5 }]} />

      <View style={s.textBlockTop}>
        <Text style={[s.title, { color: '#1B4FD8' }]}>
          Tudo o que você{'\n'}precisa em um{'\n'}só lugar
        </Text>
        <Text style={s.body}>
          Agendamentos, terapias, evolução e a comunicação com nossa equipe.
        </Text>
      </View>

      <Image
        source={{ uri: 'https://picsum.photos/seed/appscreen2/300/400' }}
        style={s.mockupImage}
        resizeMode="cover"
      />
    </View>
  );
}

// ─── Slide 3 ─────────────────────────────────────────────────────────────────
function Slide3() {
  const features = [
    {
      icon: '🛡️',
      title: 'Segurança e Confiança',
      desc: 'Seus dados e informações sempre protegidos.',
    },
    {
      icon: '👥',
      title: 'Profissionais Qualificados',
      desc: 'Profissionais qualificados para cuidar do que é mais importante.',
    },
    {
      icon: '❤️',
      title: 'Acolhimento e Empatia',
      desc: 'Cuidado humanizado em cada detalhe.',
    },
  ];

  return (
    <View style={[s.slide, { backgroundColor: '#EFF6FF' }]}>
      <View style={[s.blob, { top: -30, left: -30, width: 140, height: 140, backgroundColor: '#BFDBFE', opacity: 0.5 }]} />
      <View style={[s.blob, { top: 80, right: -20, width: 90, height: 90, backgroundColor: '#FDE68A', opacity: 0.35 }]} />

      <Image
        source={{ uri: 'https://picsum.photos/seed/family3/360/220' }}
        style={s.illustrationImage}
        resizeMode="cover"
      />

      <View style={s.textBlock}>
        <Text style={s.title}>
          Cada criança é única,{'\n'}cada vínculo transforma
        </Text>
        <Text style={s.body}>
          Acompanhe o desenvolvimento com amor, acolhimento e propósito.
        </Text>
      </View>

      <View style={s.featureList}>
        {features.map(f => (
          <View key={f.title} style={s.featureRow}>
            <View style={s.featureIcon}>
              <Text style={s.featureIconText}>{f.icon}</Text>
            </View>
            <View style={s.featureText}>
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const SLIDES = [
  { id: '1', Component: Slide1 },
  { id: '2', Component: Slide2 },
  { id: '3', Component: Slide3 },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
interface Props {
  onFinish: () => Promise<void>;
}

export function OnboardingScreen({ onFinish }: Props) {
  const listRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  async function handleNext() {
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      await onFinish();
    }
  }

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        renderItem={({ item: { Component } }) => <Component />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
      />

      {/* bottom bar */}
      <View style={s.bottomBar}>
        {/* dots */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[s.dot, i === activeIndex ? s.dotActive : s.dotInactive]}
            />
          ))}
        </View>

        {/* button */}
        <TouchableOpacity style={s.btn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={s.btnText}>{isLast ? 'Começar' : 'Próximo'}</Text>
          <Text style={s.btnArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF6FF' },

  slide: {
    width: W,
    flex: 1,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },

  // slide 1
  logoArea: { alignItems: 'center', paddingTop: 32, paddingBottom: 8, zIndex: 1 },
  logoIconRow: { marginBottom: 4 },
  logoHeart: { fontSize: 36 },
  logoName: { fontSize: 22, fontWeight: '800', color: '#1B4FD8', letterSpacing: 3 },
  logoSub: { fontSize: 11, fontWeight: '600', color: '#1B4FD8', letterSpacing: 2, marginTop: 2 },
  logoTagline: { fontSize: 9, color: '#64748B', letterSpacing: 1.5, marginTop: 6 },

  heroImage: {
    width: W,
    height: W * 0.72,
    marginTop: 8,
  },

  // slide 2
  textBlockTop: {
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 20,
    zIndex: 1,
  },
  mockupImage: {
    width: W * 0.72,
    height: W * 0.92,
    alignSelf: 'center',
    borderRadius: 16,
    marginTop: 8,
  },

  // slide 3
  illustrationImage: {
    width: W,
    height: W * 0.52,
    marginTop: 12,
  },

  // shared text
  textBlock: { paddingHorizontal: 28, paddingTop: 20, zIndex: 1 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 34,
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },

  // features
  featureList: { paddingHorizontal: 28, paddingTop: 20, gap: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconText: { fontSize: 20 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  featureDesc: { fontSize: 13, color: '#64748B', lineHeight: 18 },

  // bottom
  bottomBar: {
    paddingHorizontal: 28,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: '#1B4FD8', width: 24 },
  dotInactive: { backgroundColor: '#CBD5E1' },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B4FD8',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 50,
    gap: 8,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnArrow: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
