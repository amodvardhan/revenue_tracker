import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { MonthlyFactStatus, Prisma, ProjectionStatus, UserRole } from "@prisma/client";

import { PrismaService } from "../repository/prisma.service";
import { AuthSessionService } from "./auth-session.service";
import { MonthlyFactsRecomputeService } from "./monthly-facts-recompute.service";

const projectWithAccountInclude = {
  account: { include: { businessUnit: true } }
} satisfies Prisma.ProjectInclude;

type ProjectWithAccount = Prisma.ProjectGetPayload<{ include: typeof projectWithAccountInclude }>;

@Injectable()
export class RevenueDomainService {
  constructor(
    @Inject(PrismaService) protected readonly prisma: PrismaService,
    @Inject(AuthSessionService) protected readonly authSession: AuthSessionService,
    @Inject(MonthlyFactsRecomputeService) protected readonly monthlyFactsRecompute: MonthlyFactsRecomputeService
  ) {}

  private serializeProject(row: ProjectWithAccount) {
    return {
      id: row.id,
      projectName: row.projectName,
      clientName: row.clientName,
      accountId: row.accountId,
      account: row.account.code,
      accountDisplayName: row.account.displayName,
      businessUnitCode: row.account.businessUnit.code,
      businessUnitName: row.account.businessUnit.name,
      startDate: row.startDate,
      endDate: row.endDate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  async login(email: string, password: string): Promise<{ token: string; role: UserRole; userId: string }> {
    return this.authSession.login(email, password);
  }

  logout(token: string): { success: true } {
    return this.authSession.logout(token);
  }

  async authenticateToken(token: string, allowedRoles?: UserRole[]) {
    return this.authSession.authenticateToken(token, allowedRoles);
  }

  async ensureDefaultAppSettings(): Promise<void> {
    await this.prisma.appSettings.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        defaultCurrencyCode: "EUR",
        defaultRevenueDays: 20
      },
      update: {}
    });
  }

  async getAppSettings(): Promise<{ defaultCurrencyCode: string; defaultRevenueDays: number }> {
    await this.ensureDefaultAppSettings();
    const row = await this.prisma.appSettings.findUniqueOrThrow({ where: { id: "global" } });
    return {
      defaultCurrencyCode: row.defaultCurrencyCode,
      defaultRevenueDays: row.defaultRevenueDays
    };
  }

  async updateAppSettings(input: {
    defaultCurrencyCode?: string;
    defaultRevenueDays?: number;
  }): Promise<{ defaultCurrencyCode: string; defaultRevenueDays: number }> {
    await this.ensureDefaultAppSettings();
    const data: { defaultCurrencyCode?: string; defaultRevenueDays?: number } = {};

    if (input.defaultCurrencyCode !== undefined) {
      const code = input.defaultCurrencyCode.trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(code)) {
        throw new BadRequestException("defaultCurrencyCode must be a 3-letter ISO 4217 code (e.g. EUR)");
      }
      data.defaultCurrencyCode = code;
    }

    if (input.defaultRevenueDays !== undefined) {
      const days = Number(input.defaultRevenueDays);
      if (!Number.isFinite(days) || days < 1 || days > 31) {
        throw new BadRequestException("defaultRevenueDays must be between 1 and 31");
      }
      data.defaultRevenueDays = days;
    }

    if (Object.keys(data).length === 0) {
      return this.getAppSettings();
    }

    const row = await this.prisma.appSettings.update({
      where: { id: "global" },
      data
    });
    return {
      defaultCurrencyCode: row.defaultCurrencyCode,
      defaultRevenueDays: row.defaultRevenueDays
    };
  }

  protected async resolveDefaultRevenueDays(): Promise<number> {
    const row = await this.prisma.appSettings.findUnique({ where: { id: "global" } });
    return row?.defaultRevenueDays ?? 20;
  }

  async createProject(input: {
    projectName: string;
    clientName: string;
    accountId: string;
    startDate?: string;
    endDate?: string;
  }) {
    const row = await this.prisma.project.create({
      data: {
        projectName: input.projectName,
        clientName: input.clientName,
        accountId: input.accountId,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null
      },
      include: projectWithAccountInclude
    });
    return this.serializeProject(row);
  }

  async listProjects() {
    const rows = await this.prisma.project.findMany({
      orderBy: { projectName: "asc" },
      include: projectWithAccountInclude
    });
    return rows.map((row) => this.serializeProject(row));
  }

  async getProject(projectId: string) {
    return this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { assignments: true, ...projectWithAccountInclude }
    });
  }

  async updateProject(
    projectId: string,
    input: Partial<{
      projectName: string;
      clientName: string;
      accountId: string;
      startDate: string;
      endDate: string;
    }>
  ) {
    const data: Prisma.ProjectUpdateInput = {};
    if (input.projectName !== undefined) {
      data.projectName = input.projectName;
    }
    if (input.clientName !== undefined) {
      data.clientName = input.clientName;
    }
    if (input.accountId !== undefined) {
      data.account = { connect: { id: input.accountId } };
    }
    if (input.startDate !== undefined) {
      data.startDate = input.startDate ? new Date(input.startDate) : null;
    }
    if (input.endDate !== undefined) {
      data.endDate = input.endDate ? new Date(input.endDate) : null;
    }
    const row = await this.prisma.project.update({
      where: { id: projectId },
      data,
      include: projectWithAccountInclude
    });
    return this.serializeProject(row);
  }

  async addAssignment(
    projectId: string,
    input: {
      employeeId: string;
      teamMemberName: string;
      allocationPercent: number;
      dailyRate: number;
      signedStartDate: string;
      signedEndDate: string;
    }
  ) {
    this.validateAssignment(input);

    const assignment = await this.prisma.assignment.create({
      data: {
        projectId,
        employeeId: input.employeeId,
        teamMemberName: input.teamMemberName,
        allocationPercent: input.allocationPercent,
        dailyRate: input.dailyRate,
        signedStartDate: new Date(input.signedStartDate),
        signedEndDate: new Date(input.signedEndDate)
      }
    });

    await this.monthlyFactsRecompute.recomputeMonthlyFactsForAssignment(assignment.id);
    return assignment;
  }

  async bulkUploadAssignments(
    projectId: string,
    rows: Array<{
      employeeId: string;
      teamMemberName: string;
      allocationPercent: number;
      dailyRate: number;
      signedStartDate: string;
      signedEndDate: string;
    }>
  ) {
    const created = [];
    for (const row of rows) {
      created.push(await this.addAssignment(projectId, row));
    }
    return { createdCount: created.length, rows: created };
  }

  async listAssignments(projectId: string) {
    return this.prisma.assignment.findMany({ where: { projectId }, orderBy: { teamMemberName: "asc" } });
  }

  async updateAssignment(
    assignmentId: string,
    input: Partial<{
      teamMemberName: string;
      allocationPercent: number;
      dailyRate: number;
      signedStartDate: string;
      signedEndDate: string;
    }>
  ) {
    if (input.allocationPercent != null && (input.allocationPercent < 0 || input.allocationPercent > 100)) {
      throw new BadRequestException("allocationPercent must be between 0 and 100");
    }
    if (input.dailyRate != null && input.dailyRate <= 0) {
      throw new BadRequestException("dailyRate must be > 0");
    }
    if (input.signedStartDate && input.signedEndDate && input.signedStartDate > input.signedEndDate) {
      throw new BadRequestException("signedStartDate must be <= signedEndDate");
    }

    const assignment = await this.prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        teamMemberName: input.teamMemberName,
        allocationPercent: input.allocationPercent,
        dailyRate: input.dailyRate,
        signedStartDate: input.signedStartDate ? new Date(input.signedStartDate) : undefined,
        signedEndDate: input.signedEndDate ? new Date(input.signedEndDate) : undefined
      }
    });

    await this.monthlyFactsRecompute.recomputeMonthlyFactsForAssignment(assignment.id);
    return assignment;
  }

  async recordAttendance(projectId: string, input: { assignmentId: string; month: string; actualDays: number }) {
    const assignment = await this.prisma.assignment.findUniqueOrThrow({ where: { id: input.assignmentId } });
    if (assignment.projectId !== projectId) {
      throw new BadRequestException("assignmentId does not belong to project");
    }
    const baseline = await this.resolveDefaultRevenueDays();
    const expectedDays = (baseline * assignment.allocationPercent) / 100;
    if (input.actualDays > expectedDays) {
      throw new BadRequestException("actualDays cannot exceed expectedDays");
    }

    const record = await this.prisma.attendance.upsert({
      where: { assignmentId_month: { assignmentId: input.assignmentId, month: input.month } },
      update: { actualDays: input.actualDays },
      create: { assignmentId: input.assignmentId, month: input.month, actualDays: input.actualDays }
    });
    await this.monthlyFactsRecompute.recomputeMonthlyFactsForAssignment(input.assignmentId);
    return record;
  }

  async bulkUploadAttendance(
    projectId: string,
    rows: Array<{ assignmentId: string; month: string; actualDays: number }>
  ) {
    const saved = [];
    for (const row of rows) {
      saved.push(await this.recordAttendance(projectId, row));
    }
    return { createdCount: saved.length, rows: saved };
  }

  async listAttendance(projectId: string) {
    return this.prisma.attendance.findMany({
      where: { assignment: { projectId } },
      orderBy: [{ month: "desc" }, { assignmentId: "asc" }],
      include: {
        assignment: {
          select: { teamMemberName: true, employeeId: true }
        }
      }
    });
  }

  async deleteAttendance(projectId: string, attendanceId: string) {
    const row = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { assignment: true }
    });
    if (!row) {
      throw new NotFoundException("Attendance record not found");
    }
    if (row.assignment.projectId !== projectId) {
      throw new BadRequestException("Attendance does not belong to this project");
    }
    await this.prisma.attendance.delete({ where: { id: attendanceId } });
    await this.monthlyFactsRecompute.recomputeMonthlyFactsForAssignment(row.assignmentId);
    return { deleted: true as const };
  }

  async createRateRevision(
    assignmentId: string,
    input: { effectiveDate: string; newRate: number; authorizerId: string }
  ) {
    const assignment = await this.prisma.assignment.findUniqueOrThrow({ where: { id: assignmentId } });
    if (input.newRate <= 0) {
      throw new BadRequestException("newRate must be > 0");
    }

    const previous = await this.prisma.rateRevision.findFirst({
      where: { assignmentId, effectiveDate: { lte: new Date(input.effectiveDate) } },
      orderBy: { effectiveDate: "desc" }
    });
    const oldRate = previous?.newRate ?? assignment.dailyRate;

    const revision = await this.prisma.rateRevision.create({
      data: {
        assignmentId,
        effectiveDate: new Date(input.effectiveDate),
        oldRate,
        newRate: input.newRate,
        authorizerId: input.authorizerId
      }
    });

    await this.monthlyFactsRecompute.recomputeMonthlyFactsForAssignment(assignmentId);
    return revision;
  }

  async listRateRevisions(assignmentId: string) {
    return this.prisma.rateRevision.findMany({
      where: { assignmentId },
      include: { authorizer: { select: { id: true, name: true, email: true } } },
      orderBy: { effectiveDate: "asc" }
    });
  }

  async createProjection(
    assignmentId: string,
    input: { startDate: string; endDate: string; projectionRate: number }
  ) {
    const assignment = await this.prisma.assignment.findUniqueOrThrow({ where: { id: assignmentId } });
    const signedEnd = assignment.signedEndDate.toISOString().slice(0, 10);
    if (input.startDate <= signedEnd) {
      throw new BadRequestException("Projection Start > Signed End");
    }
    if (input.startDate > input.endDate) {
      throw new BadRequestException("startDate must be <= endDate");
    }

    const overlapping = await this.prisma.projection.findFirst({
      where: {
        assignmentId,
        status: ProjectionStatus.projected,
        startDate: { lte: new Date(input.endDate) },
        endDate: { gte: new Date(input.startDate) }
      }
    });
    if (overlapping) {
      throw new BadRequestException("No Overlap: projected period overlaps existing projection");
    }

    const projection = await this.prisma.projection.create({
      data: {
        assignmentId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        projectionRate: input.projectionRate
      }
    });
    await this.monthlyFactsRecompute.recomputeMonthlyFactsForAssignment(assignmentId);
    return projection;
  }

  async bulkUploadProjections(rows: Array<{ assignmentId: string; startDate: string; endDate: string; projectionRate: number }>) {
    const created = [];
    for (const row of rows) {
      created.push(await this.createProjection(row.assignmentId, row));
    }
    return { createdCount: created.length, rows: created };
  }

  async convertProjectionToSigned(projectionId: string, convertedByUserId: string) {
    const projection = await this.prisma.projection.findUniqueOrThrow({
      where: { id: projectionId },
      include: { assignment: true }
    });

    const updatedProjection = await this.prisma.projection.update({
      where: { id: projectionId },
      data: {
        status: ProjectionStatus.converted,
        convertedAt: new Date(),
        convertedByUserId
      }
    });

    await this.prisma.assignment.update({
      where: { id: projection.assignmentId },
      data: { signedEndDate: projection.endDate }
    });

    await this.monthlyFactsRecompute.recomputeMonthlyFactsForAssignment(projection.assignmentId);
    return updatedProjection;
  }

  async getDashboardByAccount(accountId: string) {
    const facts = await this.prisma.monthlyFact.findMany({
      where: { assignment: { project: { accountId } } },
      orderBy: [{ month: "asc" }]
    });
    return this.buildDashboardResponse(facts);
  }

  async getDashboardByProject(projectId: string) {
    const facts = await this.prisma.monthlyFact.findMany({
      where: { projectId },
      orderBy: [{ month: "asc" }]
    });
    return this.buildDashboardResponse(facts);
  }

  async getDashboardByTeamMember(assignmentId: string) {
    const facts = await this.prisma.monthlyFact.findMany({
      where: { assignmentId },
      orderBy: [{ month: "asc" }]
    });
    return this.buildDashboardResponse(facts);
  }

  async exportReport(input: { accountId?: string; projectId?: string }) {
    if (input.projectId) {
      return this.getDashboardByProject(input.projectId);
    }
    if (input.accountId) {
      return this.getDashboardByAccount(input.accountId);
    }
    const facts = await this.prisma.monthlyFact.findMany({ orderBy: [{ month: "asc" }] });
    return this.buildDashboardResponse(facts);
  }

  async listAlerts() {
    return this.prisma.alert.findMany({
      where: { isActive: true },
      orderBy: { triggeredAt: "desc" },
      include: {
        account: { select: { code: true, displayName: true } }
      }
    });
  }

  async getFinancialFacts() {
    const rows = await this.prisma.monthlyFact.findMany({
      include: {
        assignment: {
          select: {
            teamMemberName: true,
            project: {
              select: {
                projectName: true,
                clientName: true,
                account: {
                  select: {
                    code: true,
                    displayName: true,
                    businessUnit: { select: { code: true, name: true } }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [{ month: "asc" }]
    });

    return rows.map((row) => ({
      computeKey: row.computeKey,
      month: row.month,
      employeeId: row.employeeId,
      projectId: row.projectId,
      projectName: row.assignment.project.projectName,
      account: row.assignment.project.account.code,
      accountDisplayName: row.assignment.project.account.displayName,
      businessUnitCode: row.assignment.project.account.businessUnit.code,
      businessUnitName: row.assignment.project.account.businessUnit.name,
      clientName: row.assignment.project.clientName,
      teamMemberName: row.assignment.teamMemberName,
      status: row.status,
      signedRevenue: row.signedRevenue,
      projectedRevenue: row.projectedRevenue,
      totalRevenue: row.totalRevenue,
      actualCost: row.actualCost,
      plannedRevenue: row.plannedRevenue,
      plannedMargin: row.plannedMargin,
      actualMargin: row.actualMargin,
      marginVariance: row.marginVariance
    }));
  }

  async recomputeTarget(input: { employeeId: string; projectId: string; month: string }) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { employeeId: input.employeeId, projectId: input.projectId }
    });
    if (!assignment) {
      throw new BadRequestException("No assignment found for employeeId/projectId");
    }
    await this.monthlyFactsRecompute.recomputeMonthlyFactsForAssignment(assignment.id);
    return [`${input.employeeId}|${input.projectId}|${input.month}`];
  }

  async listUsersForOrgDirectory() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: [{ name: "asc" }]
    });
  }

  async listBusinessUnits() {
    return this.prisma.businessUnit.findMany({ orderBy: { code: "asc" } });
  }

  async createBusinessUnit(input: { code: string; name: string }) {
    const code = input.code.trim().toUpperCase();
    if (!/^[A-Z0-9_]{2,24}$/.test(code)) {
      throw new BadRequestException("Business unit code must be 2-24 letters, digits, or underscores");
    }
    const name = input.name.trim();
    if (!name) {
      throw new BadRequestException("Business unit name is required");
    }
    return this.prisma.businessUnit.create({
      data: { code, name }
    });
  }

  async listAccountsDetailed() {
    return this.prisma.account.findMany({
      orderBy: { code: "asc" },
      include: {
        businessUnit: { select: { id: true, code: true, name: true } },
        deliveryManager: { select: { id: true, name: true, email: true } },
        accountManager: { select: { id: true, name: true, email: true } }
      }
    });
  }

  private async assertAccountManagerPair(deliveryManagerUserId: string, accountManagerUserId: string) {
    const [dm, am] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: deliveryManagerUserId } }),
      this.prisma.user.findUniqueOrThrow({ where: { id: accountManagerUserId } })
    ]);
    if (dm.role !== UserRole.delivery_manager && dm.role !== UserRole.delivery_head) {
      throw new BadRequestException("Delivery owner must be a delivery_manager or delivery_head user");
    }
    if (am.role !== UserRole.account_manager) {
      throw new BadRequestException("Account owner must be an account_manager user");
    }
  }

  async createAccountRecord(input: {
    code: string;
    displayName: string;
    businessUnitId: string;
    deliveryManagerUserId: string;
    accountManagerUserId: string;
  }) {
    await this.assertAccountManagerPair(input.deliveryManagerUserId, input.accountManagerUserId);
    const code = input.code.trim().toUpperCase().replace(/\s+/g, "_");
    if (!/^[A-Z0-9_]{2,32}$/.test(code)) {
      throw new BadRequestException("Account code must be 2-32 letters, digits, or underscores");
    }
    const displayName = input.displayName.trim();
    if (!displayName) {
      throw new BadRequestException("Account display name is required");
    }
    return this.prisma.account.create({
      data: {
        code,
        displayName,
        businessUnitId: input.businessUnitId,
        deliveryManagerUserId: input.deliveryManagerUserId,
        accountManagerUserId: input.accountManagerUserId
      },
      include: {
        businessUnit: { select: { id: true, code: true, name: true } },
        deliveryManager: { select: { id: true, name: true, email: true } },
        accountManager: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async updateAccountRecord(
    accountId: string,
    input: Partial<{
      displayName: string;
      businessUnitId: string;
      deliveryManagerUserId: string;
      accountManagerUserId: string;
    }>
  ) {
    const existing = await this.prisma.account.findUniqueOrThrow({ where: { id: accountId } });
    const dmId = input.deliveryManagerUserId ?? existing.deliveryManagerUserId;
    const amId = input.accountManagerUserId ?? existing.accountManagerUserId;
    if (input.deliveryManagerUserId !== undefined || input.accountManagerUserId !== undefined) {
      await this.assertAccountManagerPair(dmId, amId);
    }

    const data: Prisma.AccountUpdateInput = {};
    if (input.displayName !== undefined) {
      const displayName = input.displayName.trim();
      if (!displayName) {
        throw new BadRequestException("Account display name is required");
      }
      data.displayName = displayName;
    }
    if (input.businessUnitId !== undefined) {
      data.businessUnit = { connect: { id: input.businessUnitId } };
    }
    if (input.deliveryManagerUserId !== undefined) {
      data.deliveryManager = { connect: { id: input.deliveryManagerUserId } };
    }
    if (input.accountManagerUserId !== undefined) {
      data.accountManager = { connect: { id: input.accountManagerUserId } };
    }

    if (Object.keys(data).length === 0) {
      return this.prisma.account.findUniqueOrThrow({
        where: { id: accountId },
        include: {
          businessUnit: { select: { id: true, code: true, name: true } },
          deliveryManager: { select: { id: true, name: true, email: true } },
          accountManager: { select: { id: true, name: true, email: true } }
        }
      });
    }

    return this.prisma.account.update({
      where: { id: accountId },
      data,
      include: {
        businessUnit: { select: { id: true, code: true, name: true } },
        deliveryManager: { select: { id: true, name: true, email: true } },
        accountManager: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async updateBusinessUnitRecord(businessUnitId: string, input: { name: string }) {
    const name = input.name.trim();
    if (!name) {
      throw new BadRequestException("Business unit name is required");
    }
    return this.prisma.businessUnit.update({
      where: { id: businessUnitId },
      data: { name }
    });
  }

  async deleteBusinessUnitRecord(businessUnitId: string) {
    const accountCount = await this.prisma.account.count({ where: { businessUnitId } });
    if (accountCount > 0) {
      throw new BadRequestException(
        `This business unit still has ${accountCount} account(s). Delete or move those accounts first.`
      );
    }
    await this.prisma.businessUnit.delete({ where: { id: businessUnitId } });
    return { deleted: true as const };
  }

  async deleteAccountRecord(accountId: string) {
    const projectCount = await this.prisma.project.count({ where: { accountId } });
    if (projectCount > 0) {
      throw new BadRequestException(
        `Cannot delete: ${projectCount} project(s) are still linked to this account. Change the project’s account or remove the project first.`
      );
    }
    await this.prisma.$transaction([
      this.prisma.alert.deleteMany({ where: { accountId } }),
      this.prisma.account.delete({ where: { id: accountId } })
    ]);
    return { deleted: true as const };
  }

  async ensureStandardOrganizationAndDemoAccounts(): Promise<void> {
    await this.prisma.businessUnit.upsert({
      where: { code: "IO" },
      create: { id: "phase2bu_io", code: "IO", name: "International Organization" },
      update: {}
    });
    await this.prisma.businessUnit.upsert({
      where: { code: "GEN" },
      create: { id: "phase2bu_gen", code: "GEN", name: "General" },
      update: {}
    });

    const dm = await this.prisma.user.findFirst({
      where: { role: { in: [UserRole.delivery_manager, UserRole.delivery_head] } },
      orderBy: { createdAt: "asc" }
    });
    const am = await this.prisma.user.findFirst({
      where: { role: UserRole.account_manager },
      orderBy: { createdAt: "asc" }
    });
    if (!dm || !am) {
      return;
    }

    const buIo = await this.prisma.businessUnit.findUniqueOrThrow({ where: { code: "IO" } });
    const buGen = await this.prisma.businessUnit.findUniqueOrThrow({ where: { code: "GEN" } });

    const ioAccounts: Array<{ code: string; displayName: string }> = [
      { code: "WHO", displayName: "World Health Organization" },
      { code: "IAEA", displayName: "International Atomic Energy Agency" },
      { code: "OPCW", displayName: "Organisation for the Prohibition of Chemical Weapons" },
      { code: "OPECFUND", displayName: "OPEC Fund for International Development" },
      { code: "GCP", displayName: "Green Climate Fund" }
    ];

    for (const row of ioAccounts) {
      await this.prisma.account.upsert({
        where: { code: row.code },
        create: {
          code: row.code,
          displayName: row.displayName,
          businessUnitId: buIo.id,
          deliveryManagerUserId: dm.id,
          accountManagerUserId: am.id
        },
        update: {}
      });
    }

    await this.prisma.account.upsert({
      where: { code: "ACME" },
      create: {
        code: "ACME",
        displayName: "Acme Corporation (demo)",
        businessUnitId: buGen.id,
        deliveryManagerUserId: dm.id,
        accountManagerUserId: am.id
      },
      update: {}
    });
  }

  async seedDemoDataIfEmpty() {
    const projectCount = await this.prisma.project.count();
    if (projectCount > 0) {
      await this.ensureStandardOrganizationAndDemoAccounts();
      return;
    }

    const deliveryManager = await this.prisma.user.create({
      data: {
        email: "delivery.manager@demo.com",
        passwordHash: this.authSession.hashPassword("Password@123"),
        role: UserRole.delivery_manager,
        name: "Delivery Manager"
      }
    });

    await this.prisma.user.create({
      data: {
        email: "account.manager@demo.com",
        passwordHash: this.authSession.hashPassword("Password@123"),
        role: UserRole.account_manager,
        name: "Account Manager"
      }
    });

    await this.prisma.user.create({
      data: {
        email: "project.manager@demo.com",
        passwordHash: this.authSession.hashPassword("Password@123"),
        role: UserRole.project_manager,
        name: "Project Manager"
      }
    });

    await this.prisma.user.create({
      data: {
        email: "delivery.head@demo.com",
        passwordHash: this.authSession.hashPassword("Password@123"),
        role: UserRole.delivery_head,
        name: "Delivery Head"
      }
    });

    await this.ensureStandardOrganizationAndDemoAccounts();

    const acme = await this.prisma.account.findUniqueOrThrow({ where: { code: "ACME" } });

    const project = await this.createProject({
      projectName: "Alpha Revenue Stream",
      clientName: "Acme Corp",
      accountId: acme.id,
      startDate: "2026-04-01",
      endDate: "2026-12-31"
    });

    const assignment = await this.addAssignment(project.id, {
      employeeId: "E-1001",
      teamMemberName: "Priya Sharma",
      allocationPercent: 100,
      dailyRate: 1200,
      signedStartDate: "2026-04-01",
      signedEndDate: "2026-06-30"
    });

    await this.recordAttendance(project.id, { assignmentId: assignment.id, month: "2026-04", actualDays: 19 });
    await this.recordAttendance(project.id, { assignmentId: assignment.id, month: "2026-05", actualDays: 20 });

    await this.createRateRevision(assignment.id, {
      effectiveDate: "2026-05-01",
      newRate: 1300,
      authorizerId: deliveryManager.id
    });

    await this.createProjection(assignment.id, {
      startDate: "2026-07-01",
      endDate: "2026-08-31",
      projectionRate: 1350
    });

    await this.prisma.alert.create({
      data: {
        accountId: acme.id,
        alertType: "leakage_threshold",
        message: "Projected leakage exceeded 10% for Alpha Revenue Stream"
      }
    });
  }

  private validateAssignment(input: {
    employeeId: string;
    teamMemberName: string;
    allocationPercent: number;
    dailyRate: number;
    signedStartDate: string;
    signedEndDate: string;
  }) {
    if (!input.teamMemberName.trim()) {
      throw new BadRequestException("Team Member Name is required");
    }
    if (input.dailyRate <= 0) {
      throw new BadRequestException("Daily Rate must be > 0");
    }
    if (input.allocationPercent < 0 || input.allocationPercent > 100) {
      throw new BadRequestException("Allocation % must be between 0 and 100");
    }
    if (input.signedStartDate > input.signedEndDate) {
      throw new BadRequestException("Start Date <= End Date validation failed");
    }
  }

  private buildDashboardResponse(facts: Array<{
    assignmentId: string;
    month: string;
    plannedRevenue: number;
    signedRevenue: number;
    projectedRevenue: number;
    totalRevenue: number;
    actualCost: number;
    marginVariance: number;
    status: MonthlyFactStatus;
  }>) {
    const totals = facts.reduce(
      (accumulator, fact) => ({
        plannedRevenue: accumulator.plannedRevenue + fact.plannedRevenue,
        signedRevenue: accumulator.signedRevenue + fact.signedRevenue,
        projectedRevenue: accumulator.projectedRevenue + fact.projectedRevenue,
        totalRevenue: accumulator.totalRevenue + fact.totalRevenue,
        actualCost: accumulator.actualCost + fact.actualCost,
        leakage: accumulator.leakage + (fact.plannedRevenue - fact.actualCost)
      }),
      {
        plannedRevenue: 0,
        signedRevenue: 0,
        projectedRevenue: 0,
        totalRevenue: 0,
        actualCost: 0,
        leakage: 0
      }
    );

    const rows = facts.map((fact) => ({
      assignmentId: fact.assignmentId,
      month: fact.month,
      cost: fact.actualCost,
      signedRevenue: fact.signedRevenue,
      projectedRevenue: fact.projectedRevenue,
      totalRevenue: fact.totalRevenue,
      leakage: fact.plannedRevenue - fact.actualCost,
      growthPercent: fact.plannedRevenue === 0 ? 0 : ((fact.plannedRevenue - fact.actualCost) / fact.plannedRevenue) * 100,
      status: fact.status,
      marginVariance: fact.marginVariance
    }));

    return { rows, totals };
  }
}
