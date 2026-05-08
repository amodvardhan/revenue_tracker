import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardPage } from "./DashboardPage";

describe("DashboardPage", () => {
  it("renders monthly fact status and margin variance in the financial grid", async () => {
    render(<DashboardPage />);

    expect(await screen.findByText("Final")).toBeInTheDocument();
    expect(screen.getByText("+200.00")).toBeInTheDocument();
  });
});
