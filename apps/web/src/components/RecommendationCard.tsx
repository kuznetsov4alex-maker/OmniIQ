'use client';

import type { Recommendation } from '@/lib/api';

interface Props {
  rec: Recommendation;
  onStatusUpdate: (id: string, status: string) => void;
  compact?: boolean;
}

const EFFORT_LABEL: Record<string, string> = { low: '⚡ Quick win', medium: '⏱ Medium', high: '🏗 Complex' };

export default function RecommendationCard({ rec, onStatusUpdate, compact }: Props) {
  const isPending = rec.status === 'pending';

  return (
    <div className="rec-card">
      <div className="rec-header">
        <div className="rec-title">{rec.title}</div>
        <span className="priority-score">{rec.priority_score.toFixed(1)}</span>
      </div>

      <div className="rec-meta">
        <span className={`badge badge-${rec.category}`}>{rec.category.toUpperCase()}</span>
        <span className={`badge badge-${rec.effort}`}>{EFFORT_LABEL[rec.effort] ?? rec.effort}</span>
        <span className={`status-chip status-${rec.status}`}>{rec.status}</span>
      </div>

      <div className="rec-desc">{rec.description}</div>

      {!compact && rec.action_steps?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Steps</div>
          <ol style={{ paddingLeft: 18, color: 'var(--text-secondary)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {rec.action_steps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </div>
      )}

      {isPending && (
        <div className="rec-actions">
          <button className="btn btn-approve btn-sm" onClick={() => onStatusUpdate(rec.id, 'approved')}>
            ✓ Approve
          </button>
          <button className="btn btn-reject btn-sm" onClick={() => onStatusUpdate(rec.id, 'rejected')}>
            ✗ Skip
          </button>
        </div>
      )}
    </div>
  );
}
