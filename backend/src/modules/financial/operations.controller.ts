import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import { UserRole } from "@prisma/client";

import { RevenueManagementService } from "./service/revenue-management.service";
import { JwtGuard } from "./security/jwt.guard";
import { Roles } from "./security/roles.decorator";
import { RolesGuard } from "./security/roles.guard";

@Controller()
@UseGuards(JwtGuard, RolesGuard)
export class OperationsController {
  constructor(
    @Inject(RevenueManagementService)
    private readonly revenueManagementService: RevenueManagementService
  ) {}

  @Post("projects")
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager)
  async createProject(
    @Req() req: { user: User },
    @Body() body: { projectName: string; clientName: string; accountId: string; startDate?: string; endDate?: string }
  ) {
    return this.revenueManagementService.createProject(req.user, body);
  }

  @Get("projects")
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager, UserRole.delivery_head)
  async listProjects(@Req() req: { user: User }) {
    return this.revenueManagementService.listProjects(req.user);
  }

  @Get("projects/:projectId")
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager, UserRole.delivery_head)
  async getProject(@Req() req: { user: User }, @Param("projectId") projectId: string) {
    return this.revenueManagementService.getProject(req.user, projectId);
  }

  @Put("projects/:projectId")
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager)
  async updateProject(
    @Req() req: { user: User },
    @Param("projectId") projectId: string,
    @Body()
    body: Partial<{ projectName: string; clientName: string; accountId: string; startDate: string; endDate: string }>
  ) {
    return this.revenueManagementService.updateProject(req.user, projectId, body);
  }

  @Post("projects/:projectId/assignments")
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager)
  async addAssignment(
    @Req() req: { user: User },
    @Param("projectId") projectId: string,
    @Body()
    body: {
      employeeId: string;
      teamMemberName: string;
      allocationPercent: number;
      dailyRate: number;
      signedStartDate: string;
      signedEndDate: string;
    }
  ) {
    return this.revenueManagementService.addAssignment(req.user, projectId, body);
  }

  @Post("projects/:projectId/assignments/bulk-upload")
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager)
  async bulkUploadAssignments(
    @Req() req: { user: User },
    @Param("projectId") projectId: string,
    @Body()
    body: {
      rows: Array<{
        employeeId: string;
        teamMemberName: string;
        allocationPercent: number;
        dailyRate: number;
        signedStartDate: string;
        signedEndDate: string;
      }>;
    }
  ) {
    return this.revenueManagementService.bulkUploadAssignments(req.user, projectId, body.rows);
  }

  @Get("projects/:projectId/assignments")
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager, UserRole.delivery_head)
  async listAssignments(@Req() req: { user: User }, @Param("projectId") projectId: string) {
    return this.revenueManagementService.listAssignments(req.user, projectId);
  }

  @Put("assignments/:assignmentId")
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager)
  async updateAssignment(
    @Req() req: { user: User },
    @Param("assignmentId") assignmentId: string,
    @Body()
    body: Partial<{
      teamMemberName: string;
      allocationPercent: number;
      dailyRate: number;
      signedStartDate: string;
      signedEndDate: string;
    }>
  ) {
    return this.revenueManagementService.updateAssignment(req.user, assignmentId, body);
  }

  @Post("projects/:projectId/attendance")
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager)
  async addAttendance(
    @Req() req: { user: User },
    @Param("projectId") projectId: string,
    @Body() body: { assignmentId: string; month: string; actualDays: number }
  ) {
    return this.revenueManagementService.recordAttendance(req.user, projectId, body);
  }

  @Post("projects/:projectId/attendance/bulk-upload")
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager)
  async bulkUploadAttendance(
    @Req() req: { user: User },
    @Param("projectId") projectId: string,
    @Body() body: { rows: Array<{ assignmentId: string; month: string; actualDays: number }> }
  ) {
    return this.revenueManagementService.bulkUploadAttendance(req.user, projectId, body.rows);
  }

  @Get("projects/:projectId/attendance")
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager, UserRole.delivery_head)
  async listAttendance(@Req() req: { user: User }, @Param("projectId") projectId: string) {
    return this.revenueManagementService.listAttendance(req.user, projectId);
  }

  @Delete("projects/:projectId/attendance/:attendanceId")
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager)
  async deleteAttendance(
    @Req() req: { user: User },
    @Param("projectId") projectId: string,
    @Param("attendanceId") attendanceId: string
  ) {
    return this.revenueManagementService.deleteAttendance(req.user, projectId, attendanceId);
  }

  @Post("assignments/:assignmentId/rate-revisions")
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager)
  async createRateRevision(
    @Req() req: { user: User },
    @Param("assignmentId") assignmentId: string,
    @Body() body: { effectiveDate: string; newRate: number; authorizerId: string }
  ) {
    return this.revenueManagementService.createRateRevision(req.user, assignmentId, body);
  }

  @Get("assignments/:assignmentId/rate-revisions")
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager, UserRole.delivery_head)
  async listRateRevisions(@Req() req: { user: User }, @Param("assignmentId") assignmentId: string) {
    return this.revenueManagementService.listRateRevisions(req.user, assignmentId);
  }

  @Post("assignments/:assignmentId/projections")
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager)
  async createProjection(
    @Req() req: { user: User },
    @Param("assignmentId") assignmentId: string,
    @Body() body: { startDate: string; endDate: string; projectionRate: number }
  ) {
    return this.revenueManagementService.createProjection(req.user, assignmentId, body);
  }

  @Post("projections/bulk-upload")
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager)
  async bulkUploadProjections(
    @Req() req: { user: User },
    @Body() body: { rows: Array<{ assignmentId: string; startDate: string; endDate: string; projectionRate: number }> }
  ) {
    return this.revenueManagementService.bulkUploadProjections(req.user, body.rows);
  }

  @Post("projections/:projectionId/convert-to-signed")
  @Roles(UserRole.admin, UserRole.delivery_manager, UserRole.account_manager)
  async convertProjection(
    @Req() req: { user: User },
    @Param("projectionId") projectionId: string,
    @Body() body: { convertedByUserId: string }
  ) {
    return this.revenueManagementService.convertProjectionToSigned(req.user, projectionId, body.convertedByUserId);
  }
}
