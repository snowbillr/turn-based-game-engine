import { FlowActionId, FlowCleanupId } from "./flow.js";

interface FlowNodeOptions {
  playerId?: string;
  actionIds?: FlowActionId[];
  cleanupIds?: FlowCleanupId[];
}

export class FlowNode {
  public playerId?: string
  public actionIds: FlowActionId[]
  public cleanupIds: FlowCleanupId[]

  constructor(
    public id: string,
    public children: FlowNode[],
    options: FlowNodeOptions = {},
  ) {
    this.playerId = options.playerId;
    this.actionIds = options.actionIds ?? [];
    this.cleanupIds = options.cleanupIds ?? [];
  }
}