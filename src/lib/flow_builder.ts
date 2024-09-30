import hash from 'hash-it';
import { v7 as uuidv7 } from 'uuid';

import { Flow, FlowAction, FlowActionId, FlowCleanup, FlowCleanupId } from './flow.js';
import { FlowNode } from './flow_node.js';

interface FlowBuilderNodeConfig {
  id?: string;

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
  private nodeActions: { [key: FlowActionId]: FlowAction<Attributes> } = {};
  private nodeCleanups: { [key: FlowCleanupId]: FlowCleanup } = {};

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
      config.id ?? uuidv7(),
      children,
      {
        playerId: config.playerId,
        actionIds: config.actions,
        cleanupIds: config.cleanups,
      }
    );

    // TODO - this will break for leaf nodes at the top level
    // don't record leaf nodes
    // leaf nodes will be built from `children` references
    if (children.length > 0) {
      this.nodes.push(flowNode);
    }

    return flowNode;
  }

  action(action: FlowAction<Attributes>): FlowActionId {
    const actionId = hash(action.toString());
    this.nodeActions[actionId] = action;

    return actionId;
  }

  actions(...actions: FlowAction<Attributes>[]): FlowActionId[] {
    return actions.map(action => this.action(action));
  }

  cleanup(cleanup: FlowCleanup): FlowCleanupId {
    const cleanupId = hash(cleanup.toString());
    this.nodeCleanups[cleanupId] = cleanup;

    return cleanupId;
  }

  cleanups(...cleanups: FlowCleanup[]): FlowCleanupId[] {
    return cleanups.map(cleanup => this.cleanup(cleanup));
  }

  build(actionRunner: (action: FlowActionId) => void, cleanupRunner: (cleanup: FlowCleanupId) => void): FlowBuilderOutput<Attributes> {
    return {
      flow: new Flow(this.nodes, actionRunner, cleanupRunner),
      actions: this.nodeActions,
      cleanups: this.nodeCleanups,
    }
  }
}
