/**
 * LiquidTank Component
 * 
 * A visual timer indicator that displays time remaining as draining liquid.
 * Uses SVG for smooth, resolution-independent rendering.
 * 
 * Visual Design:
 * - U-shaped tank (open at top) with rounded bottom corners
 * - Liquid fills from bottom, drains as timer progresses
 * - Subtle meniscus effect using quadratic bezier curves
 * - Gradient fill for depth/lighting effect
 * 
 * Coordinate System:
 * - ViewBox is 100x100 units for easy percentage-based calculations
 * - Tank occupies roughly 70% of width (15-85) and 80% of height (10-90)
 * 
 * @module LiquidTank
 */

import React from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useThemeStore } from '../store/themeStore';

interface LiquidTankProps {
  /** Progress value from 0 (full/start) to 1 (empty/complete) */
  progress: number;
  /** Tank size in pixels (width and height) */
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

  // Clamp progress to valid range [0, 1]
  const p = Math.min(1, Math.max(0, progress));

  /**
   * Tank Coordinate System (in viewBox units, 100x100)
   * 
   *        tankLeft(15)              tankRight(85)
   *             │                         │
   *    tankTop(10) ─┼─────────────────────────┼─ (open top, no line)
   *             │                         │
   *             │      ▓▓▓▓▓▓▓▓▓▓▓        │  ← liquidTopY (varies with progress)
   *             │      ▓ LIQUID  ▓        │
   *             │      ▓▓▓▓▓▓▓▓▓▓▓        │
   *             │                         │
   * tankBottom(90)─┼───────────╮     ╭──────┼─ (rounded corners)
   *                          ╰─────╯
   */
  const tankLeft = 15;
  const tankRight = 85;
  const tankTop = 10;
  const tankBottom = 90;
  const tankHeight = tankBottom - tankTop;

  /**
   * Liquid Level Calculation
   * 
   * The liquid top position interpolates between:
   * - p=0: liquidTopY = tankTop (10) → tank is full
   * - p=1: liquidTopY = tankBottom (90) → tank is empty
   */
  const liquidTopY = tankTop + (tankHeight * p);

  // Very subtle wave for smooth appearance
  const waveAmplitude = 0.3; // Barely visible meniscus
  
  /**
   * Generate SVG Path for Liquid Fill
   * 
   * Creates a closed path that represents the liquid inside the tank.
   * Uses quadratic bezier curves (Q command) for:
   * - Subtle meniscus effect at the top of the liquid
   * - Rounded corners at the bottom matching tank shape
   * 
   * Path Construction:
   * 1. Start at top-left of liquid (M)
   * 2. Draw curved top edge with meniscus (Q) to top-right
   * 3. Draw straight line down right side (L)
   * 4. Draw bottom-right rounded corner (Q)
   * 5. Draw straight bottom edge (L)
   * 6. Draw bottom-left rounded corner (Q)
   * 7. Close path back to start (Z)
   * 
   * @returns SVG path string or empty string if tank is empty
   */
  const generateLiquidPath = () => {
    // Skip rendering when tank is essentially empty
    if (p >= 0.99) return '';
    
    // Inset liquid from tank walls to prevent overlap with border stroke
    const inset = 2;
    const liqLeft = tankLeft + inset;
    const liqRight = tankRight - inset;
    
    // Calculate midpoint for meniscus curve control point
    const midX = (liqLeft + liqRight) / 2;
    const dip = waveAmplitude; // Subtle downward curve in middle
    
    /**
     * SVG Path Commands Used:
     * M = Move to (start point)
     * Q = Quadratic bezier curve (control point, end point)
     * L = Line to (straight line)
     * Z = Close path (back to start)
     */
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

  /**
   * Tank Outline Path (U-Shape)
   * 
   * Draws only the sides and bottom of the tank, leaving the top open.
   * This creates the "container" visual with rounded bottom corners.
   * 
   * Path traces:
   * 1. Left side: top → bottom-left corner
   * 2. Bottom-left rounded corner
   * 3. Bottom edge
   * 4. Bottom-right rounded corner
   * 5. Right side: bottom-right corner → top
   * 
   * Note: Path is not closed (no Z command) to keep top open
   */
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
