import {
    eachDayOfInterval,
    endOfDay,
    format,
    isSameDay,
    startOfDay,
    subDays,
} from 'date-fns';
import React, { useMemo, useState } from 'react';
import {
    LayoutChangeEvent,
    Pressable,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { useThemeStore } from '../store/themeStore';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface FocusHistoryGraphProps {
  history?: number[];
}

type TimeRange = '1D' | '7D' | '30D';
const POMODORO_DURATION = 25; // Minutes

export const FocusHistoryGraph: React.FC<FocusHistoryGraphProps> = ({
  history = [],
}) => {
  const [range, setRange] = useState<TimeRange>('7D');
  const [graphWidth, setGraphWidth] = useState(0);
  const systemColorScheme = useColorScheme();
  const theme = useThemeStore((state) => state.theme);
  const currentTheme = theme === 'system' ? systemColorScheme : theme;
  const isDark = currentTheme === 'dark';

  const data = useMemo(() => {
    const now = new Date();
    const today = endOfDay(now);
    let labels: string[] = [];
    let values: number[] = [];

    if (range === '1D') {
        // 1D Logic: Hourly buckets (0-23)
        const start = startOfDay(now);
        // Show labels every 6 hours: 0h, 6h, 12h, 18h
        labels = Array.from({ length: 24 }, (_, i) => (i % 6 === 0 ? `${i}h` : ''));
        values = Array.from({ length: 24 }, (_, i) => {
             const count = history.filter(ts => {
                 const d = new Date(ts);
                 return isSameDay(d, now) && d.getHours() === i;
             }).length;
             return count * POMODORO_DURATION;
        });
    } else {
      // 7D and 30D Logic: Daily bars
      const days = range === '7D' ? 7 : 30;
      const startDate = subDays(today, days - 1);
      const interval = eachDayOfInterval({ start: startDate, end: today });

      labels = interval.map((date) => format(date, range === '7D' ? 'EEE' : 'd'));
      values = interval.map((date) => {
        const count = history.filter((timestamp) =>
          isSameDay(timestamp, date)
        ).length;
        return count * POMODORO_DURATION;
      });
    }

    return { labels, values };
  }, [history, range]);

  const maxValMinutes = Math.max(...data.values, 60);
  const maxValHours = maxValMinutes / 60; 

  const onLayout = (event: LayoutChangeEvent) => {
    setGraphWidth(event.nativeEvent.layout.width);
  };

  const GRAPH_HEIGHT = 150;
  const AXIS_COLOR = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const LABEL_COLOR = isDark ? '#8E8E93' : '#8E8E93';
  
  const Y_AXIS_WIDTH = 35; // Space for labels
  const PADDING_TOP = 20;
  const PADDING_BOTTOM = 25; // Space for X labels
  const availableGraphHeight = GRAPH_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const BAR_gap = range === '30D' ? 4 : 8;
  const availableWidth = graphWidth - Y_AXIS_WIDTH - 16; // 16 right padding
  const barWidth = (availableWidth - (data.values.length - 1) * BAR_gap) / data.values.length;

  const formatYLabel = (minutes: number) => {
      const hours = minutes / 60;
      return `${hours.toFixed(1).replace(/\.0$/, '')}h`;
  };

  return (
    <View style={styles.container}>
      {/* Controls */}
      <View style={styles.controls}>
        {(['1D', '7D', '30D'] as TimeRange[]).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRange(r)}
            style={[
              styles.rangeButton,
              range === r && {
                backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA',
              },
            ]}
          >
            <Text
              style={[
                styles.rangeText,
                { color: isDark ? '#FFF' : '#000' },
                range === r && { fontWeight: 'bold' },
              ]}
            >
              {r}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Graph */}
      <View style={styles.graphContainer} onLayout={onLayout}>
        {graphWidth > 0 && (
          <Svg height={GRAPH_HEIGHT} width="100%">
            {/* Y Axes Labels & Grid Lines */}
             <React.Fragment>
                {/* Max Label */}
                <SvgText
                    x={Y_AXIS_WIDTH - 6}
                    y={PADDING_TOP + 4}
                    fontSize="10"
                    fill={LABEL_COLOR}
                    textAnchor="end"
                >
                    {formatYLabel(maxValMinutes)}
                </SvgText>
                {/* Mid Label */}
                <SvgText
                    x={Y_AXIS_WIDTH - 6}
                    y={PADDING_TOP + availableGraphHeight / 2 + 3}
                    fontSize="10"
                    fill={LABEL_COLOR}
                    textAnchor="end"
                >
                    {formatYLabel(maxValMinutes / 2)}
                </SvgText>
                 {/* 0 Label */}
                 <SvgText
                    x={Y_AXIS_WIDTH - 6}
                    y={GRAPH_HEIGHT - PADDING_BOTTOM + 3}
                    fontSize="10"
                    fill={LABEL_COLOR}
                    textAnchor="end"
                >
                    0h
                </SvgText>

                {/* Y Axis Line */}
                <Line
                    x1={Y_AXIS_WIDTH}
                    y1={PADDING_TOP}
                    x2={Y_AXIS_WIDTH}
                    y2={GRAPH_HEIGHT - PADDING_BOTTOM}
                    stroke={AXIS_COLOR}
                    strokeWidth="1"
                />

                {/* X Axis Line */}
                <Line
                    x1={Y_AXIS_WIDTH}
                    y1={GRAPH_HEIGHT - PADDING_BOTTOM}
                    x2={graphWidth}
                    y2={GRAPH_HEIGHT - PADDING_BOTTOM}
                    stroke={AXIS_COLOR}
                    strokeWidth="1"
                />
             </React.Fragment>

            {data.values.map((val, index) => {
              const x = Y_AXIS_WIDTH + index * (barWidth + BAR_gap);
              const height = (val / maxValMinutes) * availableGraphHeight;
              const y = GRAPH_HEIGHT - PADDING_BOTTOM - height;
              
              return (
                <React.Fragment key={index}>
                    <Rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={height}
                        fill={isDark ? '#0A84FF' : '#007AFF'}
                        rx={0}
                    />
                    {/* Optional Label for 7D/30D every N items */}
                    {(range === '7D' || (range === '30D' && index % 5 === 0) || (range === '1D' && index % 6 === 0)) && (
                         <SvgText
                            x={x + barWidth / 2}
                            y={GRAPH_HEIGHT - 5}
                            fontSize="10"
                            fill={LABEL_COLOR}
                            textAnchor="middle"
                         >
                             {data.labels[index]}
                         </SvgText>
                    )}
                </React.Fragment>
              );
            })}
          </Svg>
        )}
      </View>
      <Text style={[styles.unitText, { color: isDark ? '#8E8E93' : '#8E8E93'}]}>
          Hours focused
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    borderRadius: 8,
    padding: 2,
    alignSelf: 'center',
  },
  rangeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  rangeText: {
    fontSize: 13,
  },
  graphContainer: {
    height: 160,
    width: '100%',
  },
  unitText: {
      fontSize: 12,
      textAlign: 'center',
      marginTop: -10,
      marginBottom: 20,
  }
});
