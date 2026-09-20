import {
  Body,
  Controller,
  Delete,
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
import { AddCartItemDto } from '../application/dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from '../application/dto/update-cart-item.dto.js';
import { CartService } from '../application/services/cart.service.js';

@Controller('carrito')
@UseGuards(JwtAuthGuard)
export class CarritoController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: AuthenticatedUser) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch('items/:productId')
  updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.id, productId, dto);
  }

  @Delete('items/:productId')
  removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.cartService.removeItem(user.id, productId);
  }
}
