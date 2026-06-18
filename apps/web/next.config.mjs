/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { instrumentationHook: true, serverComponentsExternalPackages: ["pdfkit"] },
  transpilePackages: ["@xentral/config", "@xentral/ui", "@xentral/module-marketing", "@xentral/kernel", "@xentral/locale-pack", "@xentral/update-pack", "@xentral/module-books", "@xentral/module-crm", "@xentral/module-erp"],
};
export default nextConfig;
