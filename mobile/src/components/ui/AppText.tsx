import React from 'react';
import {Text, TextProps, TextStyle} from 'react-native';
import {cn} from '@/utils';
import {cva} from 'class-variance-authority';
import {useTranslation} from "react-i18next";

interface AppTextProps extends TextProps {
  variant?:
    | 'display1'
    | 'display2'
    | 'display3'
    | 'heading1'
    | 'heading2'
    | 'heading3'
    | 'heading4'
    | 'heading5'
    | 'body'
    | 'bodyLarge'
    | 'bodySmall'
    | 'caption'
    | 'overline'
    | 'label'
    | 'labelSmall';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  color?: 'default' | 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'error';
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
  raw?: boolean;
  className?: string;
}

const textVariants = cva(
  'text-foreground font-sans-regular',
  {
    variants: {
      variant: {
        display1: 'text-5xl leading-tight',
        display2: 'text-4xl leading-tight',
        display3: 'text-3xl leading-tight',
        heading1: 'text-2xl leading-tight',
        heading2: 'text-xl leading-tight',
        heading3: 'text-lg leading-tight',
        heading4: 'text-base leading-tight',
        heading5: 'text-sm leading-tight',
        body: 'text-base leading-normal',
        bodyLarge: 'text-lg leading-normal',
        bodySmall: 'text-sm leading-normal',
        caption: 'text-lg leading-normal',
        overline: 'text-xs leading-normal uppercase tracking-wide',
        label: 'text-sm leading-normal',
        labelSmall: 'text-xs leading-normal',
      },
      weight: {
        regular: 'font-sans-regular',
        medium: 'font-sans-medium',
        semibold: 'font-sans-semibold',
        bold: 'font-sans-bold',
        extrabold: 'font-sans-extrabold',
      },
      color: {
        default: 'text-foreground',
        primary: 'text-primary',
        secondary: 'text-secondary',
        muted: 'text-neutrals400',
        success: 'text-success200',
        warning: 'text-warning200',
        error: 'text-error200',
      },
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      },
    },
    defaultVariants: {
      variant: 'body',
      weight: 'regular',
      color: 'default',
      align: 'left',
    },
  }
);

export default function AppText({
                                  variant = 'body',
                                  weight,
                                  color = 'default',
                                  align = 'left',
                                  children,
                                  className,
                                  ...props
                                }: AppTextProps) {
  const {t} = useTranslation();
  let computedClassName = textVariants({variant, weight, color, align});
  if (!props.raw && typeof children === 'string') {
    children = t((children as string).toString().trim());
  }

  if (!weight) {
    // Display + large headings are weight 800 (ExtraBold) per the design
    // handoff; smaller headings stay at 700 (Bold). See typography.ts.
    if (['display1', 'display2', 'display3', 'heading1', 'heading2'].includes(variant)) {
      computedClassName = cn(computedClassName, 'font-sans-extrabold');
    } else if (['heading3', 'heading4', 'heading5'].includes(variant)) {
      computedClassName = cn(computedClassName, 'font-sans-bold');
    } else if (['label', 'labelSmall'].includes(variant)) {
      computedClassName = cn(computedClassName, 'font-sans-medium');
    } else if (variant === 'overline') {
      computedClassName = cn(computedClassName, 'font-sans-semibold');
    }
  }

  // Headings carry negative letter-spacing in the design (~ -0.4 to -1.2px).
  // NativeWind has no tracking scale wired, so apply it as an inline style.
  const headingTracking: Partial<Record<NonNullable<AppTextProps['variant']>, number>> = {
    display1: -1.2,
    display2: -1,
    display3: -0.6,
    heading1: -0.6,
    heading2: -0.5,
    heading3: -0.4,
  };
  const tracking = headingTracking[variant];
  const mergedStyle: TextStyle | TextProps['style'] =
    tracking !== undefined
      ? [{letterSpacing: tracking}, props.style as TextStyle]
      : props.style;

  return (
    <Text
      {...props}
      style={mergedStyle}
      className={cn(computedClassName, className)}
    >
      {children}
    </Text>
  );
}

AppText.displayName = 'AppText';
