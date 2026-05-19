import { workflow, step } from "@ecp/core"

export default workflow("Echo JS")
  .run([step("@ecp/test.echo", "Echo").with({ value: "hello from JavaScript" }).as("echo")])
