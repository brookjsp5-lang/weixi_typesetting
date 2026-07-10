import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_POSTER_TEXT_STYLE,
  createPosterTextCardArea,
  isPosterTextCardEnabled,
  normalizePosterTextStyle,
} from "../app/_lib/poster-text-style.js";

test("normalizePosterTextStyle falls back to safe poster defaults", () => {
  assert.deepEqual(
    normalizePosterTextStyle({
      cardEnabled: "yes",
      cardXPercent: -20,
      cardYPercent: 120,
      cardWidthPercent: 5,
      fontScalePercent: 240,
      titleColor: "black",
      quoteColor: "#123",
      noteColor: "#123abc",
      strokeColor: "#f8fafc",
      cardBackgroundColor: "#fff",
      cardOpacity: 2,
      accentColor: "#10b981",
      shadowEnabled: "no",
    }),
    {
      ...DEFAULT_POSTER_TEXT_STYLE,
      cardXPercent: 0,
      cardYPercent: 78,
      cardWidthPercent: 48,
      fontScalePercent: 125,
      noteColor: "#123abc",
      strokeColor: "#f8fafc",
      accentColor: "#10b981",
      cardOpacity: 1,
    },
  );
});

test("createPosterTextCardArea converts poster style percentages into canvas area", () => {
  const style = normalizePosterTextStyle({
    cardXPercent: 10,
    cardYPercent: 58,
    cardWidthPercent: 76,
  });
  const area = createPosterTextCardArea(style);

  assert.deepEqual(area, {
    x: 90,
    y: 696,
    width: 684,
    maxHeight: 408,
  });
});

test("isPosterTextCardEnabled follows normalized poster style", () => {
  assert.equal(isPosterTextCardEnabled({}), true);
  assert.equal(isPosterTextCardEnabled({ cardEnabled: false }), false);
});
