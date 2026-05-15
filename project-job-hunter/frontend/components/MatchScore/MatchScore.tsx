
// Match Score component — circular progress indicator
import { COLORS } from '@constants/theme';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface MatchScoreProps {
  score: number; // 0-100
  size?: number;
  showLabel?: boolean;
  style?: ViewStyle;
}

const MatchScore: React.FC<MatchScoreProps> = ({
  score,
  size = 48,
  showLabel = true,
  style,
}) => {
  const getColor = () => {
    if (score >= 80) return COLORS.matchHigh;
    if (score >= 50) return COLORS.matchMedium;
    return COLORS.matchLow;
  };

  const color = getColor();
  const fontSize = size <= 36 ? 10 : size <= 48 ? 13 : 16;

  return (
    <View style={[styles.container, style]}>
      <View style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          backgroundColor: color + '15',
        },
      ]}>
        <Text style={[styles.score, { fontSize, color }]}>{score}%</Text>
      </View>
      {showLabel && (
        <Text style={[styles.label, { color }]}>Match</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circle: {
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  score: {
    fontWeight: '800',
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
});

export default MatchScore;
