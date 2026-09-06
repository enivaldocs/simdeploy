import { ProviderRegistry } from "@simdeploy/provider-core";
import { LocalProvider } from "@simdeploy/provider-local";
import { env } from "../env";
import { sitesDir } from "../paths";

const globalStore = globalThis as unknown as { acProviderRegistry?: ProviderRegistry };

/**
 * Registry de providers com adapter de DEPLOY funcional. O Cloudflare entra
 * aqui quando seu deploy() for habilitado — o router só escolhe o que está
 * registrado, então habilitar um provider é registrá-lo.
 */
export function providerRegistry(): ProviderRegistry {
  if (!globalStore.acProviderRegistry) {
    const registry = new ProviderRegistry();
    registry.register(new LocalProvider({ sitesDir: sitesDir(), baseUrl: env().APP_URL }));
    globalStore.acProviderRegistry = registry;
  }
  return globalStore.acProviderRegistry;
}
