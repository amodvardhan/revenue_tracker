import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { RevenueManagementService } from "../service/revenue-management.service";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    @Inject(RevenueManagementService)
    private readonly revenueManagementService: RevenueManagementService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      (Reflect.getMetadata(ROLES_KEY, context.getHandler()) as UserRole[] | undefined) ??
      (Reflect.getMetadata(ROLES_KEY, context.getClass()) as UserRole[] | undefined) ??
      [];
    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ headers?: { authorization?: string } }>();
    const authHeader = request.headers?.authorization ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    await this.revenueManagementService.authenticateToken(token, requiredRoles);
    return true;
  }
}
