import React from 'react';
import { View, ScrollView, ViewStyle, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../constants/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padding?: boolean;
  safeArea?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export function ScreenContainer({
  children,
  scrollable = true,
  padding = true,
  safeArea = true,
  edges = ['top', 'bottom'],
  style,
  contentContainerStyle,
}: ScreenContainerProps) {
  const { theme, isDark } = useTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.background,
  };

  const contentStyle: ViewStyle = {
    ...(padding && { padding: spacing.lg }),
    ...contentContainerStyle,
  };

  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      {safeArea ? (
        <SafeAreaView style={[containerStyle, style]} edges={edges}>
          {content}
        </SafeAreaView>
      ) : (
        <View style={[containerStyle, style]}>{content}</View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default ScreenContainer;
