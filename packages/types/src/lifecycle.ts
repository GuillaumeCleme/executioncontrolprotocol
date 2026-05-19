/** Run lifecycle events. @category Lifecycle */
export type RunLifecycleEvent =
  | "run:before"
  | "run:started"
  | "run:completed"
  | "run:failed"
  | "run:cancelled"
  | "run:finally"

/** Step lifecycle events. @category Lifecycle */
export type StepLifecycleEvent =
  | "step:before"
  | "step:started"
  | "step:completed"
  | "step:failed"
  | "step:cancelled"
  | "step:paused"
  | "step:finally"

/** Policy lifecycle events. @category Lifecycle */
export type PolicyLifecycleEvent =
  | "policy:pre"
  | "policy:post"
  | "policy:finally"

/** All public lifecycle events. @category Lifecycle */
export type LifecycleEvent =
  | RunLifecycleEvent
  | StepLifecycleEvent
  | PolicyLifecycleEvent

/** Policy hook decision. @category Policies */
export type PolicyDecision =
  | { type: "allow" }
  | { type: "deny"; reason: string; code?: string }
  | { type: "pause"; reason: string; approval?: unknown }
  | { type: "modify"; patch: unknown; reason?: string }
