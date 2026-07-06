'use client';

import { useEffect, useState } from 'react';
import { api, type Company } from '@/lib/api';
import Dashboard from './dashboard/page';

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [selected, setSelected] = useState<Company | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listCompanies()
      .then(r => {
        setCompanies(r.items);
        if (r.items.length > 0) setSelected(r.items[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="setup-wrap">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (selected) {
    return <Dashboard company={selected} onSwitch={() => setSelected(null)} />;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    try {
      const c = await api.createCompany({ name: name.trim(), domain: domain.trim() || undefined });
      setSelected(c);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="setup-wrap">
      <div className="setup-card">
        <div className="setup-logo">OmniIQ</div>
        <div className="setup-title">
          {companies.length > 0 ? 'Select or Add Company' : 'Welcome to OmniIQ'}
        </div>
        <div className="setup-subtitle">
          Autonomous Visibility Management — know what AI knows about your business
        </div>

        {companies.length > 0 && (
          <>
            <div style={{ marginBottom: 16 }}>
              {companies.map(c => (
                <button key={c.id} className="btn btn-ghost" style={{ width: '100%', marginBottom: 8, justifyContent: 'flex-start' }} onClick={() => setSelected(c)}>
                  <span>🏢</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{c.name}</span>
                  {c.domain && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.domain}</span>}
                </button>
              ))}
            </div>
            <div className="divider" />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 16 }}>or add a new one</div>
          </>
        )}

        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Company name *</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Acme Corp" required />
          </div>
          <div className="form-group">
            <label className="form-label">Website domain</label>
            <input className="form-input" value={domain} onChange={e => setDomain(e.target.value)} placeholder="acme.com" />
          </div>
          {error && <div style={{ color: 'var(--rose)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={creating}>
            {creating ? <span className="spinner" /> : '→'}
            {creating ? 'Creating…' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  );
}
