import { Injectable } from '@nestjs/common';
import { Cart as PrismaCart, CartItem as PrismaCartItem, Prisma, Product } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service.js';
import { CartItem } from '../../domain/entities/cart-item.entity.js';
import { Cart } from '../../domain/entities/cart.entity.js';
import type { ICartRepository } from '../../domain/interfaces/cart-repository.interface.js';

type CartRecord = PrismaCart & {
  items: (PrismaCartItem & { product: Product })[];
};

const cartInclude = {
  items: {
    include: { product: true },
    orderBy: { id: 'asc' as const },
  },
};

@Injectable()
export class PrismaCartRepository implements ICartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Cart | null> {
    const row = await this.prisma.cart.findUnique({
      where: { userId },
      include: cartInclude,
    });
    return row ? this.toDomain(row) : null;
  }

  async create(userId: string): Promise<Cart> {
    const row = await this.prisma.cart.create({
      data: { userId },
      include: cartInclude,
    });
    return this.toDomain(row);
  }

  async upsertItem(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart> {
    const row = await this.prisma.cart.update({
      where: { id: cartId },
      data: {
        items: {
          upsert: {
            where: {
              cartId_productId: { cartId, productId },
            },
            create: { productId, quantity },
            update: { quantity },
          },
        },
      },
      include: cartInclude,
    });
    return this.toDomain(row);
  }

  async removeItem(cartId: string, productId: string): Promise<Cart> {
    await this.prisma.cartItem.delete({
      where: { cartId_productId: { cartId, productId } },
    });

    const row = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cartId },
      include: cartInclude,
    });
    return this.toDomain(row);
  }

  async clear(cartId: string, tx?: unknown): Promise<void> {
    const db = (tx as Prisma.TransactionClient | undefined) ?? this.prisma;
    await db.cartItem.deleteMany({ where: { cartId } });
  }

  private toDomain(row: CartRecord): Cart {
    return new Cart(
      row.id,
      row.userId,
      row.items.map(
        (item) =>
          new CartItem(
            item.id,
            item.productId,
            item.quantity,
            item.product.name,
            Number(item.product.price),
            item.product.stock,
            item.product.images[0] ?? null,
          ),
      ),
      row.updatedAt,
    );
  }
}
