import { State } from './engine.js';
import {
  Flow,
  FlowNode,
  FlowCleanup,
  FlowAction,
  FlowContext,
} from './flow.js';

interface FlowBuilderNodeConfig {
  id: string; // TODO - make optional and generate unique ids if missing

  playerId?: string;
  autoAdvance?: boolean;

  actions?: FlowAction[];
  cleanup?: FlowCleanup[];
}

interface FlowBuilderNode {
  id: string;
  children: FlowBuilderNode[];

  playerId?: string;
  autoAdvance?: boolean;

  actions?: FlowAction[];
  cleanup?: FlowCleanup[];
}

export class FlowBuilder {
  private nodes: FlowBuilderNode[] = [];

  // TODO add convenience methods for defining nodes
  // - method to build a node for each player
  // - aliases for rounds, turns, etc.

  node(
    config: FlowBuilderNodeConfig,
    children: FlowBuilderNode[] = [],
  ): FlowBuilderNode {
    const flowNode = {
      id: config.id,
      children,

      autoAdvance: config.autoAdvance ?? false,
      playerId: config.playerId,

      actions: config.actions,
      cleanup: config.cleanup,
    };

    // don't record leaf nodes
    // leaf nodes will be built from `children` references
    if (children.length > 0) {
      this.nodes.push(flowNode);
    }

    return flowNode;
  }

  build(): Flow {
    const flowNodes = this.nodes.map((n) => this.buildFlowNode(n));

    return new Flow(flowNodes);
  }

  private buildFlowNode(node: FlowBuilderNode): FlowNode {
    const actions: FlowAction[] = node.actions ? [...node.actions] : [];

    if (node.autoAdvance) {
      actions.push(async (_state: State, f: FlowContext) => {
        await f.next();
      });
    }

    // TODO make a FlowNode class
    const runActions = async (state: State, f: FlowContext) => {
      for (const action of actions) {
        await action(state, f);
      }
    }

    const runCleanup = (state: State) => {
      if (node.cleanup) {
        for (const cleanup of node.cleanup) {
            cleanup(state);
        }
      }
    }

    return {
      id: node.id,
      children: node.children.map((c) => this.buildFlowNode(c)),
      playerId: node.playerId,
      actions,
      cleanup: node.cleanup,
      runActions,
      runCleanup,
    };
  }
}
