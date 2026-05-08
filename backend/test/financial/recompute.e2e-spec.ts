import "reflect-metadata";

import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../../src/app.module";
import { PRISMA_CLIENT } from "../../src/modules/financial/repository/financial.repository";

describe("POST /api/financial/recompute", () => {
  let app: INestApplication;
  const upsert = jest.fn(async (args: { where: { computeKey: string } }) => {
    return { computeKey: args.where.computeKey };
  });
  const baseRows = [
    {
      employeeId: "emp-1",
      projectId: "prj-1",
      computeKey: "emp-1|prj-1|2026-05",
      month: "2026-05",
      status: "final",
      plannedMargin: 1000,
      actualMargin: 1200,
      marginVariance: 200
    },
    {
      employeeId: "emp-2",
      projectId: "prj-1",
      computeKey: "emp-2|prj-1|2026-05",
      month: "2026-05",
      status: "provisional",
      plannedMargin: 300,
      actualMargin: 350,
      marginVariance: 50
    },
    {
      employeeId: "emp-3",
      projectId: "prj-2",
      computeKey: "emp-3|prj-2|2026-05",
      month: "2026-05",
      status: "blocked",
      plannedMargin: 500,
      actualMargin: 450,
      marginVariance: -50
    }
  ];
  const findMany = jest.fn(async (args?: { select?: Record<string, boolean> }) => {
    const selectedFields = args?.select ? Object.keys(args.select).filter((key) => args.select?.[key]) : [];
    if (selectedFields.length === 0) {
      return baseRows;
    }

    return baseRows.map((row) => {
      return selectedFields.reduce<Record<string, unknown>>((accumulator, field) => {
        accumulator[field] = row[field as keyof typeof row];
        return accumulator;
      }, {});
    });
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PRISMA_CLIENT)
      .useValue({
        monthlyFact: {
          upsert,
          findMany
        }
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  beforeEach(() => {
    upsert.mockClear();
    findMany.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns one recomputed key for targeted recompute", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/financial/recompute")
      .send({
        employeeId: "emp-1",
        projectId: "prj-1",
        month: "2026-05"
      })
      .expect(201);

    expect(response.body).toEqual({
      recomputedKeys: ["emp-1|prj-1|2026-05"]
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

  it("keeps upsert idempotent for same compute key", async () => {
    const payload = {
      employeeId: "emp-42",
      projectId: "prj-9",
      month: "2026-07"
    };

    const first = await request(app.getHttpServer()).post("/api/financial/recompute").send(payload).expect(201);
    const second = await request(app.getHttpServer()).post("/api/financial/recompute").send(payload).expect(201);

    expect(first.body).toEqual({
      recomputedKeys: ["emp-42|prj-9|2026-07"]
    });
    expect(second.body).toEqual({
      recomputedKeys: ["emp-42|prj-9|2026-07"]
    });
  });

  it("keeps dashboard and export totals in parity", async () => {
    const dashboard = await request(app.getHttpServer()).get("/api/financial/dashboard").expect(200);
    const exported = await request(app.getHttpServer()).get("/api/financial/export").expect(200);

    expect(dashboard.body).toEqual({
      totals: {
        plannedMargin: 1800,
        actualMargin: 2000,
        marginVariance: 200
      }
    });
    expect(exported.body.totals).toEqual(dashboard.body.totals);
  });

  it("returns facts payload matching frontend contract", async () => {
    const response = await request(app.getHttpServer()).get("/api/financial/facts").expect(200);

    expect(response.body).toEqual([
      {
        computeKey: "emp-1|prj-1|2026-05",
        month: "2026-05",
        status: "final",
        plannedMargin: 1000,
        actualMargin: 1200,
        marginVariance: 200
      },
      {
        computeKey: "emp-2|prj-1|2026-05",
        month: "2026-05",
        status: "provisional",
        plannedMargin: 300,
        actualMargin: 350,
        marginVariance: 50
      },
      {
        computeKey: "emp-3|prj-2|2026-05",
        month: "2026-05",
        status: "blocked",
        plannedMargin: 500,
        actualMargin: 450,
        marginVariance: -50
      }
    ]);
  });
});
