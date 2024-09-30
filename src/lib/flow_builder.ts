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

  // TODO add convenience methods for defining nodes
  // - method to automatically call f.next()
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

    this.nodes.push(flowNode)

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

  build(actionRunner: (action: FlowActionId) => void | Promise<void>, cleanupRunner: (cleanup: FlowCleanupId) => void): FlowBuilderOutput<Attributes> {
    const nodes = this.getTopLevelNodes();
    
    return {
      flow: new Flow(nodes, actionRunner, cleanupRunner),
      actions: this.nodeActions,
      cleanups: this.nodeCleanups,
    }
  }

  private getTopLevelNodes(): FlowNode[] {
    // get all children nodes recursively
    const getChildren = (node: FlowNode): FlowNode[] => node.children.length ? node.children.flatMap(getChildren) : [node];
    const allChildren = this.nodes.flatMap(n => n.children).flatMap(getChildren);

    // remove them from topLevelNodes
    return this.nodes.filter(n => !allChildren.includes(n));
  }
}
