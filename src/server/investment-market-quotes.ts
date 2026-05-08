import "server-only";

import type { InvestmentType } from "@/lib/investments";
import { getMfapiInvestmentMarketQuotes } from "@/server/mfapi";
import {
  getYahooInvestmentMarketQuotes,
  type InvestmentMarketQuote,
} from "@/server/yahoo-finance";

type InvestmentQuoteInput = {
  investmentType: InvestmentType;
  tickerSymbol: string;
};

export type { InvestmentMarketQuote };

export async function getInvestmentMarketQuotes(
  investments: InvestmentQuoteInput[],
): Promise<Map<string, InvestmentMarketQuote>> {
  const stockTickers = investments
    .filter((investment) => investment.investmentType === "stock")
    .map((investment) => investment.tickerSymbol);
  const mutualFundSchemeCodes = investments
    .filter((investment) => investment.investmentType === "mutual_fund")
    .map((investment) => investment.tickerSymbol);

  const [stockQuotes, mutualFundQuotes] = await Promise.all([
    getYahooInvestmentMarketQuotes(stockTickers),
    getMfapiInvestmentMarketQuotes(mutualFundSchemeCodes),
  ]);

  return new Map([...stockQuotes, ...mutualFundQuotes]);
}
