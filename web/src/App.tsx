import { useEffect, useState } from 'react';

type ApiState = 'loading' | 'ok' | 'error';

export function App() {
  const [api, setApi] = useState<ApiState>('loading');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body: { status: string }) => setApi(body.status === 'ok' ? 'ok' : 'error'))
      .catch(() => setApi('error'));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>PL-Cockpit</h1>
      <p>API: {api === 'loading' ? 'wird geprüft …' : api === 'ok' ? 'ok' : 'nicht erreichbar'}</p>
    </main>
  );
}
