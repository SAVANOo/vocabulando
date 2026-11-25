import React from "react";

interface State {
  hasError: boolean;
}

/**
 * ErrorBoundary global da Web.
 * Impede vazamento de stack traces, versões de pacotes ou caminhos internos na UI.
 */
export class SafeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch() {
    // Falha capturada de forma segura sem expor detalhes técnicos no DOM
  }

  override render() {
    if (this.state.hasError) {
      return (
        <main className="container" style={{ paddingTop: "4rem", textAlign: "center" }}>
          <div className="word-card" style={{ maxWidth: "460px", margin: "0 auto" }}>
            <h2>Algo inesperado aconteceu</h2>
            <p style={{ color: "var(--muted)" }}>
              Sua sessão está protegida. Recarregue a página ou tente novamente.
            </p>
            <button
              type="button"
              className="btn primary"
              onClick={() => this.setState({ hasError: false })}
            >
              Tentar novamente
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
