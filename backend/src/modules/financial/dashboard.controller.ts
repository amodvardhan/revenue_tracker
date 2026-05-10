import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import { UserRole } from "@prisma/client";

import { RevenueManagementService } from "./service/revenue-management.service";
import { JwtGuard } from "./security/jwt.guard";
import { Roles } from "./security/roles.decorator";
import { RolesGuard } from "./security/roles.guard";

@Controller()
@UseGuards(JwtGuard, RolesGuard)
@Roles(
  UserRole.admin,
  UserRole.delivery_manager,
  UserRole.account_manager,
  UserRole.project_manager,
  UserRole.delivery_head
)
export class DashboardController {
  constructor(
    @Inject(RevenueManagementService)
    private readonly revenueManagementService: RevenueManagementService
  ) {}

  @Get("dashboard/account/:accountId")
  async accountDashboard(@Req() req: { user: User }, @Param("accountId") accountId: string) {
    return this.revenueManagementService.getDashboardByAccount(req.user, accountId);
  }

  @Get("dashboard/project/:projectId")
  async projectDashboard(@Req() req: { user: User }, @Param("projectId") projectId: string) {
    return this.revenueManagementService.getDashboardByProject(req.user, projectId);
  }

  @Get("dashboard/team-member/:assignmentId")
  async teamMemberDashboard(@Req() req: { user: User }, @Param("assignmentId") assignmentId: string) {
    return this.revenueManagementService.getDashboardByTeamMember(req.user, assignmentId);
  }

  @Post("reports/export")
  async exportReport(@Req() req: { user: User }, @Body() body: { accountId?: string; projectId?: string }) {
    return this.revenueManagementService.exportReport(req.user, body);
  }

  @Get("alerts")
  async listAlerts(@Req() req: { user: User }) {
    return this.revenueManagementService.listAlerts(req.user);
  }
}
