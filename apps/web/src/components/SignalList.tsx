'use client';

import { useState } from 'react';
import { api, type Signal } from '@/lib/api';

interface Props {
  signals: Signal[];
  loading: boolean;
  companyId: string;
  onAiSignalAdded: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

function signalDot(value: number) {
  if (value >= 0.7) return 'dot-good';
  if (value >= 0.3) return 'dot-mid';
  return 'dot-bad';
}

const AI_CHANNELS = ['alisa', 'gigachat', 'yandexgpt', 'marusia', 'chatgpt', 'other'];
const AI_METRICS = ['mentioned', 'accurate', 'recommended', 'positive_sentiment'];

const AI_CHANNEL_LABELS: Record<string, string> = {
  alisa: 'Алиса (Яндекс)',
  gigachat: 'GigaChat (Сбер)',
  yandexgpt: 'YandexGPT',
  marusia: 'Маруся (VK)',
  chatgpt: 'ChatGPT',
  other: 'Другой',
};

const AI_METRIC_LABELS: Record<string, string> = {
  mentioned: 'Упоминается',
  accurate: 'Точная информация',
  recommended: 'Рекомендует',
  positive_sentiment: 'Позитивная оценка',
};

const TYPE_LABELS: Record<string, string> = {
  seo: 'Поисковая оптимизация',
  ai: 'ИИ-ассистенты',
  entity: 'Entity / Базы знаний',
  reputation: 'Репутация',
};

export default function SignalList({ signals, loading, companyId, onAiSignalAdded, showToast }: Props) {
  const [showAiForm, setShowAiForm] = useState(false);
  const [channel, setChannel] = useState('chatgpt');
  const [metric, setMetric] = useState('mentioned');
  const [value, setValue] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  const grouped = signals.reduce<Record<string, Signal[]>>((acc, s) => {
    (acc[s.type] = acc[s.type] || []).push(s);
    return acc;
  }, {});

  const handleAddAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.addAiSignal(companyId, { channel, metric, value: parseFloat(value) });
      showToast('AI signal added');
      setShowAiForm(false);
      onAiSignalAdded();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  if (signals.length === 0 && !showAiForm) {
    return (
      <div>
        <div className="empty-state">
          <div className="empty-icon">◎</div>
          <div className="empty-text">Сигналы ещё не собраны. Нажмите «Собрать сигналы» или добавьте ИИ-сигнал вручную.</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button className="btn btn-ghost" onClick={() => setShowAiForm(true)}>+ Добавить ИИ-сигнал вручную</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowAiForm(!showAiForm)}>
          {showAiForm ? '✕ Отмена' : '+ Добавить ИИ-сигнал'}
        </button>
      </div>

      {showAiForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Добавить ИИ-сигнал вручную</div>
          <form onSubmit={handleAddAi}>
            <div className="grid-3" style={{ gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">ИИ-ассистент</label>
                <select className="form-select" value={channel} onChange={e => setChannel(e.target.value)}>
                  {AI_CHANNELS.map(c => <option key={c} value={c}>{AI_CHANNEL_LABELS[c] ?? c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Показатель</label>
                <select className="form-select" value={metric} onChange={e => setMetric(e.target.value)}>
                  {AI_METRICS.map(m => <option key={m} value={m}>{AI_METRIC_LABELS[m] ?? m}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Значение (0–1)</label>
                <input className="form-input" type="number" min="0" max="1" step="0.1" value={value} onChange={e => setValue(e.target.value)} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? <span className="spinner" /> : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      )}

      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} style={{ marginBottom: 24 }}>
          <div className="card-title" style={{ marginBottom: 10 }}>{TYPE_LABELS[type] ?? type.toUpperCase()}</div>
          {items.map(s => (
            <div key={s.id} className="signal-item">
              <div className={`signal-dot ${signalDot(s.value)}`} />
              <div className="signal-info">
                <div className="signal-metric">{s.metric.replace(/_/g, ' ')}</div>
                <div className="signal-channel">{s.channel} · {new Date(s.collected_at).toLocaleDateString('ru-RU')}</div>
              </div>
              <div className="signal-value">{(s.value * 100).toFixed(0)}%</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
