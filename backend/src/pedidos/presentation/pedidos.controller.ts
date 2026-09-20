import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/infrastructure/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../../shared/infrastructure/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../shared/infrastructure/guards/jwt-auth.guard.js';
import { Roles } from '../../shared/infrastructure/guards/roles.decorator.js';
import { RolesGuard } from '../../shared/infrastructure/guards/roles.guard.js';
import { CreateOrderDto } from '../application/dto/create-order.dto.js';
import { UpdateOrderStatusDto } from '../application/dto/update-order-status.dto.js';
import { OrderService } from '../application/services/order.service.js';

@Controller('pedidos')
@UseGuards(JwtAuthGuard)
export class PedidosController {
  constructor(private readonly orders: OrderService) {}

  @Post('checkout')
  checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() _dto: CreateOrderDto,
  ) {
    return this.orders.checkout(user.id);
  }

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.orders.listByUser(user.id);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  listAll() {
    return this.orders.listAll();
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.orders.getById(id, user);
  }

  @Patch(':id/estado')
  @UseGuards(RolesGuard)
  @Roles('admin')
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.changeStatus(id, dto.status);
  }
}
