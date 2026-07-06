'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Walkthrough, WalkthroughStep } from '@/lib/walkthroughData';

// ── Types ─────────────────────────────────────────────────────────
interface Props {
  walkthrough: Walkthrough;
  onClose: () => void;
  onComplete?: () => void;
}

// ── Difficulty badge ──────────────────────────────────────────────
const DIFF_CONFIG = {
  easy:   { label: 'Просто',  color: 'var(--emerald)' },
  medium: { label: 'Средне', color: '#f59e0b' },
  hard:   { label: 'Сложно', color: '#ef4444' },
} as const;

// ── Action type labels ────────────────────────────────────────────
const ACTION_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  navigate: { icon: '↗',  label: 'Перейдите по ссылке', color: '#818cf8' },
  click:    { icon: '👆', label: 'Нажмите кнопку',      color: '#22d3ee' },
  type:     { icon: '⌨',  label: 'Введите данные',      color: '#f59e0b' },
  copy:     { icon: '📋', label: 'Скопируйте текст',    color: '#10b981' },
  wait:     { icon: '⏳', label: 'Подождите',           color: '#a78bfa' },
  verify:   { icon: '✓',  label: 'Проверьте результат', color: '#10b981' },
};

// ── CopyButton ────────────────────────────────────────────────────
function CopyButton({ text, label = 'Скопировать' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button
      onClick={handleCopy}
      className="btn btn-primary btn-sm"
      style={{ background: copied ? 'var(--emerald)' : 'var(--accent)', borderColor: copied ? 'var(--emerald)' : 'var(--accent)' }}
    >
      {copied ? '✓ Скопировано!' : `📋 ${label}`}
    </button>
  );
}

// ── Step content ──────────────────────────────────────────────────
function StepView({ step, onNext, onPrev, isFirst, isLast, total }:
  { step: WalkthroughStep; onNext: () => void; onPrev: () => void; isFirst: boolean; isLast: boolean; total: number }
) {
  const actionCfg = ACTION_LABELS[step.action] || ACTION_LABELS.click;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>

      {/* Action type pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: 99,
          background: `${actionCfg.color}18`,
          border: `1px solid ${actionCfg.color}40`,
          fontSize: 12, fontWeight: 700, color: actionCfg.color,
        }}>
          {actionCfg.icon} {actionCfg.label}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Шаг {step.step} из {total}
        </span>
      </div>

      {/* Title */}
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
        {step.title}
      </div>

      {/* Instruction */}
      <div style={{
        fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7,
        padding: '14px 16px', background: 'rgba(255,255,255,0.03)',
        borderLeft: '3px solid var(--accent)', borderRadius: '0 8px 8px 0',
      }}>
        {step.instruction}
      </div>

      {/* Mockup with annotated screenshot */}
      <div style={{
        borderRadius: 12, overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--bg)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}
        dangerouslySetInnerHTML={{ __html: step.mockup }}
      />

      {/* Open URL button */}
      {step.url && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={step.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            ↗ {step.urlLabel || 'Открыть'}
          </a>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
            Откроется в новой вкладке
          </span>
        </div>
      )}

      {/* Copy text */}
      {step.copyText && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Скопируйте этот текст
          </div>
          <div style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace',
            fontSize: 12, color: '#10b981', lineHeight: 1.6,
            maxHeight: 160, overflow: 'auto', whiteSpace: 'pre-wrap',
            marginBottom: 8,
          }}>
            {step.copyText}
          </div>
          <CopyButton text={step.copyText} />
        </div>
      )}

      {/* Tip */}
      {step.tip && (
        <div style={{
          display: 'flex', gap: 10, padding: '10px 14px',
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)',
        }}>
          <span style={{ color: 'var(--emerald)', flexShrink: 0 }}>💡</span>
          <span>{step.tip}</span>
        </div>
      )}

      {/* Check */}
      {step.check && (
        <div style={{
          display: 'flex', gap: 10, padding: '10px 14px',
          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)',
        }}>
          <span style={{ color: 'var(--accent2)', flexShrink: 0 }}>✓</span>
          <span><strong style={{ color: 'var(--text-primary)' }}>Как проверить:</strong> {step.check}</span>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 'auto', paddingTop: 12 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onPrev}
          disabled={isFirst}
          style={{ opacity: isFirst ? 0.3 : 1 }}
        >
          ← Назад
        </button>
        <button
          className="btn btn-primary"
          onClick={onNext}
          style={{
            background: isLast ? 'var(--emerald)' : 'var(--accent)',
            borderColor: isLast ? 'var(--emerald)' : 'var(--accent)',
          }}
        >
          {isLast ? '✓ Готово!' : 'Следующий шаг →'}
        </button>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────
export default function WalkthroughModal({ walkthrough, onClose, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const steps = walkthrough.steps;
  const step = steps[currentStep];
  const diffCfg = DIFF_CONFIG[walkthrough.difficulty];
  const progress = ((currentStep) / steps.length) * 100;

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentStep < steps.length - 1) setCurrentStep(s => s + 1);
      if (e.key === 'ArrowLeft' && currentStep > 0) setCurrentStep(s => s - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentStep, steps.length, onClose]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      setCompleted(true);
      onComplete?.();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '24px 16px', overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, width: '100%', maxWidth: 680,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        marginTop: 16,
      }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{
          padding: '20px 24px 0', borderBottom: '1px solid var(--border)',
          paddingBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>{walkthrough.emoji}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {walkthrough.title}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    ⏱ {walkthrough.estimatedTime}
                  </span>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 99,
                    background: `${diffCfg.color}18`, color: diffCfg.color,
                    fontWeight: 700,
                  }}>
                    {diffCfg.label}
                  </span>
                </div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ flexShrink: 0 }}>
              ✕
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 11, color: 'var(--text-muted)', marginBottom: 6,
            }}>
              <span>{completed ? 'Всё выполнено!' : `Шаг ${currentStep + 1} из ${steps.length}`}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                background: completed ? 'var(--emerald)' : 'var(--accent)',
                width: `${completed ? 100 : progress}%`,
                transition: 'width 0.3s ease, background 0.3s ease',
              }} />
            </div>

            {/* Step dots */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'center' }}>
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  style={{
                    width: i === currentStep ? 20 : 8, height: 8, borderRadius: 99,
                    background: i < currentStep ? 'var(--emerald)' : i === currentStep ? 'var(--accent)' : 'var(--border)',
                    border: 'none', cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  aria-label={`Шаг ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {completed ? (
            // ── Done screen ─────────────────────────────────
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Готово!
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 28px' }}>
                {walkthrough.title} — выполнено. OmniIQ зафиксирует изменение при следующем сканировании и обновит Балл видимости.
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={onClose}>
                  ✓ Отлично, закрыть
                </button>
                <button className="btn btn-ghost" onClick={() => { setCurrentStep(0); setCompleted(false); }}>
                  ↺ Пройти ещё раз
                </button>
              </div>
            </div>
          ) : (
            <StepView
              step={step}
              onNext={handleNext}
              onPrev={handlePrev}
              isFirst={currentStep === 0}
              isLast={currentStep === steps.length - 1}
              total={steps.length}
            />
          )}
        </div>
      </div>
    </div>
  );
}
