import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import { UserRole } from "@prisma/client";

import { RevenueManagementService } from "./service/revenue-management.service";
import { JwtGuard } from "./security/jwt.guard";
import { Roles } from "./security/roles.decorator";
import { RolesGuard } from "./security/roles.guard";

const R_ORG_READ = [
  UserRole.admin,
  UserRole.delivery_manager,
  UserRole.account_manager,
  UserRole.project_manager,
  UserRole.delivery_head
] as const;

const R_DM_AM = [UserRole.admin, UserRole.delivery_manager, UserRole.account_manager] as const;

@Controller()
@UseGuards(JwtGuard, RolesGuard)
export class OrganizationController {
  constructor(
    @Inject(RevenueManagementService)
    private readonly revenueManagementService: RevenueManagementService
  ) {}

  @Get("users/directory")
  @Roles(...R_ORG_READ)
  async listUsersDirectory() {
    return this.revenueManagementService.listUsersForOrgDirectory();
  }

  @Post("users")
  @Roles(UserRole.admin)
  async createUser(
    @Body()
    body: {
      email: string;
      password: string;
      name: string;
      role: UserRole;
    }
  ) {
    return this.revenueManagementService.createUserByAdmin(body);
  }

  @Get("business-units")
  @Roles(...R_ORG_READ)
  async listBusinessUnits(@Req() req: { user: User }) {
    return this.revenueManagementService.listBusinessUnits(req.user);
  }

  @Post("business-units")
  @Roles(...R_DM_AM)
  async createBusinessUnit(
    @Req() req: { user: User },
    @Body() body: { code: string; name: string; deliveryHeadUserId: string }
  ) {
    return this.revenueManagementService.createBusinessUnit(req.user, body);
  }

  @Put("business-units/:businessUnitId")
  @Roles(...R_DM_AM)
  async updateBusinessUnit(
    @Req() req: { user: User },
    @Param("businessUnitId") businessUnitId: string,
    @Body() body: { name?: string; deliveryHeadUserId?: string }
  ) {
    return this.revenueManagementService.updateBusinessUnitRecord(req.user, businessUnitId, body);
  }

  @Delete("business-units/:businessUnitId")
  @Roles(...R_DM_AM)
  async deleteBusinessUnit(@Req() req: { user: User }, @Param("businessUnitId") businessUnitId: string) {
    return this.revenueManagementService.deleteBusinessUnitRecord(req.user, businessUnitId);
  }

  @Get("accounts")
  @Roles(...R_ORG_READ)
  async listAccounts(@Req() req: { user: User }) {
    return this.revenueManagementService.listAccountsDetailed(req.user);
  }

  @Post("accounts")
  @Roles(...R_DM_AM)
  async createAccount(
    @Req() req: { user: User },
    @Body()
    body: {
      code: string;
      displayName: string;
      businessUnitId: string;
      deliveryManagerUserId: string;
      accountManagerUserId: string;
    }
  ) {
    return this.revenueManagementService.createAccountRecord(req.user, body);
  }

  @Put("accounts/:accountId")
  @Roles(...R_DM_AM)
  async updateAccount(
    @Req() req: { user: User },
    @Param("accountId") accountId: string,
    @Body()
    body: Partial<{
      displayName: string;
      businessUnitId: string;
      deliveryManagerUserId: string;
      accountManagerUserId: string;
    }>
  ) {
    return this.revenueManagementService.updateAccountRecord(req.user, accountId, body);
  }

  @Delete("accounts/:accountId")
  @Roles(...R_DM_AM)
  async deleteAccount(@Req() req: { user: User }, @Param("accountId") accountId: string) {
    return this.revenueManagementService.deleteAccountRecord(req.user, accountId);
  }
}
