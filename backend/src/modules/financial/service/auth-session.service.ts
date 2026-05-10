import { ForbiddenException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { randomBytes, createHash } from "crypto";

import { PrismaService } from "../repository/prisma.service";

@Injectable()
export class AuthSessionService {
  private readonly sessions = new Map<string, { userId: string; expiresAt: number }>();

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async login(
    email: string,
    password: string
  ): Promise<{ token: string; role: UserRole; userId: string; name: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.passwordHash !== this.hashPassword(password)) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const token = randomBytes(24).toString("hex");
    const expiresAt = Date.now() + 30 * 60 * 1000;
    this.sessions.set(token, { userId: user.id, expiresAt });
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return { token, role: user.role, userId: user.id, name: user.name };
  }

  logout(token: string): { success: true } {
    this.sessions.delete(token);
    return { success: true };
  }

  async authenticateToken(token: string, allowedRoles?: UserRole[]) {
    const session = this.sessions.get(token);
    if (!session) {
      throw new UnauthorizedException("Missing or invalid session token");
    }
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      throw new UnauthorizedException("Session expired");
    }

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      throw new UnauthorizedException("Session user not found");
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      throw new ForbiddenException("Insufficient role permissions");
    }

    return user;
  }

  hashPassword(password: string): string {
    return createHash("sha256").update(password).digest("hex");
  }
}
