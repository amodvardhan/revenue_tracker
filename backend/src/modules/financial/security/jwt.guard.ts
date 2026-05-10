import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";

import { RevenueManagementService } from "../service/revenue-management.service";

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    @Inject(RevenueManagementService)
    private readonly revenueManagementService: RevenueManagementService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers?: { authorization?: string }; user?: unknown }>();
    const authHeader = request.headers?.authorization ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Bearer token required");
    }

    const token = authHeader.slice(7);
    const user = await this.revenueManagementService.authenticateToken(token);
    request.user = user;
    return true;
  }
}
