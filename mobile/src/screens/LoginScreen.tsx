import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Path, Circle, G, Rect} from 'react-native-svg';
import {spacing, borderRadius} from '../theme/colors';

// Paleta do novo design (light mode)
const DESIGN = {
  bg: '#F0F2F5',
  surface: '#FFFFFF',
  textPrimary: '#0D1117',
  textSecondary: '#8E9AAD',
  accent: '#6C63FF',       // roxo/índigo para links e destaques
  btnPrimary: '#0D1117',   // botão escuro (email e apple)
  btnPrimaryText: '#FFFFFF',
  border: '#E2E8F0',
  inputBorder: '#D0D7E3',
  inputText: '#0D1117',
  placeholder: '#B0BAC9',
  googleBorder: '#E2E8F0',
};

// Ícone Google SVG inline
const GoogleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 48 48">
    <G>
      <Path
        d="M43.6 20.5H42V20H24v8h11.3C33.6 33 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.4 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
        fill="#FFC107"
      />
      <Path
        d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.4 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"
        fill="#FF3D00"
      />
      <Path
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.5-3-11.3-7.3L6 33.6C9.4 39.6 16.1 44 24 44z"
        fill="#4CAF50"
      />
      <Path
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C37 39.5 44 34 44 24c0-1.2-.1-2.4-.4-3.5z"
        fill="#1976D2"
      />
    </G>
  </Svg>
);

