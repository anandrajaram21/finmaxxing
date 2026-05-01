import { FinanceWorkspace } from "@/app/_components/finance-workspace";

export default function AllocationsPage() {
  return (
    <FinanceWorkspace
      fieldOptions={{
        allocations: {
          goalId: [
            { label: "Retirement corpus", value: "retirement-corpus" },
            { label: "Home down payment", value: "home-down-payment" },
            { label: "Emergency reserve", value: "emergency-reserve" },
            { label: "Travel fund", value: "travel-fund" },
          ],
          investmentId: [
            { label: "Nifty 50 Index", value: "nifty-50-index" },
            { label: "Flexi Cap Fund", value: "flexi-cap-fund" },
            { label: "Short Duration Debt", value: "short-duration-debt" },
            { label: "Gold ETF", value: "gold-etf" },
          ],
        },
      }}
      sectionKey="allocations"
    />
  );
}
