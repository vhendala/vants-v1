import path from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * WHY: Next.js 16 usa Turbopack por padrão.
   * - `root`: aponta para a raiz do monorepo para resolver o warning de múltiplos lockfiles.
   * O Turbopack já trata módulos exclusivos do Node (fs, crypto, stream, etc.) como
   * ausentes no bundle do browser, sem necessidade de configuração adicional.
   */
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