// Ícone Apple SVG inline
const AppleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 814 1000">
    <Path
      d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 411.6 18 244.3 23.9 177.8c-45.5-1.9-99.5 23.9-129.3 55-28.5 29.3-42.5 63.9-42.5 100.6 0 5.8.3 11.6.9 17.4 4.2 40.8 21.2 77.1 50 104 21.5 19.7 50 33.3 80.7 33.3h4.3c6.1 0 12.1-.3 18.2-.9 12.6-1.6 24.8-5.2 36.3-10.2 31.2-13.4 64.7-38.3 93.9-74.3-9.3-11-19.5-21.1-29-29.3-30.5-27.7-57.5-41.4-79.4-41.4-13.4 0-25.8 3.5-36.9 10.4-6 3.8-11.5 8.3-16.4 13.4-10.7 11.3-16.7 26-16.7 41.9 0 15.2 5.6 29.6 15.8 40.5 10 10.7 23.7 17 38.8 17 11.6 0 22.8-3.5 32.3-10.2 9.6-6.7 17-16.2 20.7-27.1 3.5-10.1 4.2-21 2.2-31.6 3.5 4.8 7 9.7 10.4 14.6 13.7 19.7 27.7 40 42.2 57.4-26.4 30.4-55.3 57.5-84.9 72.7-16.4 8.5-32.5 13-48.3 13-10.7 0-21.1-2.2-30.8-6.7C50.2 575.4 32 548.5 32 519.2c0-17.8 6.2-35.3 17.9-49.6 11.7-14.4 28.7-24.9 49.3-30.4 11.8-3.2 24.4-4.9 37.6-4.9 36.2 0 75.8 12.6 113.4 36.1 18.1 11.3 36 24.8 53.5 40.5 11.8-17.2 22.2-36.2 30.5-56.8 22.5-56 30.5-123.6 11.3-185.7C320.5 203.1 265 139.6 185 139.6c-22.8 0-44.1 5.2-63.4 15.5-18.6 9.9-34.3 24.6-45.9 43.2C66.4 213.1 60 237.9 60 264.6c0 33.2 9.9 67.3 28.8 98.5 7.8 12.9 17 25.5 27.5 37.5-29.3-16.3-56.8-41-79.1-72.6C16.2 294.2 0 248.6 0 202c0-50.9 14.7-99.7 42.5-141.7C70.3 18.8 112.6-6.2 161.7-6.2c47.7 0 94.2 23.5 133.2 67.2 37.8 42.3 64.6 103.1 73.7 170.2 9.9 72.3-3.5 147.9-38.4 210.7 18.9 14.9 37.8 27.7 56.4 38 55.9 31 110.9 46.4 163 46.4 23.3 0 45.3-3.6 65.6-10.8 12.3-4.4 24-10.3 34.9-17.7 33.6-22.4 55-60 55-102.4 0-27.6-8.7-53.8-25-76.4-10.2-14.1-22.8-26.2-37.7-35.8-2.7-1.7-5.5-3.4-8.3-5z"
      fill="#FFFFFF"
    />
  </Svg>
);

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const handleEmailContinue = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('E-mail inválido', 'Por favor, insira um e-mail válido.');
      return;
    }

    try {
      setIsEmailLoading(true);
      // TODO: implementar autenticação por e-mail
      navigation.navigate('Onboarding' as never);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao continuar com e-mail.');
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: implementar OAuth Google
    Alert.alert('Em breve', 'Login com Google em breve.');
  };

  const handleAppleLogin = () => {
    // TODO: implementar OAuth Apple
    Alert.alert('Em breve', 'Login com Apple em breve.');
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, {backgroundColor: DESIGN.bg}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl},
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Botão voltar */}
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.logoText}>VANTS</Text>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Create your account</Text>
        <Text style={styles.subheading}>Start earning in under a minute.</Text>

        {/* Formulário */}
        <View style={styles.form}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={DESIGN.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            returnKeyType="done"
            onSubmitEditing={handleEmailContinue}
          />

          <TouchableOpacity
            style={[styles.btnPrimary, isEmailLoading && styles.btnDisabled]}
            onPress={handleEmailContinue}
            activeOpacity={0.85}
            disabled={isEmailLoading}>
            {isEmailLoading ? (
              <ActivityIndicator color={DESIGN.btnPrimaryText} />
            ) : (
              <Text style={styles.btnPrimaryText}>Continue with Email</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Separador */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Botão Google */}
        <TouchableOpacity
          style={styles.btnGoogle}
          onPress={handleGoogleLogin}
          activeOpacity={0.85}>
          <GoogleIcon />
          <Text style={styles.btnGoogleText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Botão Apple */}
        <TouchableOpacity
          style={styles.btnApple}
          onPress={handleAppleLogin}
          activeOpacity={0.85}>
          <AppleIcon />
          <Text style={styles.btnAppleText}>Continue with Apple</Text>
        </TouchableOpacity>

        {/* Termos */}
        <Text style={styles.terms}>
          By continuing you agree to our{' '}
          <Text style={styles.termsLink}>Terms</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DESIGN.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    // sombra suave
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  backIcon: {
    fontSize: 28,
    color: DESIGN.textPrimary,
    lineHeight: 34,
    marginTop: -2,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
    color: DESIGN.textPrimary,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: DESIGN.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subheading: {
    fontSize: 15,
    color: DESIGN.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl + spacing.md,
  },
  form: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: DESIGN.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderColor: DESIGN.inputBorder,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: DESIGN.inputText,
    backgroundColor: DESIGN.surface,
    marginBottom: spacing.md,
  },
  btnPrimary: {
    width: '100%',
    height: 54,
    backgroundColor: DESIGN.btnPrimary,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    color: DESIGN.btnPrimaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: DESIGN.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: DESIGN.textSecondary,
    fontSize: 13,
  },
  btnGoogle: {
    width: '100%',
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: DESIGN.surface,
    borderWidth: 1.5,
    borderColor: DESIGN.googleBorder,
    borderRadius: 32,
    marginBottom: spacing.sm,
  },
  btnGoogleText: {
    color: DESIGN.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  btnApple: {
    width: '100%',
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: DESIGN.btnPrimary,
    borderRadius: 32,
    marginBottom: spacing.xl,
  },
  btnAppleText: {
    color: DESIGN.btnPrimaryText,
    fontSize: 16,
    fontWeight: '500',
  },
  terms: {
    fontSize: 12,
    color: DESIGN.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: DESIGN.accent,
    fontWeight: '500',
  },
});
