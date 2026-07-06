'use client';

import { useState } from 'react';
import type { Recommendation } from '@/lib/api';
import { WALKTHROUGHS, REC_TO_WALKTHROUGH } from '@/lib/walkthroughData';
import WalkthroughModal from '@/components/WalkthroughModal';

interface Props {
  rec: Recommendation;
  onStatusUpdate: (id: string, status: string) => void;
  compact?: boolean;
}

const EFFORT_LABEL: Record<string, string> = {
  low:    '⚡ Быстрая победа',
  medium: '⏱ Среднее',
  high:   '◈ Крупная задача',
};

const STATUS_LABEL: Record<string, string> = {
  pending:  'ожидает',
  approved: 'выполняется',
  rejected: 'отложено',
  done:     'готово',
};

// Determine if a recommendation has a manual walkthrough available
function getWalkthrough(rec: Recommendation) {
  const id = REC_TO_WALKTHROUGH[rec.category] ??
              REC_TO_WALKTHROUGH[rec.title?.toLowerCase().replace(/\s+/g, '_')] ??
              null;
  return id ? WALKTHROUGHS[id] ?? null : null;
}

// Auto-tasks: these run via Autopilot without user steps
const AUTO_CATEGORIES = new Set(['technical', 'content', 'schema', 'meta', 'sitemap']);

export default function RecommendationCard({ rec, onStatusUpdate, compact }: Props) {
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [launching, setLaunching] = useState(false);

  const isPending  = rec.status === 'pending';
  const isApproved = rec.status === 'approved';
  const walkthrough = getWalkthrough(rec);
  const isAuto = AUTO_CATEGORIES.has(rec.category);

  // ── Launch: auto tasks mark approved immediately; manual tasks open modal
  const handleLaunch = () => {
    if (walkthrough) {
      setWalkthroughOpen(true);
    } else if (isAuto) {
      setLaunching(true);
      setTimeout(() => {
        setLaunching(false);
        onStatusUpdate(rec.id, 'approved');
      }, 800);
    } else {
      onStatusUpdate(rec.id, 'approved');
    }
  };

  const handleComplete = () => {
    setWalkthroughOpen(false);
    onStatusUpdate(rec.id, 'done');
  };

  return (
    <>
      <div className={`rec-card${isApproved ? ' rec-card--active' : ''}`} style={{
        borderColor: isApproved ? 'rgba(99,102,241,0.4)' : undefined,
        background: isApproved ? 'rgba(99,102,241,0.05)' : undefined,
      }}>

        {/* ── Header ────────────────────────────────────── */}
        <div className="rec-header">
          <div className="rec-title">{rec.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {walkthrough && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px',
                borderRadius: 99, background: 'rgba(34,211,238,0.12)',
                color: '#22d3ee', border: '1px solid rgba(34,211,238,0.25)',
                letterSpacing: '0.05em',
              }}>
                👆 РУЧНАЯ
              </span>
            )}
            {isAuto && !walkthrough && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px',
                borderRadius: 99, background: 'rgba(16,185,129,0.12)',
                color: '#10b981', border: '1px solid rgba(16,185,129,0.25)',
                letterSpacing: '0.05em',
              }}>
                ⚡ АВТО
              </span>
            )}
            <span className="priority-score">{rec.priority_score.toFixed(1)}</span>
          </div>
        </div>

        {/* ── Meta ──────────────────────────────────────── */}
        <div className="rec-meta">
          <span className={`badge badge-${rec.category}`}>{rec.category.toUpperCase()}</span>
          <span className={`badge badge-${rec.effort}`}>{EFFORT_LABEL[rec.effort] ?? rec.effort}</span>
          <span className={`status-chip status-${rec.status}`}>{STATUS_LABEL[rec.status] ?? rec.status}</span>
        </div>

        {/* ── Description ───────────────────────────────── */}
        <div className="rec-desc">{rec.description}</div>

        {/* ── Action steps (plan) ───────────────────────── */}
        {!compact && rec.action_steps?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
            }}>
              Что нужно сделать
            </div>
            <ol style={{
              paddingLeft: 18, color: 'var(--text-secondary)',
              fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              {rec.action_steps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </div>
        )}

        {/* ── Walkthrough preview strip ──────────────────── */}
        {!compact && walkthrough && isPending && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            background: 'rgba(34,211,238,0.06)',
            border: '1px solid rgba(34,211,238,0.2)',
            borderRadius: 10, marginBottom: 12,
          }}>
            <span style={{ fontSize: 22 }}>{walkthrough.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#22d3ee' }}>
                Пошаговый помощник доступен
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {walkthrough.steps.length} шагов · {walkthrough.estimatedTime}
              </div>
            </div>
            <div style={{
              display: 'flex', gap: 4,
              flexShrink: 0,
            }}>
              {walkthrough.steps.slice(0, 5).map((_, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: i === 0 ? '#22d3ee' : 'var(--border)',
                }} />
              ))}
              {walkthrough.steps.length > 5 && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center' }}>
                  +{walkthrough.steps.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Main CTA: «Приступить к реализации» ───────── */}
        {isPending && (
          <div className="rec-actions" style={{ flexDirection: 'column', gap: 10 }}>

            {/* PRIMARY — Launch button */}
            <button
              className="btn btn-primary"
              onClick={handleLaunch}
              disabled={launching}
              style={{
                width: '100%',
                background: walkthrough ? 'linear-gradient(135deg,#22d3ee,#818cf8)' : 'var(--accent)',
                borderColor: walkthrough ? '#22d3ee' : 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 14, fontWeight: 700,
                padding: '12px 20px',
                boxShadow: walkthrough
                  ? '0 4px 20px rgba(34,211,238,0.25)'
                  : '0 4px 20px rgba(99,102,241,0.25)',
              }}
            >
              {launching ? (
                <>
                  <span style={{
                    width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                    display: 'inline-block',
                  }} />
                  Запускаем...
                </>
              ) : walkthrough ? (
                <>👆 Приступить к реализации — пошагово</>
              ) : isAuto ? (
                <>⚡ Приступить к реализации — авто</>
              ) : (
                <>▶ Приступить к реализации</>
              )}
            </button>

            {/* SECONDARY — Postpone */}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onStatusUpdate(rec.id, 'rejected')}
              style={{ width: '100%', fontSize: 12 }}
            >
              Отложить на потом
            </button>
          </div>
        )}

        {/* ── Approved state ─────────────────────────────── */}
        {isApproved && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {walkthrough && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setWalkthroughOpen(true)}
              >
                👆 Открыть помощник
              </button>
            )}
            <button
              className="btn btn-approve btn-sm"
              onClick={() => onStatusUpdate(rec.id, 'done')}
            >
              ✓ Отметить выполненным
            </button>
          </div>
        )}
      </div>

      {/* ── Walkthrough Modal ──────────────────────────────── */}
      {walkthroughOpen && walkthrough && (
        <WalkthroughModal
          walkthrough={walkthrough}
          onClose={() => setWalkthroughOpen(false)}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}
