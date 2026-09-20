export type UserRole = "cliente" | "admin";

export type PublicUser = {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: string;
  createdAt: string;
};

export type ProductFilters = {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  productName: string;
  unitPrice: number;
  stock: number;
  image: string | null;
};

export type Cart = {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
};

export type OrderStatus =
  | "PENDIENTE"
  | "PAGADO"
  | "ENVIADO"
  | "ENTREGADO"
  | "CANCELADO";

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
};

export type AuthLoginResponse = {
  accessToken: string;
  user: PublicUser;
};

export type ChargeResponse = {
  order: Order;
  payment: {
    status: string;
    transactionId: string | null;
  };
};
