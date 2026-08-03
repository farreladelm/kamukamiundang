import { loadEnvConfig } from "@next/env";
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

loadEnvConfig(process.cwd());

// Vitest lacks Next.js's react-server module condition; Next build enforces this marker.
vi.mock("server-only", () => ({}));
