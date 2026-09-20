export type UserRole = 'cliente' | 'admin';

export type PublicUser = {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
};

export type AuthLoginResponse = {
  accessToken: string;
  user: PublicUser;
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

export type CreateProductInput = {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export type OrderStatus =
  | 'PENDIENTE'
  | 'PAGADO'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
};

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatusChangedEvent = {
  orderId: string;
  userId: string;
  status: OrderStatus;
};
