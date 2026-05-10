import { Body, Controller, Get, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { RevenueManagementService } from "./service/revenue-management.service";
import { JwtGuard } from "./security/jwt.guard";
import { Roles } from "./security/roles.decorator";
import { RolesGuard } from "./security/roles.guard";

@Controller()
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager, UserRole.delivery_head)
export class DashboardController {
  constructor(
    @Inject(RevenueManagementService)
    private readonly revenueManagementService: RevenueManagementService
  ) {}

  @Get("dashboard/account/:accountId")
  async accountDashboard(@Param("accountId") accountId: string) {
    return this.revenueManagementService.getDashboardByAccount(accountId);
  }

  @Get("dashboard/project/:projectId")
  async projectDashboard(@Param("projectId") projectId: string) {
    return this.revenueManagementService.getDashboardByProject(projectId);
  }

  @Get("dashboard/team-member/:assignmentId")
  async teamMemberDashboard(@Param("assignmentId") assignmentId: string) {
    return this.revenueManagementService.getDashboardByTeamMember(assignmentId);
  }

  @Post("reports/export")
  async exportReport(@Body() body: { account?: string; projectId?: string }) {
    return this.revenueManagementService.exportReport(body);
  }

  @Get("alerts")
  async listAlerts() {
    return this.revenueManagementService.listAlerts();
  }
}
