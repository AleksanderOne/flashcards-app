import "@testing-library/jest-dom";
import { vi, beforeEach } from "vitest";

/**
 * Globalne wyciszenie console.error i console.warn w testach
 *
 * Zapobiega zaśmiecaniu output testów logami błędów
 * które są oczekiwanym zachowaniem (np. testy error handling).
 */
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
