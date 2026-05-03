import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polygon, Circle, Line } from 'react-native-svg';
import { useTheme } from '../lib/ThemeContext';

export type PentagonStats = { vit: number; str: number; foc: number; soc: number; dis: number };

// Vertex order: top, top-right, bottom-right, bottom-left, top-left
const STAT_ORDER: (keyof PentagonStats)[] = ['vit', 'str', 'dis', 'soc', 'foc'];
const LABELS = ['VIT', 'STR', 'DIS', 'SOC', 'FOC'];

function pentagonPoints(cx: number, cy: number, r: number): [number, number][] {
  return Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });
}

function toSvgPoints(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

interface Props {
  stats: PentagonStats;
  levels?: { vit: number; str: number; foc: number; soc: number; dis: number };
  size?: number;
}

export default function PentagonChart({ stats, levels, size = 240 }: Props) {
  const { colors } = useTheme();
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const labelR = r + 22;

  const gridLevels = [0.33, 0.66, 1.0];

  const statPts = STAT_ORDER.map((stat, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const ratio = Math.min((stats[stat] ?? 0) / 100, 1);
    return [cx + r * ratio * Math.cos(a), cy + r * ratio * Math.sin(a)] as [number, number];
  });

  const fullPts = pentagonPoints(cx, cy, r);

  const STAT_COLORS: Record<keyof PentagonStats, string> = {
    vit: colors.vit, str: colors.str, dis: colors.dis, soc: colors.soc, foc: colors.foc,
  };

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size}>
        {gridLevels.map((lvl, gi) => (
          <Polygon
            key={gi}
            points={toSvgPoints(pentagonPoints(cx, cy, r * lvl))}
            fill="none"
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}

        {fullPts.map(([x, y], i) => (
          <Line key={i} x1={cx} y1={cy} x2={x} y2={y}
            stroke={colors.border} strokeWidth={1} />
        ))}

        <Polygon
          points={toSvgPoints(statPts)}
          fill={colors.accent + '28'}
          stroke={colors.accent}
          strokeWidth={1.5}
        />

        {statPts.map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={4}
            fill={STAT_COLORS[STAT_ORDER[i]]}
            stroke={colors.bg}
            strokeWidth={1.5}
          />
        ))}
      </Svg>

      {fullPts.map(([vx, vy], i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const lx = cx + labelR * Math.cos(a);
        const ly = cy + labelR * Math.sin(a);
        const stat = STAT_ORDER[i];
        const lvl = levels?.[stat];
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: lx - 22,
              top: ly - 12,
              width: 44,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: STAT_COLORS[stat], letterSpacing: 0.5 }}>
              {LABELS[i]}{lvl ? ` ${lvl}` : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
