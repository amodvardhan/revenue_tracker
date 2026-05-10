import { Body, Controller, Inject, Post, Req } from "@nestjs/common";

import { RevenueManagementService } from "./service/revenue-management.service";

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(RevenueManagementService)
    private readonly revenueManagementService: RevenueManagementService
  ) {}

  @Post("login")
  async login(@Body() body: { email: string; password: string }) {
    return this.revenueManagementService.login(body.email, body.password);
  }

  @Post("logout")
  async logout(@Req() request: { headers?: { authorization?: string } }) {
    const auth = request.headers?.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    return this.revenueManagementService.logout(token);
  }
}
