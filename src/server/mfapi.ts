import "server-only";

import type { InvestmentMarketQuote } from "@/server/yahoo-finance";

const mfapiBaseUrl = "https://api.mfapi.in";

type MfapiLatestResponse = {
  data?: {
    date?: unknown;
    nav?: unknown;
  }[];
  meta?: {
    scheme_code?: unknown;
    scheme_name?: unknown;
  };
  status?: unknown;
};

export async function getMfapiInvestmentMarketQuotes(
  schemeCodes: string[],
): Promise<Map<string, InvestmentMarketQuote>> {
  const uniqueSchemeCodes = Array.from(
    new Set(
      schemeCodes
        .map((schemeCode) => schemeCode.trim())
        .filter((schemeCode) => schemeCode.length > 0),
    ),
  );

  const quoteEntries = await Promise.all(
    uniqueSchemeCodes.map(async (schemeCode) => {
      const quote = await getMfapiLatestQuote(schemeCode);
      return [schemeCode, quote] as const;
    }),
  );

  const quotes = new Map<string, InvestmentMarketQuote>();

  for (const [schemeCode, quote] of quoteEntries) {
    if (quote) quotes.set(schemeCode, quote);
  }

  return quotes;
}

async function getMfapiLatestQuote(
  schemeCode: string,
): Promise<InvestmentMarketQuote | null> {
  try {
    const response = await fetch(
      `${mfapiBaseUrl}/mf/${encodeURIComponent(schemeCode)}/latest`,
      { cache: "no-store" },
    );

    if (!response.ok) return null;

    const payload = (await response.json()) as MfapiLatestResponse;
    const latestNav = payload.data?.[0];
    const price =
      typeof latestNav?.nav === "string" ? Number(latestNav.nav) : null;

    if (price === null || !Number.isFinite(price) || price <= 0) return null;

    return {
      currency: "INR",
      name:
        typeof payload.meta?.scheme_name === "string"
          ? payload.meta.scheme_name
          : null,
      price,
      quoteType: "MUTUALFUND",
      regularMarketTime:
        typeof latestNav?.date === "string"
          ? parseMfapiDate(latestNav.date)
          : null,
      source: "mfapi",
      sourceSymbol:
        typeof payload.meta?.scheme_code === "number"
          ? String(payload.meta.scheme_code)
          : schemeCode,
    };
  } catch {
    return null;
  }
}

function parseMfapiDate(value: string) {
  const [day, month, year] = value.split("-").map(Number);

  if (!day || !month || !year) return null;

  return new Date(Date.UTC(year, month - 1, day));
}
