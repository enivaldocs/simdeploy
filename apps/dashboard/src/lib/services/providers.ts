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
    const appUrl = env().APP_URL;
    const { protocol, hostname, port } = new URL(appUrl);
    registry.register(
      new LocalProvider({
        sitesDir: sitesDir(),
        baseUrl: appUrl,
        // Dev: <slug>.localhost:3000. Produção: <slug>.<apex> (o middleware
        // reescreve o Host para /sites/<slug> e o Caddy emite TLS on-demand).
        makeUrl: (slug) =>
          hostname === "localhost"
            ? `${protocol}//${slug}.localhost${port ? `:${port}` : ""}/`
            : `${protocol}//${slug}.${hostname}/`,
      }),
    );
    globalStore.acProviderRegistry = registry;
  }
  return globalStore.acProviderRegistry;
}
