/**
 * Port untuk E2E terhadap hasil build. Hanya dipakai pengujian lokal/CI,
 * tidak terkait port server staging atau produksi.
 */
export const ports = { public: 4100, outlet: 4101, portal: 4102, webAdmin: 4103 } as const;

export const baseUrls = {
  public: `http://localhost:${ports.public}`,
  outlet: `http://localhost:${ports.outlet}`,
  portal: `http://localhost:${ports.portal}`,
  webAdmin: `http://localhost:${ports.webAdmin}/web-admin`,
} as const;
