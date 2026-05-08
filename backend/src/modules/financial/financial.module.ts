import { Body, Controller, Inject, Module, Post, UsePipes, ValidationPipe } from "@nestjs/common";

import { RecomputeDto } from "./dto/recompute.dto";
import { FinancialRepository, PRISMA_CLIENT } from "./repository/financial.repository";
import { PrismaService } from "./repository/prisma.service";
import { RecomputeService } from "./service/recompute.service";

@Controller("financial")
class FinancialController {
  constructor(
    @Inject(RecomputeService)
    private readonly recomputeService: RecomputeService
  ) {}

  @Post("recompute")
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  async recompute(@Body() body: RecomputeDto): Promise<{ recomputedKeys: string[] }> {
    const recomputedKeys = await this.recomputeService.recomputeTarget(body);
    return { recomputedKeys };
  }
}

@Module({
  controllers: [FinancialController],
  providers: [
    PrismaService,
    FinancialRepository,
    RecomputeService,
    {
      provide: PRISMA_CLIENT,
      useExisting: PrismaService
    }
  ]
})
export class FinancialModule {}
