'use client';

import { useState } from 'react';
import { Activity, Dumbbell, BrainCircuit, Users } from 'lucide-react';

export default function InputPage() {
  const [activeTab, setActiveTab] = useState<'health' | 'training' | 'knowledge' | 'social'>('health');

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      <h1 className="text-gradient-cyan" style={{ fontSize: '1.8rem', marginBottom: '5px' }}>Daily Input</h1>
      <p className="text-sub" style={{ marginBottom: '20px' }}>Log your progress to gain XP.</p>

      {/* Tabs */}
      <div className="glass-panel flex-between" style={{ padding: '10px', marginBottom: '20px', borderRadius: '15px' }}>
        <button 
          className={`glass-btn ${activeTab === 'health' ? 'primary' : ''}`}
          style={{ flex: 1, padding: '10px', fontSize: '0.8rem', textAlign: 'center' }}
          onClick={() => setActiveTab('health')}
        >
          <Activity size={18} style={{ margin: '0 auto 5px' }} />
          Health
        </button>
        <button 
          className={`glass-btn ${activeTab === 'training' ? 'primary' : ''}`}
          style={{ flex: 1, padding: '10px', fontSize: '0.8rem', textAlign: 'center', marginLeft: '5px' }}
          onClick={() => setActiveTab('training')}
        >
          <Dumbbell size={18} style={{ margin: '0 auto 5px' }} />
          Train
        </button>
        <button 
          className={`glass-btn ${activeTab === 'knowledge' ? 'primary' : ''}`}
          style={{ flex: 1, padding: '10px', fontSize: '0.8rem', textAlign: 'center', marginLeft: '5px' }}
          onClick={() => setActiveTab('knowledge')}
        >
          <BrainCircuit size={18} style={{ margin: '0 auto 5px' }} />
          Mind
        </button>
        <button 
          className={`glass-btn ${activeTab === 'social' ? 'primary' : ''}`}
          style={{ flex: 1, padding: '10px', fontSize: '0.8rem', textAlign: 'center', marginLeft: '5px' }}
          onClick={() => setActiveTab('social')}
        >
          <Users size={18} style={{ margin: '0 auto 5px' }} />
          Social
        </button>
      </div>

      {/* Forms based on activeTab */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {activeTab === 'health' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--stat-vit)' }}>Vitality Logs</h2>
            <div style={{ marginBottom: '15px' }}>
              <label className="text-sub" style={{ display: 'block', marginBottom: '5px' }}>Sleep (Hours)</label>
              <input type="number" className="glass-input" placeholder="e.g. 7.5" step="0.5" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label className="text-sub" style={{ display: 'block', marginBottom: '5px' }}>Water (ml)</label>
              <input type="number" className="glass-input" placeholder="e.g. 2500" step="100" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label className="text-sub" style={{ display: 'block', marginBottom: '5px' }}>Weight (kg)</label>
              <input type="number" className="glass-input" placeholder="e.g. 75.2" step="0.1" />
            </div>
            <button className="glass-btn primary" style={{ width: '100%', marginTop: '10px' }}>Save Health Data</button>
          </div>
        )}

        {activeTab === 'training' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--stat-str)' }}>Strength Training</h2>
            <div style={{ marginBottom: '15px' }}>
              <label className="text-sub" style={{ display: 'block', marginBottom: '5px' }}>Program / Muscle Group</label>
              <input type="text" className="glass-input" placeholder="e.g. Push Day" />
            </div>
            <p className="text-sub" style={{ marginBottom: '10px' }}>Exercises</p>
            <div className="glass-panel" style={{ padding: '10px', marginBottom: '15px', background: 'rgba(0,0,0,0.2)' }}>
              <input type="text" className="glass-input" placeholder="Exercise Name" style={{ marginBottom: '10px' }} />
              <div className="grid-2">
                <input type="number" className="glass-input" placeholder="Sets" />
                <input type="number" className="glass-input" placeholder="Reps" />
              </div>
              <input type="number" className="glass-input" placeholder="Weight (kg)" style={{ marginTop: '10px' }} />
            </div>
            <button className="glass-btn" style={{ width: '100%', marginBottom: '10px', borderStyle: 'dashed' }}>+ Add Exercise</button>
            <button className="glass-btn primary" style={{ width: '100%' }}>Complete Session</button>
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--stat-foc)' }}>Focus & Art</h2>
            <div style={{ marginBottom: '15px' }}>
              <label className="text-sub" style={{ display: 'block', marginBottom: '5px' }}>Deep Work (Minutes)</label>
              <input type="number" className="glass-input" placeholder="e.g. 120" step="10" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label className="text-sub" style={{ display: 'block', marginBottom: '5px' }}>Tasks Completed</label>
              <input type="number" className="glass-input" placeholder="e.g. 5" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label className="text-sub" style={{ display: 'block', marginBottom: '5px' }}>Pages Read</label>
              <input type="number" className="glass-input" placeholder="e.g. 30" />
            </div>
            <button className="glass-btn primary" style={{ width: '100%', marginTop: '10px' }}>Log Mind Stats</button>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.2rem', marginBottom: '15px', color: 'var(--stat-soc)' }}>Social & Discipline</h2>
            <div style={{ marginBottom: '15px' }}>
              <label className="text-sub" style={{ display: 'block', marginBottom: '5px' }}>Socializing (Minutes)</label>
              <input type="number" className="glass-input" placeholder="e.g. 60" step="10" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label className="text-sub" style={{ display: 'block', marginBottom: '5px' }}>New People Met</label>
              <input type="number" className="glass-input" placeholder="e.g. 1" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label className="text-sub" style={{ display: 'block', marginBottom: '5px' }}>Daily Routine Completed (%)</label>
              <input type="number" className="glass-input" placeholder="e.g. 100" step="10" max="100" />
            </div>
            <button className="glass-btn primary" style={{ width: '100%', marginTop: '10px' }}>Log Social Stats</button>
          </div>
        )}
      </div>
    </div>
  );
}
