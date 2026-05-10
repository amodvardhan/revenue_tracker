import { Body, Controller, Get, Inject, Post } from "@nestjs/common";

import { RecomputeDto } from "./dto/recompute.dto";
import { RevenueManagementService } from "./service/revenue-management.service";

@Controller("financial")
export class FinancialController {
  constructor(
    @Inject(RevenueManagementService)
    private readonly revenueManagementService: RevenueManagementService
  ) {}

  @Post("recompute")
  async recompute(@Body() body: RecomputeDto): Promise<{ recomputedKeys: string[] }> {
    const recomputedKeys = await this.revenueManagementService.recomputeTarget(body);
    return { recomputedKeys };
  }

  @Get("dashboard")
  async getDashboard() {
    const projects = await this.revenueManagementService.listProjects();
    if (projects.length === 0) {
      return {
        rows: [],
        totals: {
          plannedRevenue: 0,
          signedRevenue: 0,
          projectedRevenue: 0,
          totalRevenue: 0,
          actualCost: 0,
          leakage: 0
        }
      };
    }
    return this.revenueManagementService.getDashboardByProject(projects[0].id);
  }

  @Get("export")
  async getExport() {
    return this.revenueManagementService.exportReport({});
  }

  @Get("facts")
  async getFacts() {
    return this.revenueManagementService.getFinancialFacts();
  }
}
