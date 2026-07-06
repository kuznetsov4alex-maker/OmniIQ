'use client';

import { useEffect, useRef } from 'react';

export interface ScorePoint {
  day: string;    // "Day 1", "Day 3" etc
  date: string;   // ISO date string
  score: number;
  grade: string;
}

interface Props {
  points: ScorePoint[];
  height?: number;
}

function gradeColor(grade: string): string {
  const map: Record<string, string> = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#f43f5e' };
  return map[grade] || '#6366f1';
}

export default function ScoreTrendChart({ points, height = 160 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const pad = { top: 16, right: 16, bottom: 32, left: 36 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const n = points.length;
    const minScore = Math.max(0, Math.min(...points.map(p => p.score)) - 10);
    const maxScore = Math.min(100, Math.max(...points.map(p => p.score)) + 10);
    const range = maxScore - minScore || 1;

    const xOf = (i: number) => pad.left + (i / (n - 1)) * chartW;
    const yOf = (s: number) => pad.top + chartH - ((s - minScore) / range) * chartH;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let v = 0; v <= 4; v++) {
      const y = pad.top + (v / 4) * chartH;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
    }

    // Y axis labels
    ctx.fillStyle = '#475569';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    for (let v = 0; v <= 4; v++) {
      const val = maxScore - (v / 4) * range;
      const y = pad.top + (v / 4) * chartH;
      ctx.fillText(val.toFixed(0), pad.left - 4, y + 4);
    }

    if (n < 2) return;

    // Gradient fill
    const grd = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grd.addColorStop(0, 'rgba(99,102,241,0.18)');
    grd.addColorStop(1, 'rgba(99,102,241,0)');
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(points[0].score));
    for (let i = 1; i < n; i++) {
      const x0 = xOf(i - 1), x1 = xOf(i);
      const cp1x = x0 + (x1 - x0) * 0.4;
      ctx.bezierCurveTo(cp1x, yOf(points[i - 1].score), cp1x, yOf(points[i].score), x1, yOf(points[i].score));
    }
    ctx.lineTo(xOf(n - 1), pad.top + chartH);
    ctx.lineTo(xOf(0), pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grd;
    ctx.fill();

    // Line
    const lineGrd = ctx.createLinearGradient(pad.left, 0, pad.left + chartW, 0);
    lineGrd.addColorStop(0, '#6366f1');
    lineGrd.addColorStop(1, gradeColor(points[n - 1].grade));
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(points[0].score));
    for (let i = 1; i < n; i++) {
      const x0 = xOf(i - 1), x1 = xOf(i);
      const cp1x = x0 + (x1 - x0) * 0.4;
      ctx.bezierCurveTo(cp1x, yOf(points[i - 1].score), cp1x, yOf(points[i].score), x1, yOf(points[i].score));
    }
    ctx.strokeStyle = lineGrd;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dots + labels
    points.forEach((p, i) => {
      const x = xOf(i), y = yOf(p.score);
      const color = gradeColor(p.grade);
      // glow
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = `${color}22`; ctx.fill();
      // dot
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();

      // X label
      ctx.fillStyle = i === n - 1 ? color : '#475569';
      ctx.font = i === n - 1 ? 'bold 10px Inter, sans-serif' : '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.day, x, pad.top + chartH + 20);

      // Score on last point
      if (i === n - 1) {
        ctx.fillStyle = color;
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.fillText(p.score.toFixed(0), x, y - 12);
      }
    });
  }, [points, height]);

  if (points.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        Collect signals daily to see your score trend
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height, display: 'block' }}
    />
  );
}
