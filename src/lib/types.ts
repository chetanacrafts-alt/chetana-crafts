export interface Order {
  id: string;
  date: string;
  name: string;
  phone: string;
  channel: string;
  product: string;
  price: number;
  cost: number;
  qty: number;
  status: string;
  stockCode: string;
  payMode: string;
  paidAmount: number;
  dueAmount: number;
  notify: boolean;
}

export interface StockItem {
  id: string;
  code: string;
  name: string;
  cat: string;
  color: string;
  source: string;
  cost: number;
  sell: number;
  qty: number;
  low: number;
}

export interface Expense {
  id: string;
  date: string;
  name: string;
  amt: number;
  cat: string;
}

export interface PurchaseItem {
  id: string;
  code: string;
  name: string;
  color: string;
  qty: number;
  cost: number;
  sell: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplier: string;
  city: string;
  items: PurchaseItem[];
  total: number;
  extra: number;
  photo: string;
}

export interface OnlineSale {
  id: string;
  date: string;
  platform: string;
  orderid: string;
  product: string;
  stockCode: string;
  qty: number;
  value: number;
  fee: number;
  shipping: number;
  cost: number;
  payout: number;
  status: string;
}

export interface ReturnItem {
  id: string;
  date: string;
  name: string;
  phone: string;
  stockCode: string;
  product: string;
  qty: number;
  amount: number;
  reason: string;
  refundMode: string;
  origin: string;
}

export interface BusinessSettings {
  name: string;
  gstin: string;
  phone: string;
  addr: string;
}

export interface ChetanaDB {
  orders: Order[];
  stock: StockItem[];
  expenses: Expense[];
  purchases: Purchase[];
  online: OnlineSale[];
  returns: ReturnItem[];
  platforms: string[];
  settings: BusinessSettings;
}
