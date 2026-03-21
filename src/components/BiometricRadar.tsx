'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export interface RadarData {
  stat: string;
  value: number;
  fullMark: number;
}

export default function BiometricRadar({ data }: { data: RadarData[] }) {
  return (
    <div className="glass-panel" style={{ padding: '20px', height: '300px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginBottom: '10px', textAlign: 'center', fontSize: '1rem' }}>Biometric Radar (7D)</h3>
      <div style={{ flex: 1, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis 
              dataKey="stat" 
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={false} 
              axisLine={false} 
            />
            <Radar
              name="Stats"
              dataKey="value"
              stroke="var(--accent-cyan)"
              fill="var(--accent-cyan)"
              fillOpacity={0.3}
              isAnimationActive={true}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
