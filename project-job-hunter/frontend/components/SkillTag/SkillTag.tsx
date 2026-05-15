/**
 * @component SkillTag
 * @description Thành phần hiển thị nhãn dán kỹ năng (Skill) hoặc các nhãn phân loại.
 * @path frontend/components/SkillTag/SkillTag.tsx
 */

import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SkillTagProps {
  name: string;
  selected?: boolean;
  matched?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

const SkillTag: React.FC<SkillTagProps> = ({
  name,
  selected = false,
  matched = false,
  onPress,
  style,
}) => {
  const bgColor = matched
    ? COLORS.primaryLight
    : selected
    ? COLORS.primary
    : COLORS.background.tertiary;

  const textColor = matched
    ? COLORS.primary
    : selected
    ? COLORS.white
    : COLORS.text.secondary;

  const borderColor = matched
    ? COLORS.primary + '30'
    : selected
    ? COLORS.primary
    : COLORS.border;

  return (
    <TouchableOpacity
      style={[
        styles.tag, 
        { backgroundColor: bgColor, borderColor }, 
        style
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.content}>
        {matched && (
          <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} style={styles.icon} />
        )}
        <Text style={[styles.text, { color: textColor }]}>
          {name}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    ...TYPOGRAPHY.captionBold,
    fontSize: 11,
  },
});

export default SkillTag;
