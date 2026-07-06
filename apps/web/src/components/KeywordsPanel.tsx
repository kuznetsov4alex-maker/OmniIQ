'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, type Company } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────
interface Keyword {
  id: string;
  company_id: string;
  query: string;
  cluster?: string;
  intent?: string;
  difficulty?: string;
  yandex_position?: number;
  ai_mentioned?: boolean;
  article_generated: boolean;
  article_title?: string;
}

interface KeywordsData {
  items: Keyword[];
  total: number;
  clusters: Record<string, number>;
}

interface Article {
  keyword_id: string;
  query: string;
  title: string;
  content: string;
  meta_description: string;
  word_count: number;
}

// ── Helpers ───────────────────────────────────────────────────────
const CLUSTER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'брендовые':      { bg: 'rgba(99,102,241,0.10)',  border: 'rgba(99,102,241,0.25)',  text: 'var(--indigo)' },
  'коммерческие':   { bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.25)',  text: 'var(--emerald)' },
  'информационные': { bg: 'rgba(6,182,212,0.10)',   border: 'rgba(6,182,212,0.25)',   text: 'var(--cyan)' },
  'локальные':      { bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.25)',  text: '#f59e0b' },
  'конкурентные':   { bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.25)',   text: '#ef4444' },
};
const DEFAULT_COLOR = { bg: 'rgba(255,255,255,0.05)', border: 'var(--border)', text: 'var(--text-secondary)' };

const DIFFICULTY_COLORS: Record<string, string> = {
  low: 'var(--emerald)', medium: '#f59e0b', high: '#ef4444',
};
const DIFFICULTY_LABELS: Record<string, string> = {
  low: 'Лёгкий', medium: 'Средний', high: 'Сложный',
};
const INTENT_LABELS: Record<string, string> = {
  commercial: 'Коммерческий', informational: 'Информационный',
  navigational: 'Навигационный', local: 'Локальный',
};

// ── Article Modal ─────────────────────────────────────────────────
function ArticleModal({ article, onClose }: { article: Article; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)', maxWidth: 760, width: '100%',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              📄 SEO-статья · {article.word_count} слов
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {article.title}
            </div>
            {article.meta_description && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic' }}>
                Meta: {article.meta_description}
              </div>
            )}
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
            ✕ Закрыть
          </button>
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          <pre style={{
            fontFamily: 'inherit', whiteSpace: 'pre-wrap', lineHeight: 1.7,
            fontSize: 14, color: 'var(--text-primary)',
          }}>
            {article.content}
          </pre>
        </div>
        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 10,
        }}>
          <button className="btn btn-primary btn-sm" onClick={() => {
            navigator.clipboard.writeText(article.content);
          }}>
            Скопировать Markdown
          </button>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
            Готово к публикации в CMS
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Keyword Row ───────────────────────────────────────────────────
function KeywordRow({
  kw,
  onGenerateArticle,
}: {
  kw: Keyword;
  onGenerateArticle: (kw: Keyword) => void;
}) {
  const clr = CLUSTER_COLORS[kw.cluster || ''] || DEFAULT_COLOR;
  const diffColor = DIFFICULTY_COLORS[kw.difficulty || ''] || 'var(--text-muted)';

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14 }}>
        {kw.query}
      </td>
      <td style={{ padding: '10px 12px' }}>
        {kw.cluster && (
          <span style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 99,
            background: clr.bg, border: `1px solid ${clr.border}`, color: clr.text,
            whiteSpace: 'nowrap',
          }}>
            {kw.cluster}
          </span>
        )}
      </td>
      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
        {kw.intent ? INTENT_LABELS[kw.intent] || kw.intent : '—'}
      </td>
      <td style={{ padding: '10px 12px' }}>
        <span style={{ fontSize: 12, color: diffColor, fontWeight: 600 }}>
          {kw.difficulty ? DIFFICULTY_LABELS[kw.difficulty] || kw.difficulty : '—'}
        </span>
      </td>
      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
        {kw.yandex_position !== null && kw.yandex_position !== undefined
          ? <span style={{ fontSize: 13, fontWeight: 700, color: kw.yandex_position <= 10 ? 'var(--emerald)' : 'var(--text-secondary)' }}>
              #{kw.yandex_position}
            </span>
          : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
        }
      </td>
      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
        {kw.ai_mentioned === true
          ? <span style={{ color: 'var(--emerald)', fontSize: 14 }}>✓</span>
          : kw.ai_mentioned === false
            ? <span style={{ color: '#ef4444', fontSize: 14 }}>✗</span>
            : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
        }
      </td>
      <td style={{ padding: '10px 12px' }}>
        <button
          className={`btn btn-ghost btn-sm ${kw.article_generated ? 'active' : ''}`}
          style={{
            fontSize: 11,
            color: kw.article_generated ? 'var(--emerald)' : 'var(--text-secondary)',
            borderColor: kw.article_generated ? 'rgba(16,185,129,0.3)' : 'var(--border)',
          }}
          onClick={() => onGenerateArticle(kw)}
        >
          {kw.article_generated ? '✓ Статья' : '+ Статья'}
        </button>
      </td>
    </tr>
  );
}

