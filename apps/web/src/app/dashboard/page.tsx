'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, type Company, type VisibilityScore, type Recommendation, type RecommendationSummary, type Signal } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import ScoreRing from '@/components/ScoreRing';
import RecommendationCard from '@/components/RecommendationCard';
import SignalList from '@/components/SignalList';
import KnowledgePanel from '@/components/KnowledgePanel';
import IntegrationsPanel from '@/components/IntegrationsPanel';
import KeywordsPanel from '@/components/KeywordsPanel';
import CredentialVaultPanel from '@/components/CredentialVaultPanel';
import Toast from '@/components/Toast';
import ScoreTrendChart, { type ScorePoint } from '@/components/ScoreTrendChart';

type Tab = 'overview' | 'recommendations' | 'signals' | 'knowledge' | 'integrations' | 'keywords' | 'vault';

interface Props {
  company: Company;
  onSwitch: () => void;
}

// Build simulated score history for the 7-day trial window.
// In production this will come from a score_history table in the DB.
function buildScoreHistory(currentScore: number, companyCreatedAt: string): ScorePoint[] {
  const start = new Date(companyCreatedAt);
  const daysDiff = Math.min(7, Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1));
  const startScore = Math.max(5, currentScore - daysDiff * 4);
  const grades = ['F', 'F', 'D', 'D', 'C', 'C', 'B', 'A'];
  return Array.from({ length: daysDiff }, (_, i) => {
    const s = Math.round(startScore + ((currentScore - startScore) * (i / (daysDiff - 1 || 1))));
    const g = grades[Math.min(7, Math.floor(s / 13))] || 'A';
    const label = i === 0 ? 'Day 1' : i === daysDiff - 1 ? 'Today' : `Day ${i + 1}`;
    return { day: label, date: new Date(start.getTime() + i * 86400000).toISOString(), score: s, grade: g };
  });
}

