export interface DashboardStats {
  inventory: {
    available: number;
    reserved: number;
    sold: number;
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
  sales_by_tag: { tag: string; count: number }[];
}
