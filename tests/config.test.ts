import { expect, test } from "bun:test";
import { parseMentionAllowlist } from "../src/config";

test("parses and deduplicates mention allowlist IDs", () => {
  const allowlist = parseMentionAllowlist(
    " 123456789012345678,234567890123456789,123456789012345678 ",
  );

  expect([...allowlist]).toEqual(["123456789012345678", "234567890123456789"]);
});

test("empty mention allowlists deny every user", () => {
  expect(parseMentionAllowlist("").size).toBe(0);
});

test("rejects invalid mention allowlist IDs", () => {
  expect(() => parseMentionAllowlist("not-a-discord-id")).toThrow("Invalid Discord user ID");
});
