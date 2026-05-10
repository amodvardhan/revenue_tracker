import { Injectable } from "@nestjs/common";

import { PrismaService } from "../repository/prisma.service";
import { AuthSessionService } from "./auth-session.service";
import { MonthlyFactsRecomputeService } from "./monthly-facts-recompute.service";
import { RevenueDomainService } from "./revenue-domain.service";

@Injectable()
export class RevenueManagementService extends RevenueDomainService {
  constructor(
    prisma: PrismaService,
    authSession: AuthSessionService,
    monthlyFacts: MonthlyFactsRecomputeService
  ) {
    super(prisma, authSession, monthlyFacts);
  }
}
