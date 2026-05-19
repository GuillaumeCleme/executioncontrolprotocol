import { workflow, step } from "@ecp/core"

export default workflow("Echo test")
  .run([step("@ecp/test.echo", "Echo").with({ value: "hello from fluent API" }).as("echo")])
