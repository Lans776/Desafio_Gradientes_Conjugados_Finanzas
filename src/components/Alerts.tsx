import type { ValidationMessage } from '../types';

export function Alerts({ messages }: { messages: ValidationMessage[] }) {
  if (messages.length === 0) return null;
  return (
    <div className="alerts" role="status">
      {messages.map((m, i) => (
        <div key={`${m.code}-${i}`} className={`alert alert-${m.level}`}>
          <strong>{m.level === 'error' ? 'Error' : m.level === 'warning' ? 'Aviso' : 'Información'}:</strong> {m.message}
        </div>
      ))}
    </div>
  );
}
