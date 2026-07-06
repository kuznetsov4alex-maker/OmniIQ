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
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении. Попробуйте ещё раз.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="setup-wrap">
      <div className="setup-card">
        <div className="setup-logo">OmniIQ</div>
        <div className="setup-title">
          {companies.length > 0 ? 'Выберите проект или добавьте новый' : 'Добро пожаловать в OmniIQ'}
        </div>
        <div className="setup-subtitle">
          {companies.length > 0
            ? 'Чего ждёт ваш следующий проект?'
            : 'Первая в России платформа, которая автоматически управляет видимостью бизнеса в Яндексе, Алисе и GigaChat'}
        </div>

        {companies.length > 0 && (
          <>
            <div style={{ marginBottom: 16 }}>
              {companies.map(c => (
                <button key={c.id} className="btn btn-ghost" style={{ width: '100%', marginBottom: 8, justifyContent: 'flex-start' }} onClick={() => setSelected(c)}>
                  <span>◈</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{c.name}</span>
                  {c.domain && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.domain}</span>}
                </button>
              ))}
            </div>
            <div className="divider" />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 16 }}>или добавьте новый</div>
          </>
        )}

        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Название компании *</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Например: Клиника Смайл" required />
          </div>
          <div className="form-group">
            <label className="form-label">Домен сайта</label>
            <input className="form-input" value={domain} onChange={e => setDomain(e.target.value)} placeholder="klinika-smail.ru" />
          </div>
          {error && <div style={{ color: 'var(--rose)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={creating}>
            {creating ? <span className="spinner" /> : '→'}
            {creating ? 'Создаём проект…' : 'Узнать Индекс видимости →'}
          </button>
        </form>
      </div>
    </div>
  );
}
