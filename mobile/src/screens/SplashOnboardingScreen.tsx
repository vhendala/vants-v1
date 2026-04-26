import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {spacing, borderRadius} from '../theme/colors';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// Paleta do design (light mode, mesma do LoginScreen)
const DESIGN = {
  bg: '#F0F2F5',
  textPrimary: '#0D1117',
  textSecondary: '#8E9AAD',
  accent: '#6C63FF',
  accentLight: '#E8E7FF',
  btnPrimary: '#0D1117',
  btnPrimaryText: '#FFFFFF',
  indicatorActive: '#6C63FF',
  indicatorInactive: '#D0D7E3',
};

interface OnboardingSlide {
  id: string;
  tag: string;
  stat: string;
  statSub: string;
  title: string;
  description: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    tag: 'GROW YOUR MONEY',
    stat: '12%',
    statSub: 'annual return',
    title: 'Earn up to\n12% a year',
    description:
      'High-yield accounts that outperform your bank — without the complexity.',
  },
  {
    id: '2',
    tag: 'ALWAYS ON',
    stat: '24/7',
    statSub: 'growing',
    title: 'Your money\nnever sleeps',
    description:
      'Your money grows every second, day and night. Available anytime, no waiting.',
  },
  {
    id: '3',
    tag: 'PAY SMARTER',
    stat: '$0',
    statSub: 'conversion fees',
    title: 'Pay any bill\nin seconds',
    description:
      'Convert just enough to cover it. The rest keeps earning.',
  },
];

const SlideItem: React.FC<{item: OnboardingSlide}> = ({item}) => (
  <View style={[styles.slide, {width: SCREEN_WIDTH}]}>
    <Text style={styles.tag}>{item.tag}</Text>

    <Text style={styles.stat}>{item.stat}</Text>
    <Text style={styles.statSub}>{item.statSub}</Text>

    {/* Divisor roxo */}
    <View style={styles.accentBar} />

    <Text style={styles.title}>{item.title}</Text>
    <Text style={styles.description}>{item.description}</Text>
  </View>
);

export const SplashOnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      navigation.navigate('Login' as never);
    } else {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({index: nextIndex, animated: true});
      setCurrentIndex(nextIndex);
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login' as never);
  };

  const onScrollEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  return (
    <View style={[styles.root, {backgroundColor: DESIGN.bg, paddingTop: insets.top}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>VANTS</Text>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        renderItem={({item}) => <SlideItem item={item} />}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
        style={styles.flatList}
      />

      {/* Footer */}
      <View style={[styles.footer, {paddingBottom: insets.bottom + spacing.md}]}>
        {/* Indicadores de página */}
        <View style={styles.indicators}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.indicator,
                i === currentIndex ? styles.indicatorActive : styles.indicatorInactive,
              ]}
            />
          ))}
        </View>

        {/* Botão CTA */}
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleNext}
          activeOpacity={0.85}>
          <Text style={styles.btnPrimaryText}>
            {isLastSlide ? 'Get Started →' : 'Continue →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 3,
    color: DESIGN.textPrimary,
  },
  skipText: {
    fontSize: 15,
    color: DESIGN.textSecondary,
    fontWeight: '500',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: spacing.lg + spacing.xs,
    paddingTop: spacing.xl + spacing.md,
  },
  tag: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: DESIGN.accent,
    marginBottom: spacing.lg,
    textTransform: 'uppercase',
  },
  stat: {
    fontSize: 72,
    fontWeight: '800',
    color: DESIGN.textPrimary,
    lineHeight: 80,
    letterSpacing: -2,
  },
  statSub: {
    fontSize: 16,
    color: DESIGN.textSecondary,
    marginBottom: spacing.md,
    fontWeight: '400',
  },
  accentBar: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: DESIGN.accent,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: DESIGN.textPrimary,
    lineHeight: 38,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 16,
    color: DESIGN.textSecondary,
    lineHeight: 24,
    fontWeight: '400',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  indicator: {
    height: 4,
    borderRadius: 2,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: DESIGN.indicatorActive,
  },
  indicatorInactive: {
    width: 10,
    backgroundColor: DESIGN.indicatorInactive,
  },
  btnPrimary: {
    width: '100%',
    height: 56,
    backgroundColor: DESIGN.btnPrimary,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: DESIGN.btnPrimaryText,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
