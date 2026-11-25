import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface State {
  hasError: boolean;
}

/**
 * ErrorBoundary global do Mobile.
 * Garante que nenhum stack trace, caminho interno ou versão de biblioteca
 * seja exposto ao usuário final em caso de falha inesperada.
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
    // Em produção, enviar apenas evento sanitizado para observabilidade (sem PII)
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <View style={styles.root}>
          <Text style={styles.title}>Algo inesperado aconteceu</Text>
          <Text style={styles.subtitle}>
            Protegemos sua sessão e seu progresso continua salvo. Tente recarregar a tela.
          </Text>
          <Pressable style={styles.btn} onPress={this.handleReset}>
            <Text style={styles.btnText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f6f3ec",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 12,
  },
  title: { color: "#1c1b18", fontSize: 20, fontWeight: "700", textAlign: "center" },
  subtitle: { color: "#656056", fontSize: 14, textAlign: "center", lineHeight: 20 },
  btn: {
    backgroundColor: "#246a52",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  btnText: { color: "#ffffff", fontWeight: "700", fontSize: 14 },
});
