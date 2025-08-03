import { defineConfig } from "vitest/config";
import { baseVitestConfig } from "@ratelock/test-utils/config/vitest";

export default defineConfig({
  ...baseVitestConfig,
  test: {
    ...baseVitestConfig.test,
    environment: "node"
  }
});