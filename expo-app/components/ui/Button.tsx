import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { borderRadius, spacing, typography } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
}: ButtonProps) {
  const { theme } = useTheme();

  const sizeStyles: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
    sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, fontSize: typography.caption.fontSize },
    md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, fontSize: typography.body.fontSize },
    lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, fontSize: typography.subtitle.fontSize },
  };

  const getVariantStyles = (pressed: boolean): { container: ViewStyle; text: TextStyle } => {
    const baseOpacity = pressed ? 0.85 : 1;

    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: pressed ? theme.accentLight : theme.accent,
            opacity: baseOpacity,
          },
          text: { color: '#ffffff' },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: pressed ? theme.cardHover : theme.card,
            borderWidth: 1,
            borderColor: theme.cardBorder,
          },
          text: { color: theme.textPrimary },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: pressed ? theme.accentLight : theme.accent,
          },
          text: { color: theme.accent },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: pressed ? theme.card : 'transparent',
          },
          text: { color: theme.accent },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: pressed ? theme.danger : theme.danger,
            opacity: pressed ? 0.85 : 1,
          },
          text: { color: '#ffffff' },
        };
      default:
        return {
          container: {},
          text: {},
        };
    }
  };

  const currentSize = sizeStyles[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => {
        const variantStyles = getVariantStyles(pressed);
        return [
          styles.base,
          {
            paddingVertical: currentSize.paddingVertical,
            paddingHorizontal: currentSize.paddingHorizontal,
          },
          variantStyles.container,
          fullWidth && styles.fullWidth,
          (disabled || loading) && styles.disabled,
          style,
        ];
      }}
    >
      {({ pressed }) => {
        const variantStyles = getVariantStyles(pressed);
        return (
          <>
            {loading ? (
              <ActivityIndicator
                size="small"
                color={variantStyles.text.color}
              />
            ) : (
              <>
                {icon && iconPosition === 'left' && (
                  <>{icon}</>
                )}
                <Text
                  style={[
                    styles.text,
                    { fontSize: currentSize.fontSize },
                    variantStyles.text,
                    icon && iconPosition === 'left' ? { marginLeft: spacing.sm } : undefined,
                    icon && iconPosition === 'right' ? { marginRight: spacing.sm } : undefined,
                  ]}
                >
                  {children}
                </Text>
                {icon && iconPosition === 'right' && (
                  <>{icon}</>
                )}
              </>
            )}
          </>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },
  text: {
    fontWeight: '600',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
