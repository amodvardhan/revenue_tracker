import { Body, Controller, Inject, Module, Post } from "@nestjs/common";

import { RecomputeDto } from "./dto/recompute.dto";
import { FinancialRepository } from "./repository/financial.repository";
import { RecomputeService } from "./service/recompute.service";

@Controller("financial")
class FinancialController {
  constructor(
    @Inject(RecomputeService)
    private readonly recomputeService: RecomputeService
  ) {}

  @Post("recompute")
  recompute(@Body() body: RecomputeDto): { recomputedKeys: string[] } {
    const recomputedKeys = this.recomputeService.recomputeTarget(body);
    return { recomputedKeys };
  }
}

@Module({
  controllers: [FinancialController],
  providers: [FinancialRepository, RecomputeService]
})
export class FinancialModule {}
