import {StrictMode, Component, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

type State = { error: Error | null };

type ErrorProps = { children?: ReactNode };

// ErrorBoundary, React.Component'ten türetilir; bu projedeki tipler
// sınıf alanları (this.props/setState) için tam çözülmediğinden `as any`
// ile sadece MANTIK tip güvenliğini atlanır (runtime davranışı aynıdır).
class ErrorBoundary extends (Component as any) {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }
  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("[react-error]", error, info);
    try {
      localStorage.setItem("mht_last_error", `${error.message}\n${info.componentStack ?? ""}`);
    } catch { /* dolu olabilir */ }
  }
  retry = () => {
    this.setState({ error: null });
  };
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", color: "#111" }}>
          <h2>Bir hata oluştu</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "#f5f5f5", padding: 12, borderRadius: 8 }}>
            {String(this.state.error.message)}
          </pre>
          <button onClick={this.retry}
            style={{ marginTop: 12, padding: "8px 16px", borderRadius: 8, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}>
            Yeniden dene
          </button>
        </div>
      );
    }
    return this.props.children ?? null;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

window.addEventListener("error", (ev) => {
  try {
    const msg = ev?.error?.message ?? String(ev?.message ?? "unknown");
    localStorage.setItem("mht_last_error", `[error] ${msg}`);
  } catch { /* dolu olabilir */ }
});
window.addEventListener("unhandledrejection", (ev) => {
  try {
    const msg = ev?.reason?.message ?? String(ev?.reason ?? "unknown rejection");
    localStorage.setItem("mht_last_error", `[unhandledrejection] ${msg}`);
  } catch { /* dolu olabilir */ }
});
