import { Module } from "@nestjs/common";

import { AuthController } from "./auth.controller";
import { BootstrapService } from "./bootstrap.service";
import { DashboardController } from "./dashboard.controller";
import { FinancialController } from "./financial.controller";
import { OperationsController } from "./operations.controller";
import { OrganizationController } from "./organization.controller";
import { SettingsController } from "./settings.controller";
import { PrismaService } from "./repository/prisma.service";
import { JwtGuard } from "./security/jwt.guard";
import { RolesGuard } from "./security/roles.guard";
import { AuthSessionService } from "./service/auth-session.service";
import { MonthlyFactsRecomputeService } from "./service/monthly-facts-recompute.service";
import { RevenueManagementService } from "./service/revenue-management.service";

@Module({
  controllers: [
    FinancialController,
    AuthController,
    OperationsController,
    OrganizationController,
    DashboardController,
    SettingsController
  ],
  providers: [
    PrismaService,
    AuthSessionService,
    MonthlyFactsRecomputeService,
    RevenueManagementService,
    BootstrapService,
    JwtGuard,
    RolesGuard
  ]
})
export class FinancialModule {}
