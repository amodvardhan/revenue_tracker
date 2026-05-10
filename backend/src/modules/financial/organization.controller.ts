import { Body, Controller, Delete, Get, Inject, Param, Post, Put, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { RevenueManagementService } from "./service/revenue-management.service";
import { JwtGuard } from "./security/jwt.guard";
import { Roles } from "./security/roles.decorator";
import { RolesGuard } from "./security/roles.guard";

@Controller()
@UseGuards(JwtGuard, RolesGuard)
export class OrganizationController {
  constructor(
    @Inject(RevenueManagementService)
    private readonly revenueManagementService: RevenueManagementService
  ) {}

  @Get("users/directory")
  @Roles(UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager, UserRole.delivery_head)
  async listUsersDirectory() {
    return this.revenueManagementService.listUsersForOrgDirectory();
  }

  @Get("business-units")
  @Roles(UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager, UserRole.delivery_head)
  async listBusinessUnits() {
    return this.revenueManagementService.listBusinessUnits();
  }

  @Post("business-units")
  @Roles(UserRole.delivery_manager, UserRole.account_manager)
  async createBusinessUnit(@Body() body: { code: string; name: string }) {
    return this.revenueManagementService.createBusinessUnit(body);
  }

  @Put("business-units/:businessUnitId")
  @Roles(UserRole.delivery_manager, UserRole.account_manager)
  async updateBusinessUnit(@Param("businessUnitId") businessUnitId: string, @Body() body: { name: string }) {
    return this.revenueManagementService.updateBusinessUnitRecord(businessUnitId, body);
  }

  @Delete("business-units/:businessUnitId")
  @Roles(UserRole.delivery_manager, UserRole.account_manager)
  async deleteBusinessUnit(@Param("businessUnitId") businessUnitId: string) {
    return this.revenueManagementService.deleteBusinessUnitRecord(businessUnitId);
  }

  @Get("accounts")
  @Roles(UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager, UserRole.delivery_head)
  async listAccounts() {
    return this.revenueManagementService.listAccountsDetailed();
  }

  @Post("accounts")
  @Roles(UserRole.delivery_manager, UserRole.account_manager)
  async createAccount(
    @Body()
    body: {
      code: string;
      displayName: string;
      businessUnitId: string;
      deliveryManagerUserId: string;
      accountManagerUserId: string;
    }
  ) {
    return this.revenueManagementService.createAccountRecord(body);
  }

  @Put("accounts/:accountId")
  @Roles(UserRole.delivery_manager, UserRole.account_manager)
  async updateAccount(
    @Param("accountId") accountId: string,
    @Body()
    body: Partial<{
      displayName: string;
      businessUnitId: string;
      deliveryManagerUserId: string;
      accountManagerUserId: string;
    }>
  ) {
    return this.revenueManagementService.updateAccountRecord(accountId, body);
  }

  @Delete("accounts/:accountId")
  @Roles(UserRole.delivery_manager, UserRole.account_manager)
  async deleteAccount(@Param("accountId") accountId: string) {
    return this.revenueManagementService.deleteAccountRecord(accountId);
  }
}
