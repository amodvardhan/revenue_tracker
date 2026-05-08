import { Body, Controller, Inject, Module, Post, UsePipes, ValidationPipe } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

import { RecomputeDto } from "./dto/recompute.dto";
import { FinancialRepository, PRISMA_CLIENT } from "./repository/financial.repository";
import { RecomputeService } from "./service/recompute.service";

@Controller("financial")
class FinancialController {
  constructor(
    @Inject(RecomputeService)
    private readonly recomputeService: RecomputeService
  ) {}

  @Post("recompute")
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async recompute(@Body() body: RecomputeDto): Promise<{ recomputedKeys: string[] }> {
    const recomputedKeys = await this.recomputeService.recomputeTarget(body);
    return { recomputedKeys };
  }
}

@Module({
  controllers: [FinancialController],
  providers: [
    FinancialRepository,
    RecomputeService,
    {
      provide: PRISMA_CLIENT,
      useFactory: () => new PrismaClient()
    }
  ]
})
export class FinancialModule {}
