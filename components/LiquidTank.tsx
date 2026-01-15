import React from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useThemeStore } from '../store/themeStore';

interface LiquidTankProps {
  progress: number; // 0 (full) → 1 (empty)
  size?: number;
}

export const LiquidTank: React.FC<LiquidTankProps> = ({
  progress,
  size = 280,
}) => {
  const { theme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  const currentTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = currentTheme === 'dark';

  const tankBorderColor = isDark
    ? 'rgba(255,255,255,0.4)'
    : 'rgba(0,0,0,0.2)';

  const liquidColor = isDark ? '#4A90D9' : '#2E78C7'; // Nice blue liquid
  const liquidHighlight = isDark ? '#6BA3E0' : '#5A9AD8';

  // Clamp progress
  const p = Math.min(1, Math.max(0, progress));

  // Tank dimensions in viewBox (100x100)
  const tankLeft = 15;
  const tankRight = 85;
  const tankTop = 10;
  const tankBottom = 90;
  const tankHeight = tankBottom - tankTop;

  // Liquid level - starts full (at top), drains to empty (at bottom)
  // At p=0: liquid at tankTop (full)
  // At p=1: liquid at tankBottom (empty)
  const liquidTopY = tankTop + (tankHeight * p);

  // Very subtle wave for smooth appearance
  const waveAmplitude = 0.3; // Barely visible meniscus
  
  // Generate smooth liquid path
  const generateLiquidPath = () => {
    if (p >= 0.99) return ''; // Empty tank
    
    // Inset the liquid slightly so it doesn't overlap the border
    const inset = 2;
    const liqLeft = tankLeft + inset;
    const liqRight = tankRight - inset;
    
    // Simple smooth curve using quadratic bezier
    // Just a gentle dip in the middle for a subtle meniscus effect
    const midX = (liqLeft + liqRight) / 2;
    const dip = waveAmplitude;
    
    return `
      M ${liqLeft} ${liquidTopY}
      Q ${midX} ${liquidTopY + dip} ${liqRight} ${liquidTopY}
      L ${liqRight} ${tankBottom - 5 - inset}
      Q ${liqRight} ${tankBottom - inset} ${liqRight - 3} ${tankBottom - inset}
      L ${liqLeft + 3} ${tankBottom - inset}
      Q ${liqLeft} ${tankBottom - inset} ${liqLeft} ${tankBottom - 5 - inset}
      Z
    `;
  };

  // Tank outline - open top (U-shape), only sides and bottom
  const tankOutline = `
    M ${tankLeft} ${tankTop}
    L ${tankLeft} ${tankBottom - 5}
    Q ${tankLeft} ${tankBottom} ${tankLeft + 5} ${tankBottom}
    L ${tankRight - 5} ${tankBottom}
    Q ${tankRight} ${tankBottom} ${tankRight} ${tankBottom - 5}
    L ${tankRight} ${tankTop}
  `;

  const liquidPath = generateLiquidPath();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="liquidGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={liquidColor} />
            <Stop offset="0.5" stopColor={liquidHighlight} />
            <Stop offset="1" stopColor={liquidColor} />
          </LinearGradient>
          <LinearGradient id="tankGlassGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop
              offset="0"
              stopColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)'}
            />
            <Stop
              offset="1"
              stopColor={isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.2)'}
            />
          </LinearGradient>
        </Defs>

        {/* Liquid fill */}
        {liquidPath && (
          <Path
            d={liquidPath}
            fill="url(#liquidGradient)"
          />
        )}

        {/* Tank border - U shape (open top) */}
        <Path
          d={tankOutline}
          fill="none"
          stroke={tankBorderColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
