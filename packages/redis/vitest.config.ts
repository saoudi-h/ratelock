import { defineConfig } from "vitest/config"
import { base } from "@ratelock/vitest"
import { config } from 'dotenv'

config({ path: '.env.test' })


export default defineConfig({
  ...base,
});