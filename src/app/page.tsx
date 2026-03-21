'use client';

import { Activity, Dumbbell, BrainCircuit, Palette, Users, ClipboardCheck } from 'lucide-react';
import LevelBar from '@/components/LevelBar';
import StatCard from '@/components/StatCard';
import BiometricRadar, { RadarData } from '@/components/BiometricRadar';

// Placeholder actual data until DB is fully connected
const mockRadarData: RadarData[] = [
  { stat: 'VIT', value: 85, fullMark: 100 },
  { stat: 'STR', value: 65, fullMark: 100 },
  { stat: 'FOC', value: 90, fullMark: 100 },
  { stat: 'ART', value: 40, fullMark: 100 },
  { stat: 'SOC', value: 70, fullMark: 100 },
  { stat: 'DIS', value: 80, fullMark: 100 },
];

export default function DashboardPage() {
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 className="text-gradient-cyan" style={{ fontSize: '1.8rem' }}>Dashboard</h1>
        <p className="text-sub">Overview of your true stats.</p>
      </div>

      <LevelBar level={12} currentXp={450} requiredXp={1000} />

      <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Core Attributes</h2>
      <div className="grid-2" style={{ marginBottom: '20px' }}>
        <StatCard title="VIT" value={85} icon={Activity} colorVar="--stat-vit" />
        <StatCard title="STR" value={65} icon={Dumbbell} colorVar="--stat-str" />
        <StatCard title="FOC" value={90} icon={BrainCircuit} colorVar="--stat-foc" />
        <StatCard title="ART" value={40} icon={Palette} colorVar="--stat-art" />
        <StatCard title="SOC" value={70} icon={Users} colorVar="--stat-soc" />
        <StatCard title="DIS" value={80} icon={ClipboardCheck} colorVar="--stat-dis" />
      </div>

      <BiometricRadar data={mockRadarData} />
      
      <div className="glass-panel" style={{ marginTop: '20px', padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Goal Completion</h3>
        <p className="text-sub">78% of weekly targets achieved.</p>
        <div style={{ marginTop: '10px' }}>
          <button className="glass-btn primary" style={{ width: '100%' }}>Log Activity</button>
        </div>
      </div>
    </div>
  );
}
