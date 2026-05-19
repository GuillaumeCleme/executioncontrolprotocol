import { z } from "zod"

/** Zod-backed config field builders. @category Definitions */
export function boolean() {
  return z.boolean()
}

/** Zod number schema. @category Definitions */
export function number() {
  return z.number()
}

/** Zod string schema. @category Definitions */
export function string() {
  return z.string()
}

/** Zod array schema. @category Definitions */
export function array<T extends z.ZodTypeAny>(item: T) {
  return z.array(item)
}

/** Config schema type. @category Definitions */
export type ConfigSchema = z.ZodType<Record<string, unknown>>
