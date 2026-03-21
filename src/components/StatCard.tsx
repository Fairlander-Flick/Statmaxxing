import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number; // typically 1-100 or progress percentage
  icon: LucideIcon;
  colorVar: string;
}

export default function StatCard({ title, value, icon: Icon, colorVar }: StatCardProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className="glass-panel" style={{ padding: '15px', position: 'relative', overflow: 'hidden' }}>
      <div className="flex-between" style={{ marginBottom: '10px', zIndex: 2, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon size={18} style={{ color: `var(${colorVar})` }} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{title}</span>
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{safeValue.toFixed(0)}</span>
      </div>
      
      {/* Background soft glow / line */}
      <div style={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        height: '3px', 
        width: `${safeValue}%`,
        backgroundColor: `var(${colorVar})`,
        boxShadow: `0 -2px 10px var(${colorVar})`,
        transition: 'width 0.5s ease',
        zIndex: 1
      }} />
    </div>
  );
}