// ── Main Panel ────────────────────────────────────────────────────
export default function KeywordsPanel({
  company,
  showToast,
}: {
  company: Company;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [data, setData] = useState<KeywordsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [articleLoading, setArticleLoading] = useState<string | null>(null);

  const load = useCallback(async (cluster?: string) => {
    setLoading(true);
    try {
      const result = await api.listKeywords(company.id, cluster || undefined);
      setData(result);
    } catch {
      // no keywords yet
    } finally {
      setLoading(false);
    }
  }, [company.id]);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async (force = false) => {
    setGenerating(true);
    try {
      const result = await api.generateKeywords(company.id, { max_keywords: 50, force_regenerate: force });
      setData(result);
      showToast(`Сгенерировано ${result.total} запросов для продвижения`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Ошибка генерации', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateArticle = async (kw: Keyword) => {
    if (articleLoading) return;
    setArticleLoading(kw.id);
    try {
      const art = await api.generateArticle(company.id, kw.id);
      setArticle(art);
      // refresh row
      await load(activeCluster || undefined);
      showToast(`Статья «${art.title}» готова`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Ошибка генерации статьи', 'error');
    } finally {
      setArticleLoading(null);
    }
  };

  const handleClusterFilter = (cluster: string | null) => {
    setActiveCluster(cluster);
    load(cluster || undefined);
  };

  const hasKeywords = data && data.total > 0;

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(6,182,212,0.07) 100%)',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 'var(--r-lg)', padding: '22px 26px',
        marginBottom: 24, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Семантическое ядро
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 460 }}>
            {hasKeywords
              ? `${data.total} поисковых запросов · GPT-4o генерирует статьи под каждый запрос автоматически`
              : 'Нажмите «Сгенерировать» — GPT-4o создаст 50 целевых запросов и статьи для продвижения в Яндексе'
            }
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {hasKeywords && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => handleGenerate(true)}
              disabled={generating}
            >
              ↺ Обновить
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => handleGenerate(false)}
            disabled={generating}
            style={{ background: 'var(--emerald)', borderColor: 'var(--emerald)' }}
          >
            {generating ? <span className="spinner" /> : '◎'}
            {generating ? 'Генерируем 50 запросов…' : hasKeywords ? 'Перегенерировать' : 'Сгенерировать 50 запросов'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {hasKeywords && data && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {/* Total */}
          <div style={{
            padding: '12px 18px', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            textAlign: 'center', minWidth: 90,
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
              {data.total}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>запросов</div>
          </div>
          {/* Articles */}
          <div style={{
            padding: '12px 18px', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            textAlign: 'center', minWidth: 90,
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--emerald)', fontFamily: 'monospace' }}>
              {data.items.filter(k => k.article_generated).length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>статей готово</div>
          </div>
          {/* Top positions */}
          <div style={{
            padding: '12px 18px', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            textAlign: 'center', minWidth: 90,
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--cyan)', fontFamily: 'monospace' }}>
              {data.items.filter(k => k.yandex_position && k.yandex_position <= 10).length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>в топ-10</div>
          </div>
        </div>
      )}

      {/* Cluster filter tabs */}
      {hasKeywords && data && Object.keys(data.clusters).length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-ghost btn-sm ${!activeCluster ? 'active' : ''}`}
            onClick={() => handleClusterFilter(null)}
            style={{ fontSize: 12 }}
          >
            Все ({data.total})
          </button>
          {Object.entries(data.clusters).map(([cluster, count]) => {
            const clr = CLUSTER_COLORS[cluster] || DEFAULT_COLOR;
            return (
              <button
                key={cluster}
                onClick={() => handleClusterFilter(cluster)}
                style={{
                  fontSize: 12, padding: '4px 12px', borderRadius: 99, cursor: 'pointer',
                  border: `1px solid ${activeCluster === cluster ? clr.border : 'var(--border)'}`,
                  background: activeCluster === cluster ? clr.bg : 'transparent',
                  color: activeCluster === cluster ? clr.text : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                {cluster} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!hasKeywords && !loading && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          border: '1px dashed var(--border)', borderRadius: 'var(--r-lg)',
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>◎</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Семантическое ядро не создано
          </div>
          <div style={{ fontSize: 13, maxWidth: 380, margin: '0 auto' }}>
            Нажмите «Сгенерировать 50 запросов» — GPT-4o проанализирует ваш бизнес
            и создаст таблицу поисковых запросов для продвижения в Яндексе
          </div>
        </div>
      )}

      {/* Keywords table */}
      {hasKeywords && (
        <div style={{
          border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                {['Запрос', 'Кластер', 'Интент', 'Сложность', 'Яндекс', 'Алиса', 'Контент'].map(h => (
                  <th key={h} style={{
                    padding: '10px 12px', textAlign: 'left',
                    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(loading ? [] : data.items).map(kw => (
                <KeywordRow
                  key={kw.id}
                  kw={kw}
                  onGenerateArticle={articleLoading ? () => {} : handleGenerateArticle}
                />
              ))}
              {loading && (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Загрузка…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Article loading overlay */}
      {articleLoading && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <span className="spinner" />
          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
            GPT-4o пишет статью…
          </span>
        </div>
      )}

      {/* Article modal */}
      {article && <ArticleModal article={article} onClose={() => setArticle(null)} />}
    </div>
  );
}
