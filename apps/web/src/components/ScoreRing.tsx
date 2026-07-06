'use client';

interface Props {
  score: number;
  grade: string;
  loading?: boolean;
}

const RADIUS = 90;
const CIRC = 2 * Math.PI * RADIUS;

function gradeColor(grade: string): string {
  const map: Record<string, string> = {
    A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#f43f5e',
  };
  return map[grade] || '#6366f1';
}

export default function ScoreRing({ score, grade, loading }: Props) {
  const clamp = Math.max(0, Math.min(100, score));
  const offset = CIRC - (clamp / 100) * CIRC;
  const color = gradeColor(grade);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={220} height={220} viewBox="0 0 220 220" className="score-ring-svg">
        {/* Background track */}
        <circle
          cx={110} cy={110} r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={14}
        />
        {/* Score arc */}
        <circle
          cx={110} cy={110} r={RADIUS}
          fill="none"
          stroke={loading ? 'rgba(255,255,255,0.1)' : color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={loading ? CIRC : offset}
          transform="rotate(-90 110 110)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.25,1,0.5,1), stroke 0.5s' }}
        />
        {/* Glow */}
        {!loading && clamp > 0 && (
          <circle
            cx={110} cy={110} r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            transform="rotate(-90 110 110)"
            style={{ filter: `blur(8px)`, opacity: 0.3 }}
          />
        )}
      </svg>

      {/* Center text */}
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        {loading ? (
          <div className="spinner" />
        ) : (
          <>
            <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -2 }}>
              {clamp.toFixed(0)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, letterSpacing: 1 }}>/ 100</div>
            <div className={`grade grade-${grade}`} style={{ margin: '8px auto 0' }}>{grade || '–'}</div>
          </>
        )}
      </div>
    </div>
  );
}
