'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, type Company } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────
interface Integration {
  id: string;
  type: 'ftp' | 'yandex_oauth' | 'wordpress' | 'vk';
  status: 'connected' | 'disconnected' | 'error';
  label?: string;
  unlocked_tasks: string[];
  connected_at?: string;
}

interface IntegrationStatus {
  total: number;
  connected: number;
  integration_types: {
    ftp: boolean;
    yandex_oauth: boolean;
    wordpress: boolean;
    vk: boolean;
  };
}

// ── Integration definitions ──────────────────────────────────────
const INTEGRATION_DEFS = [
  {
    type: 'ftp' as const,
    icon: '◎',
    color: 'var(--indigo)',
    colorAlpha: 'rgba(99,102,241,0.08)',
    colorBorder: 'rgba(99,102,241,0.2)',
    title: 'FTP / SSH хостинг',
    subtitle: 'Подключите хостинг — платформа деплоит файлы сама',
    unlocks: [
      'Автодеплой robots.txt и sitemap.xml',
      'Внедрение Schema.org разметки',
      'Загрузка файла верификации Яндекс.Вебмастер',
      'Настройка редиректа HTTP→HTTPS',
      'Деплой мета-тегов в <head>',
    ],
    unlocksCount: 6,
    fields: [
      { key: 'host', label: 'Хост (FTP-сервер)', placeholder: 'ftp.ваш-сайт.ru', type: 'text' },
      { key: 'username', label: 'Логин', placeholder: 'u12345678', type: 'text' },
      { key: 'password', label: 'Пароль', placeholder: '••••••••', type: 'password' },
      { key: 'root_path', label: 'Корневая папка', placeholder: '/public_html', type: 'text' },
    ],
  },
  {
    type: 'yandex_oauth' as const,
    icon: '◈',
    color: 'var(--violet)',
    colorAlpha: 'rgba(139,92,246,0.08)',
    colorBorder: 'rgba(139,92,246,0.2)',
    title: 'Яндекс.Вебмастер',
    subtitle: 'OAuth-авторизация — трекинг позиций и управление индексацией',
    unlocks: [
      'Ежедневный трекинг позиций в Яндексе',
      'Автоотправка sitemap в Яндекс.Вебмастер',
      'IndexNow-пинги при обновлении сайта',
      'Отчёты о краулинге и ошибках',
    ],
    unlocksCount: 4,
    fields: [
      { key: 'access_token', label: 'OAuth токен Яндекс', placeholder: 'y0_AgAAAA...', type: 'password' },
    ],
    oauthHint: 'Получить токен: passport.yandex.ru → OAuth',
  },
  {
    type: 'wordpress' as const,
    icon: '⬡',
    color: 'var(--cyan)',
    colorAlpha: 'rgba(6,182,212,0.08)',
    colorBorder: 'rgba(6,182,212,0.2)',
    title: 'WordPress / CMS',
    subtitle: 'API-доступ к сайту для автопубликации статей и мета-тегов',
    unlocks: [
      'Автопубликация тематических статей',
      'Обновление мета-тегов через CMS API',
      'Создание FAQ-страниц',
    ],
    unlocksCount: 3,
    fields: [
      { key: 'site_url', label: 'Адрес сайта', placeholder: 'https://ваш-сайт.ru', type: 'text' },
      { key: 'username', label: 'Логин WordPress', placeholder: 'admin', type: 'text' },
      { key: 'app_password', label: 'Application Password', placeholder: 'xxxx xxxx xxxx xxxx', type: 'password' },
    ],
    hint: 'WordPress → Пользователи → Пароли приложений',
  },
  {
    type: 'vk' as const,
    icon: '◉',
    color: 'var(--emerald)',
    colorAlpha: 'rgba(16,185,129,0.08)',
    colorBorder: 'rgba(16,185,129,0.2)',
    title: 'ВКонтакте',
    subtitle: 'Автообновление профиля VK-страницы компании',
    unlocks: [
      'Автообновление телефона, адреса, сайта в VK',
      'Публикация анонсов к статьям',
    ],
    unlocksCount: 2,
    fields: [
      { key: 'access_token', label: 'VK Access Token', placeholder: 'vk1.a.xxx...', type: 'password' },
      { key: 'group_id', label: 'ID сообщества', placeholder: '123456789', type: 'text' },
    ],
    hint: 'VK для разработчиков → vk.com/dev → OAuth',
  },
];

