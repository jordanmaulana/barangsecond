export interface DashboardStats {
  inventory: {
    available: number;
    sold_cash: number;
    ongoing_installment: number;
    installment_paid: number;
    available_buy_value: string;
  };
  sales: {
    count: number;
    revenue: string;
    profit: string;
    cash: number;
    credit: number;
  };
  credit: {
    outstanding: string;
    overdue_installments: number;
  };
  revenue_by_month: { month: string; revenue: string }[];
}
