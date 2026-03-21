'use client';

import { useState } from 'react';
import { Target, Save } from 'lucide-react';

export default function SettingsPage() {
  const [goals, setGoals] = useState({
    dailyFocusMins: 120,
    weeklyGymWorkouts: 4,
    dailyWaterMl: 2500,
    dailySleepHours: 8,
    dailySteps: 10000
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGoals({ ...goals, [e.target.name]: Number(e.target.value) });
  };

  const handleSave = () => {
    // In actual implementation, save to Dexie DB
    alert('Goals Saved Successfully!');
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <h1 className="text-gradient-cyan" style={{ fontSize: '1.8rem', marginBottom: '5px' }}>Settings</h1>
      <p className="text-sub" style={{ marginBottom: '20px' }}>Configure your goals to normalize stat growth.</p>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Target size={20} className="text-gradient-cyan" />
          <h2 style={{ fontSize: '1.2rem' }}>Personal Targets</h2>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label className="text-sub" style={{ display: 'block', marginBottom: '5px' }}>Daily Focus (Minutes)</label>
          <input 
            type="number" 
            name="dailyFocusMins"
            className="glass-input" 
            value={goals.dailyFocusMins} 
            onChange={handleChange}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label className="text-sub" style={{ display: 'block', marginBottom: '5px' }}>Weekly Gym Workouts</label>
          <input 
            type="number" 
            name="weeklyGymWorkouts"
            className="glass-input" 
            value={goals.weeklyGymWorkouts} 
            onChange={handleChange}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label className="text-sub" style={{ display: 'block', marginBottom: '5px' }}>Daily Water Goal (ml)</label>
          <input 
            type="number" 
            name="dailyWaterMl"
            className="glass-input" 
            step="100"
            value={goals.dailyWaterMl} 
            onChange={handleChange}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label className="text-sub" style={{ display: 'block', marginBottom: '5px' }}>Daily Sleep Target (Hours)</label>
          <input 
            type="number" 
            name="dailySleepHours"
            className="glass-input" 
            step="0.5"
            value={goals.dailySleepHours} 
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label className="text-sub" style={{ display: 'block', marginBottom: '5px' }}>Daily Steps</label>
          <input 
            type="number" 
            name="dailySteps"
            className="glass-input" 
            step="500"
            value={goals.dailySteps} 
            onChange={handleChange}
          />
        </div>

        <button 
          className="glass-btn primary" 
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          onClick={handleSave}
        >
          <Save size={18} />
          Save Objectives
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '20px', marginTop: '20px', backgroundColor: 'rgba(255, 0, 85, 0.05)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#ff2a55' }}>Danger Zone</h2>
        <p className="text-sub" style={{ marginBottom: '15px' }}>Clear all local data and reset your progress. This action cannot be undone.</p>
        <button 
          className="glass-btn" 
          style={{ width: '100%', borderColor: '#ff2a55', color: '#ff2a55' }}
        >
          Wipe Progress Data
        </button>
      </div>
    </div>
  );
}
