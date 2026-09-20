import { apiBaseUrl } from './config';
import { clearSession, getStoredToken } from './session';
import type {
  AuthLoginResponse,
  Category,
  CreateProductInput,
  Order,
  OrderStatus,
  Product,
  UpdateProductInput,
} from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(messageFromBody(body, status));
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = Omit<RequestInit, 'headers'>;

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  login(input: { email: string; password: string }) {
    return this.request<AuthLoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  listCategories() {
    return this.request<Category[]>('/catalogo/categorias');
  }

  createCategory(name: string) {
    return this.request<Category>('/catalogo/categorias', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  listProducts() {
    return this.request<Product[]>('/catalogo/productos');
  }

  createProduct(input: CreateProductInput) {
    return this.request<Product>('/catalogo/productos', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  updateProduct(id: string, input: UpdateProductInput) {
    return this.request<Product>(`/catalogo/productos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  deleteProduct(id: string) {
    return this.request<void>(`/catalogo/productos/${id}`, {
      method: 'DELETE',
    });
  }

  uploadProductImage(id: string, file: File) {
    const body = new FormData();
    body.append('file', file);
    return this.request<Product>(`/catalogo/productos/${id}/imagenes`, {
      method: 'POST',
      body,
    });
  }

  listAdminOrders() {
    return this.request<Order[]>('/pedidos/admin');
  }

  changeOrderStatus(id: string, status: OrderStatus) {
    return this.request<Order>(`/pedidos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  private async request<T>(path: string, init: RequestOptions = {}): Promise<T> {
    const headers = new Headers();
    const isForm = init.body instanceof FormData;
    if (init.body && !isForm) {
      headers.set('Content-Type', 'application/json');
    }

    const token = getStoredToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        body = await response.text();
      }
      if (response.status === 401 && path !== '/auth/login') {
        clearSession();
      }
      throw new ApiError(response.status, body);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }
}

export const api = new ApiClient(apiBaseUrl());

function messageFromBody(body: unknown, status: number): string {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message)) {
      return message.map(String).join(', ');
    }
  }
  return `Error ${status}`;
}
