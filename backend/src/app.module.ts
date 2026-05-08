import { Module } from "@nestjs/common";

import { FinancialModule } from "./modules/financial/financial.module";

@Module({
  imports: [FinancialModule]
})
export class AppModule {}
