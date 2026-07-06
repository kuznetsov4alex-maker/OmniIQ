'use client';

interface Props {
  message: string;
  type: 'success' | 'error';
}

export default function Toast({ message, type }: Props) {
  return (
    <div className={`toast toast-${type}`}>
      <span style={{ marginRight: 8 }}>{type === 'success' ? '✓' : '✕'}</span>
      {message}
    </div>
  );
}
