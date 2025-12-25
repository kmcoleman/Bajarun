import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { typography, TypographyVariant } from '../../constants/theme';

type TextColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'accent' | 'success' | 'warning' | 'danger';

interface ThemedTextProps {
  children: React.ReactNode;
  variant?: TypographyVariant;
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  numberOfLines?: number;
  style?: TextStyle;
}

export function ThemedText({
  children,
  variant = 'body',
  color = 'primary',
  align = 'left',
  weight,
  numberOfLines,
  style,
}: ThemedTextProps) {
  const { theme } = useTheme();

  const colorMap: Record<TextColor, string> = {
    primary: theme.textPrimary,
    secondary: theme.textSecondary,
    muted: theme.textMuted,
    inverse: theme.textInverse,
    accent: theme.accent,
    success: theme.success,
    warning: theme.warning,
    danger: theme.danger,
  };

  const fontWeightMap: Record<string, TextStyle['fontWeight']> = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  };

  const variantStyle = typography[variant];

  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        {
          fontSize: variantStyle.fontSize,
          fontWeight: weight ? fontWeightMap[weight] : variantStyle.fontWeight,
          lineHeight: variantStyle.lineHeight,
          color: colorMap[color],
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

// Convenience components for common typography
export function HeroText({ children, ...props }: Omit<ThemedTextProps, 'variant'>) {
  return <ThemedText variant="hero" weight="bold" {...props}>{children}</ThemedText>;
}

export function TitleText({ children, ...props }: Omit<ThemedTextProps, 'variant'>) {
  return <ThemedText variant="title" weight="semibold" {...props}>{children}</ThemedText>;
}

export function SubtitleText({ children, ...props }: Omit<ThemedTextProps, 'variant'>) {
  return <ThemedText variant="subtitle" weight="medium" {...props}>{children}</ThemedText>;
}

export function BodyText({ children, ...props }: Omit<ThemedTextProps, 'variant'>) {
  return <ThemedText variant="body" {...props}>{children}</ThemedText>;
}

export function CaptionText({ children, ...props }: Omit<ThemedTextProps, 'variant'>) {
  return <ThemedText variant="caption" {...props}>{children}</ThemedText>;
}

export function SmallText({ children, ...props }: Omit<ThemedTextProps, 'variant'>) {
  return <ThemedText variant="small" {...props}>{children}</ThemedText>;
}

export default ThemedText;
