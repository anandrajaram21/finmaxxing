export const investmentTypes = ["stock", "mutual_fund"] as const;

export type InvestmentType = (typeof investmentTypes)[number];

export const investmentTypeLabels: Record<InvestmentType, string> = {
  mutual_fund: "Mutual fund",
  stock: "Stock",
};

export function formatInvestmentType(investmentType: InvestmentType) {
  return investmentTypeLabels[investmentType];
}
