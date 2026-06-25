import React, {useState} from 'react';
import {View, Pressable} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {z} from 'zod';
import AuthContainer from '@/components/auth/AuthContainer';
import AppInput from '@/components/ui/AppInput';
import AppButton from '@/components/ui/AppButton';
import AppText from '@/components/ui/AppText';
import Icon from '@/components/ui/Icon';
import InflowLogo from '@/components/ui/InflowLogo';
import {RootStackScreenProps} from '@/navigation/types';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const navigation =
    useNavigation<RootStackScreenProps<'Register'>['navigation']>();
  const {t} = useTranslation();
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterFormData, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    try {
      registerSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof RegisterFormData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof RegisterFormData] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(() => resolve(null), 2000));
      navigation.navigate('Login');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: undefined}));
    }
  };

  return (
    <AuthContainer className="px-7 py-4">
      {/* Back chevron — top-left */}
      <Pressable
        onPress={() => navigation.goBack()}
        className="w-[34px] h-[34px] rounded-[11px] bg-surface border border-hair items-center justify-center mb-4">
        <Icon name="ChevronLeft" className="w-5 h-5 text-ink2" />
      </Pressable>

      {/* Brand mark */}
      <InflowLogo size={50} radius={15} style={{marginBottom: 18}} />

      <AppText variant="heading1" className="mb-1.5">
        REGISTER_TITLE
      </AppText>
      <AppText variant="body" className="text-ink2 mb-6">
        REGISTER_SUBTITLE
      </AppText>

      <View className="mb-5">
        <AppInput
          label={t('REGISTER_NAME_LABEL')}
          placeholder={t('REGISTER_NAME_PLACEHOLDER')}
          value={formData.fullName}
          onChangeText={value => updateFormData('fullName', value)}
          errorText={errors.fullName}
          autoComplete="name"
        />
      </View>

      <View className="mb-5">
        <AppInput
          label={t('REGISTER_EMAIL_LABEL')}
          placeholder={t('REGISTER_EMAIL_PLACEHOLDER')}
          value={formData.email}
          onChangeText={value => updateFormData('email', value)}
          errorText={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      </View>

      <View className="mb-5">
        <AppInput
          label={t('REGISTER_PASSWORD_LABEL')}
          placeholder={t('REGISTER_PASSWORD_PLACEHOLDER')}
          value={formData.password}
          onChangeText={value => updateFormData('password', value)}
          errorText={errors.password}
          secureTextEntry={!showPassword}
          autoComplete="new-password"
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

      <View className="mb-5">
        <AppInput
          label={t('REGISTER_CONFIRM_LABEL')}
          placeholder={t('REGISTER_PASSWORD_PLACEHOLDER')}
          value={formData.confirmPassword}
          onChangeText={value => updateFormData('confirmPassword', value)}
          errorText={errors.confirmPassword}
          secureTextEntry={!showConfirmPassword}
          autoComplete="new-password"
          rightIcon={
            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Icon
                name={showConfirmPassword ? 'EyeOff' : 'Eye'}
                className="w-5 h-5 text-ink3"
              />
            </Pressable>
          }
        />
      </View>

      <AppButton
        variant="primary"
        size="lg"
        onPress={handleRegister}
        loading={isLoading}
        className="mb-4">
        {isLoading ? t('REGISTER_SUBMITTING') : t('REGISTER_SUBMIT')}
      </AppButton>

      {/* Legal line */}
      <AppText variant="labelSmall" align="center" className="text-ink3 mb-2">
        REGISTER_TERMS
      </AppText>

      {/* Footer */}
      <View className="flex-row justify-center items-center mt-6">
        <AppText variant="bodySmall" className="text-ink3">
          {t('REGISTER_HAVE_ACCOUNT')}{' '}
        </AppText>
        <Pressable onPress={() => navigation.navigate('Login')}>
          <AppText variant="bodySmall" weight="bold" className="text-flow-ink">
            REGISTER_SIGN_IN
          </AppText>
        </Pressable>
      </View>
    </AuthContainer>
  );
}
