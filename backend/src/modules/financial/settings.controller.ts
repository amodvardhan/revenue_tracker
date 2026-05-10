import { Body, Controller, Get, Inject, Put, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { RevenueManagementService } from "./service/revenue-management.service";
import { JwtGuard } from "./security/jwt.guard";
import { Roles } from "./security/roles.decorator";
import { RolesGuard } from "./security/roles.guard";

@Controller("settings")
@UseGuards(JwtGuard, RolesGuard)
export class SettingsController {
  constructor(
    @Inject(RevenueManagementService)
    private readonly revenueManagementService: RevenueManagementService
  ) {}

  @Get()
  @Roles(
    UserRole.admin,
    UserRole.delivery_manager,
    UserRole.account_manager,
    UserRole.project_manager,
    UserRole.delivery_head
  )
  async getSettings() {
    return this.revenueManagementService.getAppSettings();
  }

  @Put()
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager)
  async updateSettings(
    @Body()
    body: {
      defaultCurrencyCode?: string;
      defaultRevenueDays?: number;
    }
  ) {
    return this.revenueManagementService.updateAppSettings(body);
  }
}