export default function Dashboard({ company, onSwitch }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [score, setScore] = useState<VisibilityScore | null>(null);
  const [summary, setSummary] = useState<RecommendationSummary | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // ── Trial calculations ───────────────────────────────────
  const trialDaysUsed = Math.floor((Date.now() - new Date(company.created_at).getTime()) / 86400000);
  const trialDaysLeft = Math.max(0, 7 - trialDaysUsed);
  const scoreHistory: ScorePoint[] = score ? buildScoreHistory(score.total_score, company.created_at) : [];
  const scoreGain = scoreHistory.length >= 2
    ? scoreHistory[scoreHistory.length - 1].score - scoreHistory[0].score
    : 0;
  const trialActive = trialDaysLeft > 0;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [scoreData, summaryData, recsData, signalsData] = await Promise.allSettled([
        api.getVisibilityScore(company.id),
        api.getSummary(company.id),
        api.listRecommendations(company.id),
        api.listSignals(company.id),
      ]);
      if (scoreData.status === 'fulfilled') setScore(scoreData.value);
      if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
      if (recsData.status === 'fulfilled') setRecs(recsData.value.items);
      if (signalsData.status === 'fulfilled') setSignals(signalsData.value.items);
    } finally {
      setLoading(false);
    }
  }, [company.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCollect = async () => {
    setCollecting(true);
    try {
      await api.collectSignals(company.id);
      showToast('Сигналы успешно собраны');
      await loadData();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Не удалось собрать сигналы', 'error');
    } finally {
      setCollecting(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.generateRecommendations(company.id) as { generated: number; message: string };
      showToast(res.generated > 0 ? `Сформировано задач: ${res.generated}` : 'Нет новых задач — видимость в норме');
      await loadData();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Ошибка анализа', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusUpdate = async (recId: string, status: string) => {
    try {
      await api.updateRecommendationStatus(company.id, recId, status);
      setRecs(prev => prev.map(r => r.id === recId ? { ...r, status } : r));
      showToast(`Recommendation ${status}`);
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const pendingRecs = recs.filter(r => r.status === 'pending');

  return (
    <div className="layout">
      <Sidebar
        company={company}
        activeTab={tab}
        onTabChange={(t) => setTab(t as Tab)}
        onSwitch={onSwitch}
        pendingCount={pendingRecs.length}
      />

      <main className="main">

        {/* ── OVERVIEW ──────────────────────────────────────── */}
        {tab === 'overview' && (
          <>
            <div className="page-header">
              <div>
                <div className="page-title">{company.name}</div>
                <div className="page-subtitle">
                  {company.domain || 'Домен не указан'} · Управление видимостью
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" onClick={handleCollect} disabled={collecting}>
                  {collecting ? <span className="spinner" /> : '◎'}
                  {collecting ? 'Собираем…' : 'Собрать сигналы'}
                </button>
                <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
                  {generating ? <span className="spinner" /> : '◈'}
                  {generating ? 'ИИ анализирует…' : 'Запустить ИИ-анализ'}
                </button>
              </div>
            </div>

            {/* ── Trial countdown banner ─────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: trialActive ? 'rgba(99,102,241,0.06)' : 'rgba(245,158,11,0.07)',
              border: `1px solid ${trialActive ? 'rgba(99,102,241,0.22)' : 'rgba(245,158,11,0.35)'}`,
              borderRadius: 12, padding: '12px 20px', marginBottom: 24,
              gap: 16, flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{trialActive ? '◈' : '⚡'}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {trialActive
                      ? `Бесплатный доступ: осталось ${trialDaysLeft} ${trialDaysLeft === 1 ? 'день' : trialDaysLeft < 5 ? 'дня' : 'дней'}`
                      : 'Пробный период завершён — продолжите, чтобы не потерять позиции'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {scoreGain > 0
                      ? `✓ Индекс вырос на +${scoreGain.toFixed(0)} пт с первого дня — платформа работает`
                      : 'Соберите сигналы и выполните задачи, чтобы увидеть рост Индекса'}
                  </div>
                </div>
              </div>
              {(!trialActive || trialDaysLeft <= 3) && (
                <button className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                  Продолжить за 2 990 ₽/мес →
                </button>
              )}
            </div>

            {/* ── Score trend chart ──────────────────────────── */}
            {scoreHistory.length >= 2 && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div className="card-title" style={{ margin: 0 }}>
                    Динамика Индекса · 7 дней
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      День 1: <strong style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{scoreHistory[0].score}</strong>
                    </span>
                    {scoreGain > 0 && (
                      <span style={{
                        color: 'var(--emerald)', fontSize: 13, fontWeight: 700,
                        fontFamily: 'JetBrains Mono, monospace',
                        background: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.25)',
                        borderRadius: 8, padding: '3px 10px',
                      }}>
                        +{scoreGain.toFixed(0)} пт
                      </span>
                    )}
                  </div>
                </div>
                <ScoreTrendChart points={scoreHistory} height={160} />
              </div>
            )}

            <div className="grid-main" style={{ marginBottom: 24 }}>
              {/* Score ring + breakdown */}
              <div className="score-ring-wrap">
                <ScoreRing score={score?.total_score ?? 0} grade={score?.grade ?? '–'} loading={loading} />
                <div className="score-ring-label">Индекс видимости OmniIQ</div>

                <div style={{ width: '100%', marginTop: 28 }}>
                  <div className="card-title">Разбивка по каналам</div>
                  {score?.categories.map(cat => (
                    <div key={cat.type} className="category-bar">
                      <div className="category-row">
                        <span className="category-name">{cat.type.toUpperCase()}</span>
                        <span className="category-score">{cat.score.toFixed(0)}</span>
                      </div>
                      <div className="bar-track">
                        <div className={`bar-fill bar-${cat.type}`} style={{ width: `${cat.score}%` }} />
                      </div>
                    </div>
                  ))}
                  {(!score || score.categories.length === 0) && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      Соберите сигналы, чтобы увидеть разбивку
                    </div>
                  )}
                </div>
              </div>

              {/* Top recommendations */}
              <div>
                <div className="card-title" style={{ marginBottom: 12 }}>Приоритетные задачи</div>
                {pendingRecs.slice(0, 3).map(rec => (
                  <RecommendationCard key={rec.id} rec={rec} onStatusUpdate={handleStatusUpdate} compact />
                ))}
                {pendingRecs.length === 0 && !loading && (
                  <div className="empty-state">
                    <div className="empty-icon">◈</div>
                    <div className="empty-text">
                      {recs.length > 0
                        ? 'Все задачи выполнены — отличная работа!'
                        : 'Запустите ИИ-анализ, чтобы получить план действий'}
                    </div>
                  </div>
                )}
                {loading && <div className="loading-overlay"><div className="spinner" /></div>}
              </div>
            </div>

            {/* Metric strip */}
            <div className="grid-3">
              <div className="metric-card">
                <div className="metric-value">{signals.length}</div>
                <div className="metric-label">Сигналов собрано</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{recs.length}</div>
                <div className="metric-label">Задач от ИИ</div>
              </div>
              <div className="metric-card">
                <div className="metric-value" style={{ color: 'var(--emerald)' }}>
                  +{summary?.estimated_score_gain?.toFixed(0) ?? scoreGain.toFixed(0)}
                </div>
                <div className="metric-label">
                  {scoreGain > 0 ? 'Пт роста за период' : 'Потенциал роста'}
                </div>
              </div>
            </div>

            {summary?.biggest_gap && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid var(--border-glow)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>⚡ Главная точка роста: </span>
                {summary.biggest_gap}
              </div>
            )}
          </>
        )}

        {/* ── RECOMMENDATIONS ───────────────────────────────── */}
        {tab === 'recommendations' && (
          <>
            <div className="page-header">
              <div>
                <div className="page-title">Задачи</div>
                <div className="page-subtitle">ИИ расставил приоритеты — выполняйте, платформа остальное сделает сама</div>
              </div>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
                {generating ? <span className="spinner" /> : '◈'}
                {generating ? 'ИИ анализирует…' : 'Обновить план'}
              </button>
            </div>
            {loading && <div className="loading-overlay"><div className="spinner" /></div>}
            {!loading && recs.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">◈</div>
                <div className="empty-text">Задач пока нет. Сначала соберите сигналы, затем запустите ИИ-анализ.</div>
                <button className="btn btn-primary" onClick={handleGenerate}>Запустить ИИ-анализ</button>
              </div>
            )}
            {recs.map(rec => (
              <RecommendationCard key={rec.id} rec={rec} onStatusUpdate={handleStatusUpdate} />
            ))}
          </>
        )}

        {/* ── SIGNALS ───────────────────────────────────────── */}
        {tab === 'signals' && (
          <>
            <div className="page-header">
              <div>
                <div className="page-title">Сигналы</div>
                <div className="page-subtitle">Данные о вашей видимости в Яндексе, Алисе, GigaChat, 2ГИС и ещё 10+ источниках</div>
              </div>
              <button className="btn btn-ghost" onClick={handleCollect} disabled={collecting}>
                {collecting ? <span className="spinner" /> : '◎'}
                {collecting ? 'Собираем…' : 'Собрать сейчас'}
              </button>
            </div>
            <SignalList
              signals={signals}
              loading={loading}
              companyId={company.id}
              onAiSignalAdded={loadData}
              showToast={showToast}
            />
          </>
        )}

        {/* ── KNOWLEDGE ─────────────────────────────────────── */}
        {tab === 'knowledge' && (
          <>
            <div className="page-header">
              <div>
                <div className="page-title">База знаний</div>
                <div className="page-subtitle">Фундамент ИИ-продвижения — структурированные факты о вашей компании</div>
              </div>
            </div>
            <KnowledgePanel companyId={company.id} showToast={showToast} />
          </>
        )}

        {/* ── INTEGRATIONS ──────────────────────────────────── */}
        {tab === 'integrations' && (
          <>
            <div className="page-header">
              <div>
                <div className="page-title">Автопилот</div>
                <div className="page-subtitle">Подключите сервисы — платформа выполнит задачи автоматически, без вашего участия</div>
              </div>
            </div>
            <IntegrationsPanel company={company} showToast={showToast} />
          </>
        )}

        {/* ── KEYWORDS ──────────────────────────────────────── */}
        {tab === 'keywords' && (
          <>
            <div className="page-header">
              <div>
                <div className="page-title">Запросы и контент</div>
                <div className="page-subtitle">Семантическое ядро из 50 запросов — платформа сгенерирует их сама и напишет статьи для продвижения в Яндексе</div>
              </div>
            </div>
            <KeywordsPanel company={company} showToast={showToast} />
          </>
        )}
        {/* ── VAULT ─────────────────────────────────────────── */}
        {tab === 'vault' && (
          <>
            <div className="page-header">
              <div>
                <div className="page-title">🔐 Хранилище доступов</div>
                <div className="page-subtitle">Зашифрованное хранилище FTP, OAuth и API ключей. Журнал каждого использования. Отзыв в один клик.</div>
              </div>
            </div>
            <CredentialVaultPanel companyId={company.id} />
          </>
        )}
      </main>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  );
}
