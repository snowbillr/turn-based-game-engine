import { State } from "./engine.js";
import { FlowContext } from "./flow.js";

export type FlowAction = (
  state: State,
  f: FlowContext,
) => void;

export type FlowCleanup = (state: State) => void;

interface FlowNodeOptions {
  playerId?: string;
  actions?: FlowAction[];
  cleanup?: FlowCleanup[];
}

export class FlowNode {
  public playerId?: string
  public actions: FlowAction[]
  public cleanup: FlowCleanup[]

  constructor(
    public id: string,
    public children: FlowNode[],
    options: FlowNodeOptions = {},
  ) {
    this.playerId = options.playerId;
    this.actions = options.actions ?? [];
    this.cleanup = options.cleanup ?? [];
  }
}