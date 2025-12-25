import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius, spacing, iconSizes } from '../../constants/theme';

type IconBadgeColor = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
type IconBadgeSize = 'sm' | 'md' | 'lg' | 'xl';

interface IconBadgeProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color?: IconBadgeColor;
  size?: IconBadgeSize;
  variant?: 'filled' | 'soft' | 'outline';
  style?: ViewStyle;
}

export function IconBadge({
  icon,
  color = 'accent',
  size = 'md',
  variant = 'soft',
  style,
}: IconBadgeProps) {
  const { theme, isDark } = useTheme();

  // Color mapping
  const colorMap: Record<IconBadgeColor, { bg: string; icon: string; border: string }> = {
    accent: {
      bg: isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)',
      icon: theme.accent,
      border: theme.accent,
    },
    success: {
      bg: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
      icon: theme.success,
      border: theme.success,
    },
    warning: {
      bg: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
      icon: theme.warning,
      border: theme.warning,
    },
    danger: {
      bg: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
      icon: theme.danger,
      border: theme.danger,
    },
    info: {
      bg: isDark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.1)',
      icon: theme.info,
      border: theme.info,
    },
    muted: {
      bg: isDark ? 'rgba(100, 116, 139, 0.2)' : 'rgba(100, 116, 139, 0.1)',
      icon: theme.textMuted,
      border: theme.textMuted,
    },
  };

  // Size mapping
  const sizeMap: Record<IconBadgeSize, { container: number; icon: number; radius: number }> = {
    sm: { container: 28, icon: iconSizes.sm, radius: borderRadius.md },
    md: { container: 36, icon: iconSizes.md, radius: borderRadius.lg },
    lg: { container: 44, icon: iconSizes.lg, radius: borderRadius.lg },
    xl: { container: 56, icon: iconSizes.xl, radius: borderRadius.xl },
  };

  const colors = colorMap[color];
  const dimensions = sizeMap[size];

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      width: dimensions.container,
      height: dimensions.container,
      borderRadius: dimensions.radius,
      alignItems: 'center',
      justifyContent: 'center',
    };

    switch (variant) {
      case 'filled':
        return {
          ...base,
          backgroundColor: colors.icon,
        };
      case 'soft':
        return {
          ...base,
          backgroundColor: colors.bg,
        };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return base;
    }
  };

  const iconColor = variant === 'filled' ? '#ffffff' : colors.icon;

  return (
    <View style={[getContainerStyle(), style]}>
      <FontAwesome name={icon} size={dimensions.icon} color={iconColor} />
    </View>
  );
}

export default IconBadge;
