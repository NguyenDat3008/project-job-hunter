import { Button, TextField, LoadingSpinner } from '@components/index';
import { BORDER_RADIUS, COLORS, SHADOW, SPACING, TYPOGRAPHY } from '@constants/theme';
import { useAuth } from '@hooks/index';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, StatusBar, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, state } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Nếu đã login rồi thì redirect về home
  React.useEffect(() => {
    if (!isLoading && state.isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isLoading, state.isAuthenticated]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    try {
      setError('');
      await login(email, password);
    } catch (err: any) {
      // Parse error message từ backend (axios wraps trong response.data)
      const msg = err?.response?.data?.message || err?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(msg);
    }
  };

  const handleDemoLogin = () => {
    setEmail('demo@topjob.vn');
    setPassword('123456');
  };

  if (isLoading && state.isAuthenticated) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background.primary} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.header}>
            <Image source={require('../assets/images/logotopCV.jpg')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.welcomeText}>Chào mừng trở lại</Text>
            <Text style={styles.subtitleText}>Đăng nhập để tiếp tục hành trình sự nghiệp</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <TextField
            label="EMAIL"
            placeholder="name@example.com"
            value={email}
            onChangeText={(text) => { setEmail(text); setError(''); }}
            keyboardType="email-address"
          />

          <TextField
            label="MẬT KHẨU"
            placeholder="Nhập mật khẩu của bạn"
            value={password}
            onChangeText={(text) => { setPassword(text); setError(''); }}
            secureTextEntry
            showPasswordToggle
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.6}>
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <Button
            title="Đăng nhập"
            onPress={handleLogin}
            isLoading={isLoading}
            fullWidth
            style={styles.loginButton}
          />

          <Button
            title="Sử dụng tài khoản Demo"
            onPress={handleDemoLogin}
            variant="ghost"
            fullWidth
          />
        </View>

        {/* Social Login */}
        <View style={styles.socialContainer}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC ĐĂNG NHẬP VỚI</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
              <Ionicons name="logo-google" size={24} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
              <Ionicons name="logo-facebook" size={24} color="#4267B2" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.registerContainer}>
          <Text style={styles.noAccountText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')} activeOpacity={0.6}>
            <Text style={styles.registerText}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background.primary 
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xxxl,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: SPACING.xxxl,
  },
  header: { 
    alignItems: 'center', 
    marginBottom: SPACING.xxxl 
  },
  logo: { 
    width: 180, 
    height: 70, 
    marginBottom: SPACING.md 
  },
  welcomeText: { 
    ...TYPOGRAPHY.h1, 
    color: COLORS.text.primary, 
    marginBottom: SPACING.xs 
  },
  subtitleText: { 
    ...TYPOGRAPHY.body1, 
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: { 
    marginBottom: SPACING.xxl 
  },
  errorText: { 
    ...TYPOGRAPHY.caption, 
    color: COLORS.error, 
    marginBottom: SPACING.md, 
    marginTop: -SPACING.sm,
    fontWeight: '500',
  },
  forgotPassword: { 
    alignSelf: 'flex-end', 
    marginBottom: SPACING.md,
  },
  forgotPasswordText: { 
    ...TYPOGRAPHY.captionBold, 
    color: COLORS.primary,
  },
  loginButton: { 
    marginBottom: SPACING.sm 
  },
  socialContainer: { 
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  divider: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: SPACING.xl 
  },
  dividerLine: { 
    flex: 1, 
    height: 1, 
    backgroundColor: COLORS.border 
  },
  dividerText: { 
    ...TYPOGRAPHY.label, 
    color: COLORS.text.light, 
    paddingHorizontal: SPACING.md,
    fontSize: 10,
  },
  socialButtons: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    gap: SPACING.lg 
  },
  socialBtn: {
    width: 60,
    height: 52, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, 
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  noAccountText: { 
    ...TYPOGRAPHY.body2, 
    color: COLORS.text.secondary 
  },
  registerText: { 
    ...TYPOGRAPHY.body2, 
    color: COLORS.primary, 
    fontWeight: '700' 
  },
});
