import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../constants/theme';
import { TitleText, SubtitleText, CaptionText } from './Text';
import { IconBadge } from './IconBadge';

type SectionHeaderColor = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  color?: SectionHeaderColor;
  size?: 'sm' | 'md' | 'lg';
  badge?: string | number;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  color = 'accent',
  size = 'md',
  badge,
  rightElement,
  style,
}: SectionHeaderProps) {
  const { theme } = useTheme();

  const titleVariant = size === 'lg' ? 'title' : size === 'md' ? 'subtitle' : 'body';
  const iconSize = size === 'lg' ? 'lg' : size === 'md' ? 'md' : 'sm';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftContent}>
        {icon && (
          <IconBadge
            icon={icon}
            color={color}
            size={iconSize}
            variant="soft"
            style={styles.icon}
          />
        )}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            {size === 'lg' ? (
              <TitleText>{title}</TitleText>
            ) : size === 'md' ? (
              <SubtitleText weight="semibold">{title}</SubtitleText>
            ) : (
              <CaptionText weight="semibold">{title}</CaptionText>
            )}
            {badge !== undefined && (
              <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                <CaptionText color="inverse" weight="semibold">
                  {badge}
                </CaptionText>
              </View>
            )}
          </View>
          {subtitle && (
            <CaptionText color="secondary" style={styles.subtitle}>
              {subtitle}
            </CaptionText>
          )}
        </View>
      </View>
      {rightElement && <View style={styles.rightContent}>{rightElement}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  rightContent: {
    marginLeft: spacing.md,
  },
});

export default SectionHeader;
