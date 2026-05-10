import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";

import { RevenueManagementService } from "./service/revenue-management.service";

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    @Inject(RevenueManagementService)
    private readonly revenueManagementService: RevenueManagementService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.revenueManagementService.ensureDefaultAppSettings();
    await this.revenueManagementService.seedDemoDataIfEmpty();
    this.logger.log("Phase-1 demo dataset ready");
  }
}
