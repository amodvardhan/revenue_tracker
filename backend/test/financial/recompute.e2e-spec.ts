import "reflect-metadata";

import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../../src/app.module";
import { PRISMA_CLIENT } from "../../src/modules/financial/repository/financial.repository";

describe("POST /api/financial/recompute", () => {
  let app: INestApplication;
  const seenKeys = new Set<string>();
  const upsert = jest.fn(async (args: { where: { computeKey: string } }) => {
    seenKeys.add(args.where.computeKey);
    return { computeKey: args.where.computeKey };
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PRISMA_CLIENT)
      .useValue({
        monthlyFact: {
          upsert
        }
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
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
        employeeId: "",
        projectId: " ",
        month: "2026/05",
        unknownField: "not-allowed"
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
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(seenKeys.size).toBe(2);
    expect(seenKeys.has("emp-42|prj-9|2026-07")).toBe(true);
  });
});
