import { Args, Command, Flags } from "@oclif/core"
import { loadEnvironmentModule } from "@ecp/core"
import type { Environment } from "@ecp/core"

/** Shared `--env` flag for commands that load an environment module. */
export const envModuleFlags = {
  env: Flags.string({
    required: true,
    description: "Path to environment module (.ts or .js)",
  }),
}

/**
 * Base for commands that require an environment module (`--env`).
 * @category CLI
 */
export abstract class EnvModuleCommand extends Command {
  static flags = {
    ...Command.baseFlags,
    ...envModuleFlags,
  }

  /** Load environment from parsed flags. */
  protected async loadEnv(flags: { env: string }): Promise<Environment> {
    return loadEnvironmentModule(flags.env)
  }
}

/**
 * Base for commands that take a workflow path and `--env`.
 * @category CLI
 */
export abstract class WorkflowEnvCommand extends EnvModuleCommand {
  static args = {
    "workflow-path": Args.string({
      required: true,
      description: "Workflow file (.ts, .js, or .json)",
    }),
  }
}
