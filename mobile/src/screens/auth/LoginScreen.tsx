import React, {useState} from 'react';
import {Pressable, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {z} from 'zod';
import AuthContainer from '@/components/auth/AuthContainer';
import AppInput from '@/components/ui/AppInput';
import AppButton from '@/components/ui/AppButton';
import AppText from '@/components/ui/AppText';
import Icon from '@/components/ui/Icon';
import InflowLogo from '@/components/ui/InflowLogo';
import {AppleIcon, GoogleIcon} from '@/components/ui/BrandIcons';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<LoginFormData> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof LoginFormData] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(() => resolve(null), 2000));
      navigation.navigate('Main');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: undefined}));
    }
  };

  return (
    <AuthContainer className="px-5 py-4">
      {/* Back chevron — top-left */}
      <Pressable
        onPress={() => navigation.goBack()}
        className="w-[38px] h-[38px] rounded-xl bg-surface border border-border items-center justify-center mb-3">
        <Icon name="ChevronLeft" className="w-5 h-5 text-ink" />
      </Pressable>

      {/* Brand mark */}
      <InflowLogo size={56} radius={16} style={{marginBottom: 12}} />

      <AppText weight="extrabold" raw className="text-ink mb-1.5" style={{fontSize: 26, lineHeight: 31}}>
        {t('LOGIN_TITLE')}
      </AppText>
      <AppText raw className="text-ink2 mb-6" style={{fontSize: 14.5, lineHeight: 22}}>
        {t('LOGIN_SUBTITLE')}
      </AppText>

      <View className="mb-5">
        <AppInput
          label={t('LOGIN_EMAIL_LABEL')}
          placeholder={t('LOGIN_EMAIL_PLACEHOLDER')}
          value={formData.email}
          onChangeText={value => updateFormData('email', value)}
          errorText={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      </View>

      <View className="mb-5">
        {/* Password label row with inline "Quên mật khẩu?" on the right */}
        <View className="flex-row items-center mb-2">
          <AppText variant="labelSmall" weight="bold" className="text-ink2">
            LOGIN_PASSWORD_LABEL
          </AppText>
          <Pressable className="ml-auto">
            <AppText variant="labelSmall" weight="bold" className="text-flow-ink">
              LOGIN_FORGOT
            </AppText>
          </Pressable>
        </View>
        <AppInput
          placeholder={t('LOGIN_PASSWORD_PLACEHOLDER')}
          value={formData.password}
          onChangeText={value => updateFormData('password', value)}
          errorText={errors.password}
          secureTextEntry={!showPassword}
          autoComplete="password"
          rightIcon={
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Icon
                name={showPassword ? 'EyeOff' : 'Eye'}
                className="w-5 h-5 text-ink3"
              />
            </Pressable>
          }
        />
      </View>

      <AppButton
        variant="primary"
        size="lg"
        onPress={handleLogin}
        loading={isLoading}
        className="mb-5">
        {isLoading ? t('LOGIN_SUBMITTING') : t('LOGIN_SUBMIT')}
      </AppButton>

      {/* "hoặc tiếp tục với" divider */}
      <View className="flex-row items-center gap-3 mb-5">
        <View className="flex-1 h-px bg-hair" />
        <AppText variant="labelSmall" className="text-ink3">
          LOGIN_OR
        </AppText>
        <View className="flex-1 h-px bg-hair" />
      </View>

      {/* 2-up social row: Apple (dark) + Google (bordered) */}
      <View className="flex-row gap-3">
        <Pressable className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-[14px] bg-ink">
          <AppleIcon size={16} color="#fff" />
          <AppText variant="label" weight="bold" className="text-app-bg">
            LOGIN_APPLE
          </AppText>
        </Pressable>
        <Pressable className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-[14px] border-[1.5px] border-border bg-surface">
          <GoogleIcon size={16} />
          <AppText variant="label" weight="bold" className="text-ink">
            LOGIN_GOOGLE
          </AppText>
        </Pressable>
      </View>

      {/* Footer */}
      <View className="flex-row justify-center items-center mt-8">
        <AppText variant="bodySmall" className="text-ink3">
          {t('LOGIN_NO_ACCOUNT')}{' '}
        </AppText>
        <Pressable onPress={() => navigation.navigate('Register')}>
          <AppText variant="bodySmall" weight="bold" className="text-flow-ink">
            LOGIN_SIGN_UP
          </AppText>
        </Pressable>
      </View>
    </AuthContainer>
  );
}
