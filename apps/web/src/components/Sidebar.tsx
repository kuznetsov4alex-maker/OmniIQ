'use client';

import type { Company } from '@/lib/api';

const tabs = [
  { id: 'overview',        icon: '◉', label: 'Overview' },
  { id: 'recommendations', icon: '🎯', label: 'Recommendations' },
  { id: 'signals',         icon: '📡', label: 'Signals' },
  { id: 'knowledge',       icon: '🧠', label: 'Knowledge' },
];

interface Props {
  company: Company;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSwitch: () => void;
  pendingCount: number;
}

export default function Sidebar({ company, activeTab, onTabChange, onSwitch, pendingCount }: Props) {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-text">OmniIQ</div>
        <div className="logo-tag">Visibility Intelligence</div>
      </div>

      <div className="nav-section">
        <div className="nav-label">Company</div>
        <button className="nav-item" onClick={onSwitch} title="Switch company">
          <span className="nav-icon">🏢</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {company.name}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>↕</span>
        </button>

        <div className="nav-label" style={{ marginTop: 16 }}>Navigation</div>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`nav-item ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            <span className="nav-icon">{t.icon}</span>
            <span style={{ flex: 1 }}>{t.label}</span>
            {t.id === 'recommendations' && pendingCount > 0 && (
              <span style={{
                background: 'var(--accent)',
                color: 'white',
                fontSize: 11,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 99,
                minWidth: 18,
                textAlign: 'center',
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {company.domain && <div>🌐 {company.domain}</div>}
          <div style={{ marginTop: 4 }}>v0.4.0 · dev mode</div>
        </div>
      </div>
    </nav>
  );
}
