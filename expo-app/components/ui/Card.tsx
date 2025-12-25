import React from 'react';
import { View, ViewStyle, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius, spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  style,
}: CardProps) {
  const { theme, isDark } = useTheme();

  const paddingValue = {
    none: 0,
    sm: spacing.sm,
    md: spacing.lg,
    lg: spacing.xl,
  }[padding];

  const cardStyle: ViewStyle = {
    backgroundColor: theme.card,
    borderRadius: borderRadius.xl,
    padding: paddingValue,
    ...(variant === 'outlined' && {
      borderWidth: 1,
      borderColor: theme.cardBorder,
    }),
    ...(variant === 'elevated' && !isDark && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    }),
    ...(variant === 'elevated' && isDark && {
      borderWidth: 1,
      borderColor: theme.cardBorder,
    }),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && { opacity: 0.9, backgroundColor: theme.cardHover },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}

export default Card;
