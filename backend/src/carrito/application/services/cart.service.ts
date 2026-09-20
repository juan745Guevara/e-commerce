import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IProductRepository } from '../../../catalogo/domain/interfaces/product-repository.interface.js';
import { PRODUCT_REPOSITORY } from '../../../catalogo/domain/interfaces/product-repository.interface.js';
import { Cart } from '../../domain/entities/cart.entity.js';
import type { ICartRepository } from '../../domain/interfaces/cart-repository.interface.js';
import { CART_REPOSITORY } from '../../domain/interfaces/cart-repository.interface.js';
import { AddCartItemDto } from '../dto/add-cart-item.dto.js';
import { toCartResponse } from '../dto/cart-response.js';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto.js';

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly carts: ICartRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: IProductRepository,
  ) {}

  async getCart(userId: string) {
    const cart = await this.getOrCreate(userId);
    return toCartResponse(cart);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const cart = await this.getOrCreate(userId);
    const product = await this.requireProduct(dto.productId);
    const currentQty = cart.itemByProductId(product.id)?.quantity ?? 0;
    const nextQty = currentQty + dto.quantity;
    this.assertStock(product.stock, nextQty);

    return toCartResponse(
      await this.carts.upsertItem(cart.id, product.id, nextQty),
    );
  }

  async updateItem(userId: string, productId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreate(userId);
    if (!cart.itemByProductId(productId)) {
      throw new NotFoundException('El producto no está en el carrito');
    }

    const product = await this.requireProduct(productId);
    this.assertStock(product.stock, dto.quantity);

    return toCartResponse(
      await this.carts.upsertItem(cart.id, productId, dto.quantity),
    );
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.getOrCreate(userId);
    if (!cart.itemByProductId(productId)) {
      throw new NotFoundException('El producto no está en el carrito');
    }

    return toCartResponse(await this.carts.removeItem(cart.id, productId));
  }

  private async getOrCreate(userId: string): Promise<Cart> {
    const existing = await this.carts.findByUserId(userId);
    if (existing) {
      return existing;
    }
    return this.carts.create(userId);
  }

  private async requireProduct(productId: string) {
    const product = await this.products.findById(productId);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }

  private assertStock(stock: number, quantity: number): void {
    if (quantity > stock) {
      throw new BadRequestException(
        'No hay stock suficiente para esa cantidad',
      );
    }
  }
}
