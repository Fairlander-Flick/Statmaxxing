export default function LevelBar({ level, currentXp, requiredXp }: { level: number, currentXp: number, requiredXp: number }) {
  const progressPercent = Math.min(100, (currentXp / requiredXp) * 100);

  return (
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
      <div className="flex-between" style={{ marginBottom: '10px' }}>
        <div>
          <span className="text-sub">Lvl</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, marginLeft: '5px' }}>{level}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="text-gradient-cyan" style={{ fontWeight: 600 }}>{Math.floor(currentXp)}</span>
          <span className="text-sub"> / {requiredXp} XP</span>
        </div>
      </div>
      
      {/* Progress Bar Container */}
      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
        <div 
          style={{ 
            height: '100%', 
            width: `${progressPercent}%`, 
            background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))',
            boxShadow: '0 0 10px var(--accent-cyan-glow)',
            transition: 'width 0.5s ease'
          }}
        />
      </div>
    </div>
  );
}
