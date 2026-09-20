import { Injectable } from '@nestjs/common';
import {
  Prisma,
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
} from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service.js';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import { Order } from '../../domain/entities/order.entity.js';
import type { OrderStatus } from '../../domain/entities/order-status.js';
import type {
  CreateOrderData,
  IOrderRepository,
} from '../../domain/interfaces/order-repository.interface.js';

type OrderRecord = PrismaOrder & { items: PrismaOrderItem[] };

const orderInclude = {
  items: {
    orderBy: { id: 'asc' as const },
  },
};

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    return row ? this.toDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findAll(): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async create(data: CreateOrderData): Promise<Order> {
    const row = await this.prisma.order.create({
      data: {
        userId: data.userId,
        total: new Prisma.Decimal(data.total),
        status: 'PENDIENTE',
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            quantity: item.quantity,
          })),
        },
      },
      include: orderInclude,
    });
    return this.toDomain(row);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const row = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: orderInclude,
    });
    return this.toDomain(row);
  }

  private toDomain(row: OrderRecord): Order {
    return new Order(
      row.id,
      row.userId,
      row.status,
      row.items.map(
        (item) =>
          new OrderItem(
            item.id,
            item.productId,
            item.productName,
            Number(item.unitPrice),
            item.quantity,
          ),
      ),
      Number(row.total),
      row.createdAt,
      row.updatedAt,
    );
  }
}
