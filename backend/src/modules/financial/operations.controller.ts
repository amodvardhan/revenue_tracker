import { Body, Controller, Delete, Get, Inject, Param, Post, Put, UseGuards } from "@nestjs/common";
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
  @Roles(UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager)
  async createProject(
    @Body() body: { projectName: string; clientName: string; account: string; startDate?: string; endDate?: string }
  ) {
    return this.revenueManagementService.createProject(body);
  }

  @Get("projects")
  @Roles(UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager, UserRole.delivery_head)
  async listProjects() {
    return this.revenueManagementService.listProjects();
  }

  @Get("projects/:projectId")
  @Roles(UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager, UserRole.delivery_head)
  async getProject(@Param("projectId") projectId: string) {
    return this.revenueManagementService.getProject(projectId);
  }

  @Put("projects/:projectId")
  @Roles(UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager)
  async updateProject(
    @Param("projectId") projectId: string,
    @Body()
    body: Partial<{ projectName: string; clientName: string; account: string; startDate: string; endDate: string }>
  ) {
    return this.revenueManagementService.updateProject(projectId, body);
  }

  @Post("projects/:projectId/assignments")
  @Roles(UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager)
  async addAssignment(
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
    return this.revenueManagementService.addAssignment(projectId, body);
  }

  @Post("projects/:projectId/assignments/bulk-upload")
  @Roles(UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager)
  async bulkUploadAssignments(
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
    return this.revenueManagementService.bulkUploadAssignments(projectId, body.rows);
  }

  @Get("projects/:projectId/assignments")
  @Roles(UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager, UserRole.delivery_head)
  async listAssignments(@Param("projectId") projectId: string) {
    return this.revenueManagementService.listAssignments(projectId);
  }

  @Put("assignments/:assignmentId")
  @Roles(UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager)
  async updateAssignment(
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
    return this.revenueManagementService.updateAssignment(assignmentId, body);
  }

  @Post("projects/:projectId/attendance")
  @Roles(UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager)
  async addAttendance(
    @Param("projectId") projectId: string,
    @Body() body: { assignmentId: string; month: string; actualDays: number }
  ) {
    return this.revenueManagementService.recordAttendance(projectId, body);
  }

  @Post("projects/:projectId/attendance/bulk-upload")
  @Roles(UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager)
  async bulkUploadAttendance(
    @Param("projectId") projectId: string,
    @Body() body: { rows: Array<{ assignmentId: string; month: string; actualDays: number }> }
  ) {
    return this.revenueManagementService.bulkUploadAttendance(projectId, body.rows);
  }

  @Get("projects/:projectId/attendance")
  @Roles(UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager, UserRole.delivery_head)
  async listAttendance(@Param("projectId") projectId: string) {
    return this.revenueManagementService.listAttendance(projectId);
  }

  @Delete("projects/:projectId/attendance/:attendanceId")
  @Roles(UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager)
  async deleteAttendance(
    @Param("projectId") projectId: string,
    @Param("attendanceId") attendanceId: string
  ) {
    return this.revenueManagementService.deleteAttendance(projectId, attendanceId);
  }

  @Post("assignments/:assignmentId/rate-revisions")
  @Roles(UserRole.delivery_manager, UserRole.account_manager)
  async createRateRevision(
    @Param("assignmentId") assignmentId: string,
    @Body() body: { effectiveDate: string; newRate: number; authorizerId: string }
  ) {
    return this.revenueManagementService.createRateRevision(assignmentId, body);
  }

  @Get("assignments/:assignmentId/rate-revisions")
  @Roles(UserRole.delivery_manager, UserRole.account_manager, UserRole.project_manager, UserRole.delivery_head)
  async listRateRevisions(@Param("assignmentId") assignmentId: string) {
    return this.revenueManagementService.listRateRevisions(assignmentId);
  }

  @Post("assignments/:assignmentId/projections")
  @Roles(UserRole.delivery_manager, UserRole.account_manager)
  async createProjection(
    @Param("assignmentId") assignmentId: string,
    @Body() body: { startDate: string; endDate: string; projectionRate: number }
  ) {
    return this.revenueManagementService.createProjection(assignmentId, body);
  }

  @Post("projections/bulk-upload")
  @Roles(UserRole.delivery_manager, UserRole.account_manager)
  async bulkUploadProjections(
    @Body() body: { rows: Array<{ assignmentId: string; startDate: string; endDate: string; projectionRate: number }> }
  ) {
    return this.revenueManagementService.bulkUploadProjections(body.rows);
  }

  @Post("projections/:projectionId/convert-to-signed")
  @Roles(UserRole.delivery_manager, UserRole.account_manager)
  async convertProjection(
    @Param("projectionId") projectionId: string,
    @Body() body: { convertedByUserId: string }
  ) {
    return this.revenueManagementService.convertProjectionToSigned(projectionId, body.convertedByUserId);
  }
}