// ── Integration Card ──────────────────────────────────────────────
function IntegrationCard({
  def,
  integration,
  onSave,
  onDisconnect,
}: {
  def: typeof INTEGRATION_DEFS[number];
  integration?: Integration;
  onSave: (type: string, creds: Record<string, string>) => Promise<void>;
  onDisconnect: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const isConnected = integration?.status === 'connected';

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(def.type, form);
      setExpanded(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      border: `1px solid ${isConnected ? def.colorBorder : 'var(--border)'}`,
      borderRadius: 'var(--r-lg)',
      background: isConnected ? def.colorAlpha : 'var(--surface)',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '18px 20px', cursor: 'pointer',
      }} onClick={() => !isConnected && setExpanded(e => !e)}>
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: isConnected ? def.colorAlpha : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isConnected ? def.colorBorder : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: isConnected ? def.color : 'var(--text-secondary)',
          flexShrink: 0,
        }}>
          {def.icon}
        </div>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
            {def.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {def.subtitle}
          </div>
        </div>

        {/* Status / action */}
        {isConnected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 12, fontWeight: 600, color: 'var(--emerald)',
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 99, padding: '3px 10px',
            }}>
              ✓ Подключено
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={e => { e.stopPropagation(); integration && onDisconnect(integration.id); }}
            >
              Отключить
            </button>
          </div>
        ) : (
          <button
            className="btn btn-ghost btn-sm"
            onClick={e => { e.stopPropagation(); setExpanded(e2 => !e2); }}
            style={{ color: def.color, borderColor: def.colorBorder }}
          >
            {expanded ? '✕ Закрыть' : `+ Подключить`}
          </button>
        )}
      </div>

      {/* Unlocks list */}
      <div style={{ padding: '0 20px 16px 78px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {def.unlocks.map(u => (
          <span key={u} style={{
            fontSize: 11, padding: '3px 9px', borderRadius: 99,
            background: isConnected ? def.colorAlpha : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isConnected ? def.colorBorder : 'var(--border)'}`,
            color: isConnected ? def.color : 'var(--text-muted)',
          }}>
            {isConnected ? '✓ ' : ''}{u}
          </span>
        ))}
      </div>

      {/* Expanded form */}
      {expanded && !isConnected && (
        <div style={{
          padding: '0 20px 20px',
          borderTop: '1px solid var(--border)',
          paddingTop: 20,
          background: 'rgba(0,0,0,0.12)',
        }}>
          {'hint' in def && def.hint && (
            <div style={{
              fontSize: 12, color: 'var(--text-muted)', marginBottom: 14,
              padding: '8px 12px', background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)', borderRadius: 8,
            }}>
              💡 {def.hint}
            </div>
          )}
          {'oauthHint' in def && def.oauthHint && (
            <div style={{
              fontSize: 12, color: 'var(--text-muted)', marginBottom: 14,
              padding: '8px 12px', background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)', borderRadius: 8,
            }}>
              💡 {def.oauthHint}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {def.fields.map(f => (
              <div key={f.key} className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{f.label}</label>
                <input
                  className="form-input"
                  type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  autoComplete="off"
                />
              </div>
            ))}
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ borderColor: def.color, background: def.color }}
          >
            {saving ? <span className="spinner" /> : def.icon}
            {saving ? 'Сохраняем…' : `Подключить ${def.title}`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────
export default function IntegrationsPanel({
  company,
  showToast,
}: {
  company: Company;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [list, stat] = await Promise.all([
        api.listIntegrations(company.id),
        api.getIntegrationStatus(company.id),
      ]);
      setIntegrations(list.items);
      setStatus(stat);
    } catch {
      // silent — integrations endpoint may not exist yet
    } finally {
      setLoading(false);
    }
  }, [company.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (type: string, creds: Record<string, string>) => {
    try {
      await api.saveIntegration(company.id, { type, credentials: creds });
      showToast(`${type === 'ftp' ? 'FTP' : type} подключён — новые задачи разблокированы`);
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Ошибка подключения', 'error');
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      await api.disconnectIntegration(company.id, integrationId);
      showToast('Интеграция отключена');
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Ошибка', 'error');
    }
  };

  const connectedCount = status?.connected ?? 0;
  const totalUnlocked = integrations.reduce((sum, i) => sum + (i.unlocked_tasks?.length ?? 0), 0);

  return (
    <div>
      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 'var(--r-lg)',
        padding: '24px 28px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Автопилот интеграций
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 480 }}>
            Подключите сервисы один раз — платформа будет выполнять задачи автоматически,
            без вашего участия.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 32, fontWeight: 800, color: 'var(--accent-light)',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {loading ? '—' : connectedCount}
              <span style={{ fontSize: 16, color: 'var(--text-muted)', fontFamily: 'inherit' }}>/4</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>подключено</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 32, fontWeight: 800, color: 'var(--emerald)',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {loading ? '—' : totalUnlocked}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>задач на автопилоте</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {!loading && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
            <span>Уровень автоматизации</span>
            <span>{Math.round((connectedCount / 4) * 100)}%</span>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(connectedCount / 4) * 100}%`,
              background: 'linear-gradient(90deg, var(--accent), var(--violet))',
              borderRadius: 99,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      )}

      {/* Integration cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {INTEGRATION_DEFS.map(def => {
          const existing = integrations.find(i => i.type === def.type);
          return (
            <IntegrationCard
              key={def.type}
              def={def}
              integration={existing}
              onSave={handleSave}
              onDisconnect={handleDisconnect}
            />
          );
        })}
      </div>

      {/* Info note */}
      <div style={{
        marginTop: 24, fontSize: 12, color: 'var(--text-muted)',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
      }}>
        🔒 Все учётные данные хранятся в зашифрованном виде. Мы никогда не передаём их третьим лицам
        и используем только для выполнения задач автоматизации в рамках вашего проекта.
      </div>
    </div>
  );
}
