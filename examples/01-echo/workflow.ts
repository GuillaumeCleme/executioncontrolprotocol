import { workflow, step } from "@executioncontextprotocol/core"

export default workflow("Echo test")
  .run([step("@executioncontextprotocol/test.echo", "Echo").with({ value: "hello from fluent API" }).as("echo")])
