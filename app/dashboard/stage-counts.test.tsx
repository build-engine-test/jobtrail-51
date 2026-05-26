// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";

import { StageCounts } from "./stage-counts";

afterEach(() => {
  cleanup();
});

describe("renders_all_five_stage_cards", () => {
  it("renders 5 cards with stage labels and counts", () => {
    render(
      <StageCounts
        counts={{
          saved: 2,
          applied: 1,
          interviewing: 0,
          offer: 0,
          rejected: 1,
        }}
      />,
    );

    const labels = ["Saved", "Applied", "Interviewing", "Offer", "Rejected"];
    for (const label of labels) {
      expect(screen.getByText(label)).toBeTruthy();
    }

    const savedCard = screen.getByTestId("stage-card-saved");
    expect(within(savedCard).getByText("2")).toBeTruthy();

    const appliedCard = screen.getByTestId("stage-card-applied");
    expect(within(appliedCard).getByText("1")).toBeTruthy();

    const interviewingCard = screen.getByTestId("stage-card-interviewing");
    expect(within(interviewingCard).getByText("0")).toBeTruthy();

    const offerCard = screen.getByTestId("stage-card-offer");
    expect(within(offerCard).getByText("0")).toBeTruthy();

    const rejectedCard = screen.getByTestId("stage-card-rejected");
    expect(within(rejectedCard).getByText("1")).toBeTruthy();
  });

  it("renders a total card summing all stages", () => {
    render(
      <StageCounts
        counts={{
          saved: 2,
          applied: 1,
          interviewing: 0,
          offer: 0,
          rejected: 1,
        }}
      />,
    );

    const totalCard = screen.getByTestId("stage-card-total");
    expect(within(totalCard).getByText("4")).toBeTruthy();
    expect(within(totalCard).getByText(/total/i)).toBeTruthy();
  });
});
