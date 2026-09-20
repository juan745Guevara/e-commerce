export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : `Error ${status}`;
    super(message);
    this.name = "ApiError";
  }
}

type ApiClientOptions = {
  baseUrl: string;
  getToken?: () => string | undefined | Promise<string | undefined>;
};

type RequestOptions = Omit<RequestInit, "headers"> & {
  revalidate?: number;
};

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  listCategories(revalidate?: number) {
    return this.request<import("./types").Category[]>("/catalogo/categorias", {
      revalidate,
    });
  }

  getCategory(id: string) {
    return this.request<import("./types").Category>(
      `/catalogo/categorias/${id}`,
    );
  }

  listProducts(
    filters: import("./types").ProductFilters = {},
    revalidate?: number,
  ) {
    const query = new URLSearchParams();
    if (filters.categoryId) query.set("categoryId", filters.categoryId);
    if (filters.minPrice !== undefined) {
      query.set("minPrice", String(filters.minPrice));
    }
    if (filters.maxPrice !== undefined) {
      query.set("maxPrice", String(filters.maxPrice));
    }
    if (filters.search) query.set("search", filters.search);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return this.request<import("./types").Product[]>(
      `/catalogo/productos${suffix}`,
      { revalidate },
    );
  }

  getProduct(id: string, revalidate?: number) {
    return this.request<import("./types").Product>(`/catalogo/productos/${id}`, {
      revalidate,
    });
  }

  register(input: { email: string; password: string; phone?: string }) {
    return this.request<import("./types").PublicUser>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  login(input: { email: string; password: string }) {
    return this.request<import("./types").AuthLoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  getCart() {
    return this.request<import("./types").Cart>("/carrito");
  }

  addCartItem(productId: string, quantity: number) {
    return this.request<import("./types").Cart>("/carrito/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
  }

  updateCartItem(productId: string, quantity: number) {
    return this.request<import("./types").Cart>(`/carrito/items/${productId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
  }

  removeCartItem(productId: string) {
    return this.request<import("./types").Cart>(`/carrito/items/${productId}`, {
      method: "DELETE",
    });
  }

  checkout() {
    return this.request<import("./types").Order>("/pedidos/checkout", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  listMyOrders() {
    return this.request<import("./types").Order[]>("/pedidos");
  }

  getOrder(id: string) {
    return this.request<import("./types").Order>(`/pedidos/${id}`);
  }

  charge(orderId: string, token: string) {
    return this.request<import("./types").ChargeResponse>("/pagos/charge", {
      method: "POST",
      body: JSON.stringify({ orderId, token }),
    });
  }

  private async request<T>(path: string, init: RequestOptions = {}): Promise<T> {
    const token = await this.options.getToken?.();
    const headers = new Headers();
    if (init.body) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const { revalidate, ...rest } = init;
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...rest,
      headers,
      ...(revalidate !== undefined ? { next: { revalidate } } : {}),
    });

    if (!response.ok) {
      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        body = await response.text();
      }
      throw new ApiError(response.status, body);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}
