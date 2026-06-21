import { workflow, step } from "@executioncontextprotocol/core"

export default workflow("Echo JS")
  .run([step("@executioncontextprotocol/demo.echo", "Echo").with({ value: "hello from JavaScript" }).as("echo")])
