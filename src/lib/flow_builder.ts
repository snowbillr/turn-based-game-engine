import hash from 'hash-it';

import { Flow, FlowAction, FlowActionId, FlowCleanup, FlowCleanupId } from './flow.js';
import { FlowNode } from './flow_node.js';

interface FlowBuilderNodeConfig {
  id: string; // TODO - make optional and generate unique ids if missing

  playerId?: string;

  actions?: FlowActionId[];
  cleanups?: FlowCleanupId[];
}

interface FlowBuilderOutput<Attributes> {
  flow: Flow;
  actions: { [key: FlowActionId]: FlowAction<Attributes> };
  cleanups: { [key: FlowCleanupId]: FlowCleanup };
}

export class FlowBuilder<Attributes> {
  private nodes: FlowNode[] = [];
  private actions: { [key: FlowActionId]: FlowAction<Attributes> } = {};
  private cleanups: { [key: FlowCleanupId]: FlowCleanup } = {};

  constructor() {}

  // TODO add convenience methods for defining nodes
  // - method to build a node for each player
  // - method to wrap an action as autoadvance
  // - aliases for rounds, turns, etc.

  node(
    config: FlowBuilderNodeConfig,
    children: FlowNode[] = [],
  ): FlowNode {
    const flowNode = new FlowNode(
      config.id,
      children,
      {
        playerId: config.playerId,
        actionIds: config.actions,
        cleanupIds: config.cleanups,
      }
    );

    // don't record leaf nodes
    // leaf nodes will be built from `children` references
    if (children.length > 0) {
      this.nodes.push(flowNode);
    }

    return flowNode;
  }

  action(action: FlowAction<Attributes>): FlowActionId {
    const actionId = hash(action.toString());
    this.actions[actionId] = action;

    return actionId;
  }

  cleanup(cleanup: FlowCleanup): FlowCleanupId {
    const cleanupId = hash(cleanup.toString());
    this.cleanups[cleanupId] = cleanup;

    return cleanupId;
  }

  build(actionRunner: (action: FlowActionId) => void, cleanupRunner: (cleanup: FlowCleanupId) => void): FlowBuilderOutput<Attributes> {
    return {
      flow: new Flow(this.nodes, actionRunner, cleanupRunner),
      actions: this.actions,
      cleanups: this.cleanups,
    }
  }
}
