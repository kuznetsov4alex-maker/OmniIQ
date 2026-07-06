'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface Props {
  companyId: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const SOURCES = ['website', 'blog', 'press release', 'linkedin', 'documentation', 'other'];

export default function KnowledgePanel({ companyId, showToast }: Props) {
  const [content, setContent] = useState('');
  const [source, setSource] = useState('website');
  const [submitting, setSubmitting] = useState(false);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.ingestKnowledge(companyId, { content: content.trim(), source }) as { chunks_created: number; entities_extracted: number };
      showToast(`Ingested: ${res.chunks_created} chunks, ${res.entities_extracted} entities extracted`);
      setContent('');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Ingest failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="grid-2" style={{ gap: 24 }}>
        {/* Ingest form */}
        <div className="card">
          <div className="card-title">Импорт информации</div>
          <form onSubmit={handleIngest}>
            <div className="form-group">
              <label className="form-label">Тип источника</label>
              <select className="form-select" value={source} onChange={e => setSource(e.target.value)}>
                <option value="website">Веб-сайт</option>
                <option value="blog">Блог / Статья</option>
                <option value="press release">Пресс-релиз</option>
                <option value="linkedin">Социальные сети</option>
                <option value="documentation">Документация / Продукты</option>
                <option value="other">Другое</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Текст для анализа</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: 200 }}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Вставьте описание вашей компании, информацию о продуктах, тексты о компании из соцсетей или пресс-релизы — любой текст, описывающий ваш бизнес..."
              />
            </div>
            <button className="btn btn-primary" disabled={submitting || !content.trim()}>
              {submitting ? <><span className="spinner" /> Анализируем контент…</> : '🧠 Импортировать и извлечь факты'}
            </button>
          </form>
        </div>

        {/* Info panel */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">Что происходит при импорте?</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <div style={{ marginBottom: 10 }}>
                <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>1. Разбивка на фрагменты</span><br />
                Текст делится на небольшие смысловые части (фрагменты по 500 токенов) с пересечением для сохранения контекста.
              </div>
              <div style={{ marginBottom: 10 }}>
                <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>2. Векторизация (Embeddings)</span><br />
                Каждый фрагмент переводится в математический вектор для семантического поиска ИИ-ассистентами.
              </div>
              <div>
                <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>3. Извлечение сущностей (Entity Graph)</span><br />
                GPT-4o извлекает ключевые факты — продукты, имена, локации, услуги — формируя базу знаний о компании для ИИ.
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Советы для лучшего результата</div>
            <ul style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 16, lineHeight: 1.8 }}>
              <li>Добавьте текст со страницы «О компании»</li>
              <li>Опишите ваши ключевые продукты и услуги</li>
              <li>Используйте пресс-релизы и новости компании</li>
              <li>Скопируйте описание компании из социальных сетей</li>
              <li>Вставляйте только достоверные факты</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
