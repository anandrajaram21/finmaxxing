import "server-only";

import YahooFinance from "yahoo-finance2";
import type { Quote, QuoteField } from "yahoo-finance2/modules/quote";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

const quoteFields = [
  "currency",
  "longName",
  "quoteType",
  "regularMarketPrice",
  "regularMarketTime",
  "shortName",
  "symbol",
] satisfies QuoteField[];

export type InvestmentMarketQuote = {
  currency: string | null;
  name: string | null;
  price: number;
  quoteType: string | null;
  regularMarketTime: Date | null;
  source: "yahoo" | "mfapi";
  sourceSymbol: string;
};

export async function getYahooInvestmentMarketQuotes(
  tickerSymbols: string[],
): Promise<Map<string, InvestmentMarketQuote>> {
  const uniqueTickerSymbols = Array.from(
    new Set(
      tickerSymbols
        .map((tickerSymbol) => tickerSymbol.trim())
        .filter((tickerSymbol) => tickerSymbol.length > 0),
    ),
  );

  const quoteEntries = await Promise.all(
    uniqueTickerSymbols.map(async (tickerSymbol) => {
      const quote = await getInvestmentMarketQuote(tickerSymbol);
      return [tickerSymbol, quote] as const;
    }),
  );

  const quotes = new Map<string, InvestmentMarketQuote>();

  for (const [tickerSymbol, quote] of quoteEntries) {
    if (quote) quotes.set(tickerSymbol, quote);
  }

  return quotes;
}

async function getInvestmentMarketQuote(
  tickerSymbol: string,
): Promise<InvestmentMarketQuote | null> {
  for (const candidate of getYahooTickerCandidates(tickerSymbol)) {
    const quote = await getYahooQuote(candidate);
    if (!quote) continue;

    const price =
      typeof quote.regularMarketPrice === "number"
        ? quote.regularMarketPrice
        : null;

    if (price === null || price <= 0) continue;

    return {
      currency:
        typeof quote.currency === "string" && quote.currency.length > 0
          ? quote.currency
          : null,
      name: getQuoteName(quote),
      price,
      quoteType:
        typeof quote.quoteType === "string" && quote.quoteType.length > 0
          ? quote.quoteType
          : null,
      regularMarketTime:
        quote.regularMarketTime instanceof Date
          ? quote.regularMarketTime
          : null,
      source: "yahoo",
      sourceSymbol:
        typeof quote.symbol === "string" && quote.symbol.length > 0
          ? quote.symbol
          : candidate,
    };
  }

  return null;
}

async function getYahooQuote(tickerSymbol: string) {
  try {
    return (await yahooFinance.quote(tickerSymbol, {
      fields: quoteFields,
    })) as Partial<Quote> | undefined;
  } catch {
    return undefined;
  }
}

function getYahooTickerCandidates(tickerSymbol: string) {
  const normalizedTickerSymbol = tickerSymbol.trim().toUpperCase();
  const candidates = [normalizedTickerSymbol];

  if (!normalizedTickerSymbol.includes(".")) {
    candidates.push(
      `${normalizedTickerSymbol}.NS`,
      `${normalizedTickerSymbol}.BO`,
    );
  }

  return Array.from(new Set(candidates));
}

function getQuoteName(quote: Partial<Quote>) {
  if (typeof quote.longName === "string" && quote.longName.length > 0) {
    return quote.longName;
  }

  if (typeof quote.shortName === "string" && quote.shortName.length > 0) {
    return quote.shortName;
  }

  return null;
}
