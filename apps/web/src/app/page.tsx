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
      <div className="setup-card animate-fade-up">
        {/* SVG Логотип OmniIQ */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="16" y1="17" x2="22" y2="8"  stroke="rgba(255,255,255,0.2)"  strokeWidth="0.9" strokeLinecap="round"/>
              <line x1="16" y1="17" x2="26" y2="22" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" strokeLinecap="round"/>
              <line x1="16" y1="17" x2="11" y2="27" stroke="rgba(255,255,255,0.2)"  strokeWidth="0.9" strokeLinecap="round"/>
              <line x1="16" y1="17" x2="7"  y2="13" stroke="rgba(255,255,255,0.12)" strokeWidth="0.7" strokeLinecap="round"/>
              <line x1="22" y1="8"  x2="26" y2="22" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" strokeLinecap="round"/>
              <circle cx="7"  cy="13" r="1.2" fill="rgba(255,255,255,0.3)"/>
              <circle cx="26" cy="22" r="1.8" fill="#22d3ee"/>
              <circle cx="11" cy="27" r="1.7" fill="#10b981"/>
              <circle cx="22" cy="8"  r="1.8" fill="#818cf8"/>
              <circle cx="16" cy="17" r="4.5" fill="rgba(99,102,241,0.2)"/>
              <circle cx="16" cy="17" r="3"   fill="#6366f1"/>
            </svg>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 800, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              OmniIQ
            </span>
          </div>
        </div>

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
            <div style={{ marginBottom: 16, maxHeight: 200, overflowY: 'auto', paddingRight: 4 }}>
              {companies.map(c => (
                <button key={c.id} className="btn btn-ghost" style={{ width: '100%', marginBottom: 8, justifyContent: 'flex-start' }} onClick={() => setSelected(c)}>
                  <span>◈</span>
                  <span style={{ flex: 1, textAlign: 'left', marginLeft: 8 }}>{c.name}</span>
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
          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: 12 }} disabled={creating}>
            {creating ? <span className="spinner" /> : '→'}
            {creating ? 'Создаём проект…' : 'Узнать Индекс видимости →'}
          </button>
        </form>

        {/* Кнопка пропуска для тех, у кого уже есть аккаунт или кто хочет протестировать */}
        <button
          type="button"
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center', fontSize: 13, marginTop: 4 }}
          onClick={async () => {
            if (companies.length > 0) {
              setSelected(companies[0]);
            } else {
              setCreating(true);
              try {
                const c = await api.createCompany({ name: 'Мой первый проект', domain: 'example.com' });
                setSelected(c);
              } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Ошибка быстрого старта.');
              } finally {
                setCreating(false);
              }
            }
          }}
          disabled={creating}
        >
          {creating ? 'Входим...' : 'Пропустить этот этап'}
        </button>
      </div>
    </div>
  );
}
