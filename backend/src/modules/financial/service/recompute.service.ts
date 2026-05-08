import { Inject, Injectable } from "@nestjs/common";

import { RecomputeDto } from "../dto/recompute.dto";
import { FinancialRepository } from "../repository/financial.repository";

@Injectable()
export class RecomputeService {
  constructor(
    @Inject(FinancialRepository)
    private readonly financialRepository: FinancialRepository
  ) {}

  async recomputeTarget(input: RecomputeDto): Promise<string[]> {
    const recomputedKey = await this.financialRepository.upsertMonthlyFact(input);
    return [recomputedKey];
  }
}
