import { defineConfig } from "vitest/config";
import { projects } from "@ratelock/vitest";
const globalConfig = defineConfig({
  ...projects,
});

export default globalConfig;
