interface AgingBucket {
  count: number;
  amount: string;
}

interface StockBucket {
  count: number;
  buy_value: string;
}

export interface DashboardStats {
  inventory: {
    available: number;
    sold_cash: number;
    ongoing_installment: number;
    installment_paid: number;
    available_buy_value: string;
    stock_aging: {
      d0_30: StockBucket;
      d31_60: StockBucket;
      d61_90: StockBucket;
      d90_plus: StockBucket;
    };
    avg_days_to_sell: number | null;
  };
  sales: {
    count: number;
    revenue: string;
    profit: string;
    cash: number;
    credit: number;
    profit_by_tag: { tag: string; profit: string; count: number }[];
  };
  credit: {
    outstanding: string;
    overdue_installments: number;
    overdue_amount: string;
    collections_by_month: { month: string; amount: string }[];
    aging: {
      d1_30: AgingBucket;
      d31_60: AgingBucket;
      d60_plus: AgingBucket;
    };
    paid_total: number;
    paid_on_time: number;
  };
  revenue_by_month: { month: string; revenue: string; profit: string }[];
}
