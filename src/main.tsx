import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { registerServiceWorker } from './pwa/registerServiceWorker';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento raiz #root não encontrado.');
}

const root = createRoot(rootElement);

const renderStartupFailure = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || 'Erro desconhecido');
  root.render(
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0c0a09', color: '#f5f5f4', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 560, border: '1px solid #44403c', borderRadius: 20, background: '#1c1917', padding: 28 }}>
        <h1 style={{ margin: '0 0 12px', fontSize: 22 }}>Falha ao iniciar o Hotel OS</h1>
        <p style={{ margin: '0 0 16px', color: '#d6d3d1', lineHeight: 1.5 }}>
          A aplicação foi carregada, mas um módulo falhou durante a inicialização. Esta tela evita que o sistema fique totalmente em branco.
        </p>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', borderRadius: 12, background: '#0c0a09', padding: 14, color: '#fda4af', fontSize: 12 }}>{message}</pre>
        <button type="button" onClick={() => window.location.reload()} style={{ marginTop: 16, border: 0, borderRadius: 12, background: '#f59e0b', color: '#1c1917', padding: '11px 16px', fontWeight: 800, cursor: 'pointer' }}>
          Recarregar
        </button>
      </div>
    </div>,
  );
};

registerServiceWorker();

void import('./App.tsx')
  .then(({ default: App }) => {
    root.render(
      <StrictMode>
        <GlobalErrorBoundary>
          <App />
        </GlobalErrorBoundary>
      </StrictMode>,
    );
  })
  .catch(error => {
    console.error('Falha fatal durante o bootstrap do Hotel OS:', error);
    renderStartupFailure(error);
  });
