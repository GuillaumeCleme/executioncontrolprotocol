import type { Command } from "@oclif/core"

/** Format thrown values for CLI error output. */
export function commandErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Runs `fn` and maps any thrown value to `cmd.error` with exit code 1.
 * Use after `parse()` so flag validation errors are not swallowed.
 */
export async function runWithCommandError(
  cmd: Command,
  fn: () => void | Promise<void>
): Promise<void> {
  try {
    await fn()
  } catch (err) {
    cmd.error(commandErrorMessage(err), { exit: 1 })
  }
}
