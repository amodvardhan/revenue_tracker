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
});
