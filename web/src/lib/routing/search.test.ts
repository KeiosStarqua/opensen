import { describe, expect, it } from "vitest";

import { optionalString, parseSearch, stringifySearch } from "./search";

describe("search serialization", () => {
  it("keeps values as plain strings", () => {
    expect(parseSearch("?i=1&add=1")).toEqual({ i: "1", add: "1" });
    expect(stringifySearch({ i: "2", claim: undefined })).toBe("?i=2");
  });

  it("round-trips encoded redirect targets", () => {
    const search = stringifySearch({ redirectTo: "/practice/done?claim=1" });
    expect(search).toBe("?redirectTo=%2Fpractice%2Fdone%3Fclaim%3D1");
    expect(parseSearch(search)).toEqual({ redirectTo: "/practice/done?claim=1" });
  });

  it("returns an empty string without params", () => {
    expect(stringifySearch({})).toBe("");
  });
});

describe("optionalString", () => {
  it("drops empty and non-string values", () => {
    expect(optionalString("x")).toBe("x");
    expect(optionalString("")).toBeUndefined();
    expect(optionalString(1)).toBeUndefined();
  });
});
