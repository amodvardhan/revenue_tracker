import "reflect-metadata";

import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../../src/app.module";

describe("POST /api/financial/recompute", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns one recomputed key for targeted recompute", async () => {
    const factsResponse = await request(app.getHttpServer()).get("/api/financial/facts").expect(200);
    expect(Array.isArray(factsResponse.body)).toBe(true);
    expect(factsResponse.body.length).toBeGreaterThan(0);
    const [employeeId, projectId, month] = (factsResponse.body[0].computeKey as string).split("|");

    const response = await request(app.getHttpServer())
      .post("/api/financial/recompute")
      .send({
        employeeId,
        projectId,
        month
      })
      .expect(201);

    expect(response.body).toEqual({
      recomputedKeys: [`${employeeId}|${projectId}|${month}`]
    });
  });

  it("returns 400 for invalid payload", async () => {
    await request(app.getHttpServer())
      .post("/api/financial/recompute")
      .send({
        employeeId: "   ",
        projectId: " ",
        month: "2026-05"
      })
      .expect(400);
  });

  it("keeps dashboard and export totals in parity", async () => {
    const dashboard = await request(app.getHttpServer()).get("/api/financial/dashboard").expect(200);
    const exported = await request(app.getHttpServer()).get("/api/financial/export").expect(200);

    expect(dashboard.body).toHaveProperty("totals");
    expect(exported.body.totals).toEqual(dashboard.body.totals);
  });

  it("returns facts payload matching frontend contract", async () => {
    const response = await request(app.getHttpServer()).get("/api/financial/facts").expect(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        computeKey: expect.any(String),
        month: expect.any(String),
        employeeId: expect.any(String),
        projectId: expect.any(String),
        projectName: expect.any(String),
        account: expect.any(String),
        clientName: expect.any(String),
        teamMemberName: expect.any(String),
        status: expect.stringMatching(/blocked|provisional|final/),
        signedRevenue: expect.any(Number),
        projectedRevenue: expect.any(Number),
        totalRevenue: expect.any(Number),
        actualCost: expect.any(Number),
        plannedRevenue: expect.any(Number),
        plannedMargin: expect.any(Number),
        actualMargin: expect.any(Number),
        marginVariance: expect.any(Number)
      })
    );
  });
});
