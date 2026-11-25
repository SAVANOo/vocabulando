import { registerRootComponent } from "expo";
import MobileApp from "./src/App";

// Handler global defensivo: evita exposição de stack traces não tratados em runtime
const globalScope = globalThis as typeof globalThis & {
  ErrorUtils?: {
    getGlobalHandler?: () => (error: unknown, isFatal?: boolean) => void;
    setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
  };
};

if (globalScope.ErrorUtils?.setGlobalHandler) {
  const defaultHandler = globalScope.ErrorUtils.getGlobalHandler?.();
  globalScope.ErrorUtils.setGlobalHandler((error, isFatal) => {
    if (__DEV__ && defaultHandler) {
      defaultHandler(error, isFatal);
      return;
    }
    // Em release, não propaga detalhes técnicos para a tela do usuário
  });
}

registerRootComponent(MobileApp);
