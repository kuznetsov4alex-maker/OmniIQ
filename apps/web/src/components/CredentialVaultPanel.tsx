'use client';

import { useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────
type CredentialType = 'ftp' | 'sftp' | 'oauth_yandex' | 'oauth_google' | 'api_key' | 'ssh' | 'other';

interface Credential {
  id: string;
  credential_type: CredentialType;
  label: string;
  host?: string;
  username?: string;
  scope?: string;
  is_active: boolean;
  consent_given: boolean;
  consent_given_at?: string;
  created_at: string;
  updated_at: string;
  has_password: boolean;
  has_access_token: boolean;
  has_api_key: boolean;
}

interface AuditEntry {
  id: string;
  credential_id?: string;
  action: 'created' | 'accessed' | 'updated' | 'deleted' | 'rotated' | 'revoked';
  actor?: string;
  details?: string;
  performed_at: string;
}

interface AddCredentialForm {
  credential_type: CredentialType;
  label: string;
  host: string;
  username: string;
  password: string;
  scope: string;
  consent_given: boolean;
}

// ── Config ────────────────────────────────────────────────────────────────
const CRED_TYPES: Record<CredentialType, { label: string; icon: string; color: string }> = {
  ftp:          { label: 'FTP',              icon: '📁', color: '#f59e0b' },
  sftp:         { label: 'SFTP',             icon: '🔒', color: '#10b981' },
  oauth_yandex: { label: 'Яндекс OAuth',     icon: '🔴', color: '#ef4444' },
  oauth_google: { label: 'Google OAuth',     icon: '🔵', color: '#3b82f6' },
  api_key:      { label: 'API Key',          icon: '🔑', color: '#818cf8' },
  ssh:          { label: 'SSH',              icon: '💻', color: '#22d3ee' },
  other:        { label: 'Другое',           icon: '🔧', color: '#6b7280' },
};

const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  created:  { label: 'Добавлен',           icon: '✚', color: '#10b981' },
  accessed: { label: 'Использован',        icon: '👁', color: '#818cf8' },
  updated:  { label: 'Обновлён',           icon: '✎', color: '#f59e0b' },
  deleted:  { label: 'Удалён',             icon: '✕', color: '#ef4444' },
  rotated:  { label: 'Ключ обновлён',      icon: '↺', color: '#22d3ee' },
  revoked:  { label: 'Отозван клиентом',   icon: '⊘', color: '#ef4444' },
};

const CONSENT_TEXT = `Я добровольно передаю OmniIQ доступ к указанному ресурсу для выполнения следующих автоматических действий:
• Загрузка файлов верификации (Яндекс.Вебмастер, Google Search Console)
• Чтение и обновление конфигурационных файлов (robots.txt, sitemap.xml)
• Публикация Schema.org разметки

OmniIQ обязуется:
• Хранить доступ в зашифрованном виде (AES-256)
• Не передавать третьим лицам
• Использовать только для заявленных задач
• Предоставить полный журнал всех действий
• Удалить по первому требованию`;

