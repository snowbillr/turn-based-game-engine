import {
  Flow,
  FlowNode,
  FlowOnEndCallback,
  FlowOnStartCallback,
} from './flow.js';

// TODO - can the node config and the node types be combined?
interface FlowBuilderNodeConfig<State> {
  id: string;

  playerId?: string;
  autoAdvance?: boolean;

  onStart?: FlowOnStartCallback<State>;
  onEnd?: FlowOnEndCallback;
}

interface FlowBuilderNode<State> {
  id: string;
  children: FlowBuilderNode<State>[];

  playerId?: string;
  autoAdvance?: boolean;

  onStart?: FlowOnStartCallback<State>;
  onEnd?: FlowOnEndCallback;
}

export class FlowBuilder<State> {
  private nodes: FlowBuilderNode<State>[] = [];

  // TODO add convenience methods for defining nodes
  // - method to build a node for each player
  // - aliases for rounds, turns, etc.

  node(
    config: FlowBuilderNodeConfig<State>,
    children: FlowBuilderNode<State>[] = [],
  ): FlowBuilderNode<State> {
    const flowNode = {
      id: config.id,
      children,

      autoAdvance: config.autoAdvance ?? false,
      playerId: config.playerId,

      onStart: config.onStart,
      onEnd: config.onEnd,
    };

    // don't record leaf nodes
    // leaf nodes will be built from `children` references
    if (children.length > 0) {
      this.nodes.push(flowNode);
    }

    return flowNode;
  }

  build(): Flow<State> {
    const flowNodes = this.nodes.map((n) => this.buildFlowNode(n));

    return new Flow(flowNodes);
  }

  private buildFlowNode(node: FlowBuilderNode<State>): FlowNode<State> {
    return {
      id: node.id,
      children: node.children.map((c) => this.buildFlowNode(c)),
      playerId: node.playerId,
      onStart: node.autoAdvance
        ? async (f) => {
            await node.onStart?.(f);
            await f.next();
          }
        : node.onStart,
      onEnd: node.onEnd,
    };
  }
}
