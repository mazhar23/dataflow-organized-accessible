import { describe, it, expect } from "vitest";
import {
  getPasswordCriteriaMet,
  isPasswordValid,
} from "@/components/PasswordStrengthMeter";

describe("Password Complexity Validation", () => {
  describe("isPasswordValid", () => {
    it("rejects empty password", () => {
      expect(isPasswordValid("")).toBe(false);
    });

    it("rejects password shorter than 8 characters", () => {
      expect(isPasswordValid("Ab1!xy")).toBe(false);
    });

    it("rejects password without uppercase letter", () => {
      expect(isPasswordValid("abcdef1!")).toBe(false);
    });

    it("rejects password without lowercase letter", () => {
      expect(isPasswordValid("ABCDEF1!")).toBe(false);
    });

    it("rejects password without digit", () => {
      expect(isPasswordValid("Abcdefg!")).toBe(false);
    });

    it("rejects password without special character", () => {
      expect(isPasswordValid("Abcdefg1")).toBe(false);
    });

    it("accepts password meeting all criteria", () => {
      expect(isPasswordValid("Abcdef1!")).toBe(true);
    });

    it("accepts strong complex password", () => {
      expect(isPasswordValid("MyP@ssw0rd_2026")).toBe(true);
    });
  });

  describe("getPasswordCriteriaMet", () => {
    it("returns all false for empty password", () => {
      const results = getPasswordCriteriaMet("");
      expect(results).toEqual([false, false, false, false, false]);
    });

    it("returns correct criteria for partial password", () => {
      // "abc" → length fail, no uppercase, has lowercase, no digit, no special
      const results = getPasswordCriteriaMet("abc");
      expect(results).toEqual([false, false, true, false, false]);
    });

    it("returns all true for valid password", () => {
      const results = getPasswordCriteriaMet("Abcdef1!");
      expect(results).toEqual([true, true, true, true, true]);
    });

    it("counts criteria correctly for strength meter levels", () => {
      // Only lowercase and length >= 8
      const results = getPasswordCriteriaMet("abcdefgh");
      const met = results.filter(Boolean).length;
      expect(met).toBe(2); // length + lowercase
    });
  });
});
