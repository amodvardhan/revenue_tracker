import { Inject, Injectable } from "@nestjs/common";

import { RecomputeDto } from "../dto/recompute.dto";
import { FinancialRepository } from "../repository/financial.repository";

@Injectable()
export class RecomputeService {
  constructor(
    @Inject(FinancialRepository)
    private readonly financialRepository: FinancialRepository
  ) {}

  recomputeTarget(input: RecomputeDto): string[] {
    const recomputedKey = this.financialRepository.upsertMonthlyFact(input);
    return [recomputedKey];
  }
}
