import type { ReactNode } from 'react';

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`card ${className ?? ''}`}>
      {title ? <h3>{title}</h3> : null}
      {children}
    </div>
  );
}

export function Badge({ ok, yes = 'Sí', no = 'No' }: { ok: boolean; yes?: string; no?: string }) {
  return <span className={`badge ${ok ? 'badge-ok' : 'badge-bad'}`}>{ok ? yes : no}</span>;
}
