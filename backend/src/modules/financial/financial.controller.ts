import { Body, Controller, Get, Inject, Post, Req, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import { UserRole } from "@prisma/client";

import { RecomputeDto } from "./dto/recompute.dto";
import { RevenueManagementService } from "./service/revenue-management.service";
import { JwtGuard } from "./security/jwt.guard";
import { Roles } from "./security/roles.decorator";
import { RolesGuard } from "./security/roles.guard";

@Controller("financial")
@UseGuards(JwtGuard, RolesGuard)
@Roles(
  UserRole.admin,
  UserRole.delivery_manager,
  UserRole.account_manager,
  UserRole.project_manager,
  UserRole.delivery_head
)
export class FinancialController {
  constructor(
    @Inject(RevenueManagementService)
    private readonly revenueManagementService: RevenueManagementService
  ) {}

  @Post("recompute")
  async recompute(@Req() req: { user: User }, @Body() body: RecomputeDto): Promise<{ recomputedKeys: string[] }> {
    const recomputedKeys = await this.revenueManagementService.recomputeTarget(req.user, body);
    return { recomputedKeys };
  }

  @Get("dashboard")
  async getDashboard(@Req() req: { user: User }) {
    return this.revenueManagementService.exportReport(req.user, {});
  }

  @Get("export")
  async getExport(@Req() req: { user: User }) {
    return this.revenueManagementService.exportReport(req.user, {});
  }

  @Get("facts")
  async getFacts(@Req() req: { user: User }) {
    return this.revenueManagementService.getFinancialFacts(req.user);
  }
}
