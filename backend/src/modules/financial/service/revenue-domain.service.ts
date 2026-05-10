import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { MonthlyFactStatus, ProjectionStatus, UserRole } from "@prisma/client";

import { PrismaService } from "../repository/prisma.service";
import { AuthSessionService } from "./auth-session.service";
import { MonthlyFactsRecomputeService } from "./monthly-facts-recompute.service";

@Injectable()
export class RevenueDomainService {
  constructor(
    @Inject(PrismaService) protected readonly prisma: PrismaService,
    @Inject(AuthSessionService) protected readonly authSession: AuthSessionService,
    @Inject(MonthlyFactsRecomputeService) protected readonly monthlyFactsRecompute: MonthlyFactsRecomputeService
  ) {}

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
    account: string;
    startDate?: string;
    endDate?: string;
  }) {
    return this.prisma.project.create({
      data: {
        projectName: input.projectName,
        clientName: input.clientName,
        account: input.account,
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null
      }
    });
  }

  async listProjects() {
    return this.prisma.project.findMany({ orderBy: { projectName: "asc" } });
  }

  async getProject(projectId: string) {
    return this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { assignments: true }
    });
  }

  async updateProject(
    projectId: string,
    input: Partial<{ projectName: string; clientName: string; account: string; startDate: string; endDate: string }>
  ) {
    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        projectName: input.projectName,
        clientName: input.clientName,
        account: input.account,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined
      }
    });
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

  async getDashboardByAccount(account: string) {
    const facts = await this.prisma.monthlyFact.findMany({
      where: { assignment: { project: { account } } },
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

  async exportReport(input: { account?: string; projectId?: string }) {
    if (input.projectId) {
      return this.getDashboardByProject(input.projectId);
    }
    if (input.account) {
      return this.getDashboardByAccount(input.account);
    }
    const facts = await this.prisma.monthlyFact.findMany({ orderBy: [{ month: "asc" }] });
    return this.buildDashboardResponse(facts);
  }

  async listAlerts() {
    return this.prisma.alert.findMany({
      where: { isActive: true },
      orderBy: { triggeredAt: "desc" }
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
                account: true,
                clientName: true
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
      account: row.assignment.project.account,
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

  async seedDemoDataIfEmpty() {
    const projectCount = await this.prisma.project.count();
    if (projectCount > 0) {
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

    const project = await this.createProject({
      projectName: "Alpha Revenue Stream",
      clientName: "Acme Corp",
      account: "ACME",
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
        account: "ACME",
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