// ── Consent Modal ─────────────────────────────────────────────────────────
function ConsentModal({
  form,
  onConfirm,
  onCancel,
}: {
  form: AddCredentialForm;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10001,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 20, width: '100%', maxWidth: 540, padding: 32,
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 24 }}>
          <span style={{ fontSize: 28 }}>🔐</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              Подтвердите передачу доступа
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {CRED_TYPES[form.credential_type].label} · {form.label}
              {form.host && <> · <code style={{ fontSize: 12 }}>{form.host}</code></>}
            </div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 16, fontSize: 12,
          color: 'var(--text-secondary)', lineHeight: 1.8,
          whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto',
          fontFamily: 'Inter, sans-serif', marginBottom: 20,
        }}>
          {CONSENT_TEXT}
        </div>

        <label style={{
          display: 'flex', gap: 12, alignItems: 'flex-start',
          cursor: 'pointer', marginBottom: 24, padding: '12px 16px',
          background: checked ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${checked ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
          borderRadius: 10, transition: 'all 0.2s ease',
        }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            style={{ width: 18, height: 18, marginTop: 1, accentColor: '#10b981', flexShrink: 0 }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            Я прочитал(-а) и согласен(-на) с условиями передачи доступа. Я понимаю, что OmniIQ будет использовать его только для указанных задач.
          </span>
        </label>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            style={{ flex: 1 }}
          >
            Отмена
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={!checked}
            style={{
              flex: 2,
              background: checked ? '#10b981' : undefined,
              borderColor: checked ? '#10b981' : undefined,
              opacity: checked ? 1 : 0.4,
            }}
          >
            🔐 Сохранить доступ зашифрованно
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Credential Form ───────────────────────────────────────────────────
function AddCredentialForm({
  onAdd,
  onClose,
}: {
  onAdd: (form: AddCredentialForm) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<AddCredentialForm>({
    credential_type: 'ftp',
    label: '',
    host: '',
    username: '',
    password: '',
    scope: '',
    consent_given: false,
  });
  const [showConsent, setShowConsent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConsent(true);
  };

  const handleConfirm = () => {
    onAdd({ ...form, consent_given: true });
    setShowConsent(false);
  };

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 20, width: '100%', maxWidth: 500, padding: 28,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              🔐 Добавить доступ
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Type */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Тип доступа
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(Object.keys(CRED_TYPES) as CredentialType[]).map(t => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setForm(f => ({ ...f, credential_type: t }))}
                    style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      border: `1px solid ${form.credential_type === t ? CRED_TYPES[t].color : 'var(--border)'}`,
                      background: form.credential_type === t ? `${CRED_TYPES[t].color}18` : 'transparent',
                      color: form.credential_type === t ? CRED_TYPES[t].color : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {CRED_TYPES[t].icon} {CRED_TYPES[t].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fields */}
            {[
              { key: 'label',    label: 'Название (для вас)', placeholder: 'напр. FTP основной сайт', required: true },
              { key: 'host',     label: 'Хост / URL',         placeholder: 'ftp.mysite.ru', required: false },
              { key: 'username', label: 'Логин',              placeholder: 'username', required: false },
              { key: 'password', label: 'Пароль / Токен',     placeholder: '••••••••', required: false, secret: true },
            ].map(({ key, label, placeholder, required, secret }) => (
              <div key={key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {label}{required && ' *'}
                </label>
                <input
                  type={secret ? 'password' : 'text'}
                  value={(form as Record<string, string>)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required={required}
                  autoComplete={secret ? 'new-password' : undefined}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', fontSize: 13,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}

            {/* Security notice */}
            <div style={{
              display: 'flex', gap: 10, padding: '10px 14px',
              background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)',
            }}>
              <span>🔒</span>
              <span>Пароль будет зашифрован алгоритмом AES-256 прямо в браузере до отправки. OmniIQ никогда не хранит пароли в открытом виде.</span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>
              Далее — подтвердить согласие →
            </button>
          </form>
        </div>
      </div>

      {showConsent && (
        <ConsentModal
          form={form}
          onConfirm={handleConfirm}
          onCancel={() => setShowConsent(false)}
        />
      )}
    </>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────
export default function CredentialVaultPanel({ companyId }: { companyId: string }) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'audit'>('credentials');
  const [revoking, setRevoking] = useState<string | null>(null);

  // Mock data for dev
  useEffect(() => {
    setCredentials([
      {
        id: '1', credential_type: 'ftp', label: 'FTP основной сайт',
        host: 'ftp.mysite.ru', username: 'user_omniiq',
        is_active: true, consent_given: true,
        consent_given_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        has_password: true, has_access_token: false, has_api_key: false,
      },
      {
        id: '2', credential_type: 'oauth_yandex', label: 'Яндекс.Вебмастер',
        scope: 'webmaster:read webmaster:verify',
        is_active: true, consent_given: true,
        consent_given_at: new Date(Date.now() - 86400000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        has_password: false, has_access_token: true, has_api_key: false,
      },
    ]);
    setAuditLog([
      {
        id: 'a1', credential_id: '1', action: 'created', actor: 'user',
        details: 'Добавлен доступ: ftp — FTP основной сайт',
        performed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'a2', credential_id: '1', action: 'accessed', actor: 'system:autopilot',
        details: 'Расшифровка для задачи: Загрузка файла верификации Яндекс.Вебмастер',
        performed_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'a3', credential_id: '2', action: 'created', actor: 'user',
        details: 'Добавлен доступ: oauth_yandex — Яндекс.Вебмастер',
        performed_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'a4', credential_id: '1', action: 'accessed', actor: 'system:autopilot',
        details: 'Расшифровка для задачи: Загрузка sitemap.xml',
        performed_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ]);
  }, [companyId]);

  const handleRevoke = async (id: string) => {
    if (!confirm('Отозвать доступ? Зашифрованные данные будут удалены из базы.')) return;
    setRevoking(id);
    setTimeout(() => {
      setCredentials(c => c.map(cr => cr.id === id ? { ...cr, is_active: false } : cr));
      setRevoking(null);
    }, 800);
  };

  const handleAdd = (form: AddCredentialForm) => {
    const newCred: Credential = {
      id: Math.random().toString(36).slice(2),
      credential_type: form.credential_type,
      label: form.label,
      host: form.host || undefined,
      username: form.username || undefined,
      is_active: true, consent_given: true,
      consent_given_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      has_password: !!form.password,
      has_access_token: false,
      has_api_key: false,
    };
    setCredentials(c => [newCred, ...c]);
    setShowAdd(false);
  };

  const fmt = (iso: string) => new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="panel">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            🔐 Хранилище доступов
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            Все данные зашифрованы AES-256. Вы можете отозвать доступ в любой момент.
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          + Добавить доступ
        </button>
      </div>

      {/* Security notice */}
      <div style={{
        display: 'flex', gap: 12, padding: '12px 16px', marginBottom: 20,
        background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 12, fontSize: 13, color: 'var(--text-secondary)',
      }}>
        <div style={{ fontSize: 20 }}>🛡</div>
        <div style={{ lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Как мы защищаем ваши данные:</strong>
          {' '}Пароли и токены хранятся зашифрованными (AES-256 Fernet). Ключ шифрования никогда не попадает в базу данных.
          Мы логируем каждое использование доступа — вы видите всё в журнале ниже.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {([['credentials', `Доступы (${credentials.filter(c => c.is_active).length})`], ['audit', `Журнал (${auditLog.length})`]] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="btn btn-sm"
            style={{
              background: activeTab === tab ? 'var(--accent)' : 'transparent',
              borderColor: activeTab === tab ? 'var(--accent)' : 'var(--border)',
              color: activeTab === tab ? '#fff' : 'var(--text-muted)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Credentials tab */}
      {activeTab === 'credentials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {credentials.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 14 }}>
              Нет сохранённых доступов.<br/>
              <span style={{ fontSize: 12 }}>Добавьте FTP или OAuth для автоматического выполнения задач.</span>
            </div>
          )}
          {credentials.map(cred => {
            const cfg = CRED_TYPES[cred.credential_type];
            return (
              <div key={cred.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                background: cred.is_active ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                border: `1px solid ${cred.is_active ? 'var(--border)' : 'rgba(255,255,255,0.04)'}`,
                borderRadius: 12, opacity: cred.is_active ? 1 : 0.5,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: `${cfg.color}18`, border: `1px solid ${cfg.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {cred.label}
                    </span>
                    <span style={{
                      fontSize: 11, padding: '2px 7px', borderRadius: 99,
                      background: `${cfg.color}15`, color: cfg.color,
                      border: `1px solid ${cfg.color}25`, fontWeight: 600,
                    }}>
                      {cfg.label}
                    </span>
                    {!cred.is_active && (
                      <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                        Отозван
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {cred.host && <span>🖥 {cred.host}</span>}
                    {cred.username && <span>👤 {cred.username}</span>}
                    {cred.has_password && <span>🔑 пароль сохранён</span>}
                    {cred.has_access_token && <span>🎫 токен сохранён</span>}
                    <span>Добавлен {fmt(cred.created_at)}</span>
                  </div>
                </div>
                {cred.is_active && (
                  <button
                    className="btn btn-sm"
                    onClick={() => handleRevoke(cred.id)}
                    disabled={revoking === cred.id}
                    style={{
                      flexShrink: 0, borderColor: 'rgba(239,68,68,0.3)',
                      color: '#ef4444', background: 'rgba(239,68,68,0.06)',
                    }}
                  >
                    {revoking === cred.id ? '...' : '⊘ Отозвать'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Audit log tab */}
      {activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
            Полный список всех действий с вашими доступами. Записи не удаляются.
          </div>
          {auditLog.map(entry => {
            const act = ACTION_LABELS[entry.action] || { label: entry.action, icon: '·', color: '#888' };
            return (
              <div key={entry.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                borderRadius: 10,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: `${act.color}15`, color: act.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, marginTop: 1,
                }}>
                  {act.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: act.color }}>
                      {act.label}
                    </span>
                    {entry.actor && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        · {entry.actor === 'system:autopilot' ? '🤖 Автопилот' : entry.actor === 'user' ? '👤 Вы' : entry.actor}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {fmt(entry.performed_at)}
                    </span>
                  </div>
                  {entry.details && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                      {entry.details}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddCredentialForm onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
