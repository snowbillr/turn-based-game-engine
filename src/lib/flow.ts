import { Stack } from './stack.js';
import { FlowNode } from './flow_node.js';
import { Queue } from './queue.js';
import { FlowContext, State } from './engine.js';

export type FlowActionId = number;
export type FlowCleanupId = number;

export type FlowAction<Attributes> = (
  state: State,
  f: FlowContext<Attributes>,
) => void | Promise<void>;

export type FlowCleanup = (state: State) => void;

/*
  The flow of the game is defined as a tree of nodes.
  It is traversed depth-first as the game advances, with one step of the game resulting in visiting a new node.
  A node's onStart callback is executed when the node is visited.
  A node's onEnd callback is executed when all of a node's children have been visited.
  The traversal is restarted when there are no more nodes to visit.
*/
export class Flow {
  private traversalStack = new Stack<FlowNode>();
  private visitedNodeIds: string[] = [];

  private actionIdQueue = new Queue<FlowActionId>();

  constructor(
    private nodes: FlowNode[],
    private actionRunner: (action: FlowActionId) => void,
    private cleanupRunner: (cleanup: FlowCleanupId) => void) {}

  start() {
    if (this.nodes.length === 0) throw new Error('Cannot start flow with no nodes');

    this.visitedNodeIds = [];

    const nodes = this.nodes.slice().reverse();
    const currentNode = nodes[0];

    this.traversalStack.push(...nodes);
    this.visitNode(currentNode);
  }

 /*
    A depth-first traversal is of the node graph.
    A stack is used to keep track of the nodes that need to be visited. When a node is visited,
    its children are pushed onto the stack in reverse order.
    A list of visited nodes is used to determine if a node is being exited when it returns to the top of the stack.
  */
  next() {
    if (this.traversalStack.size() === 0) {
      this.start();
      return;
    }

    if (this.actionIdQueue.size() > 0) {
      this.runAction();
      return;
    }

    const previous = this.traversalStack.peek();

    if (previous.children.length > 0) {
      this.traversalStack.push(...previous.children.slice().reverse());
      this.visitNode(this.currentNode());
      return;
    } else {
      // We know better than TypeScript here that the stack is not empty
      // because of the `size` check at the top of `next`.
      this.leaveNode(this.traversalStack.pop()!);
      if (this.traversalStack.size() === 0) {
        this.start();
        return;
      }

      while (this.hasVisitedNode(this.currentNode())) {
        // We know better than TypeScript here that the stack is not empty
        // because of the `size` check before this while loop
        this.leaveNode(this.traversalStack.pop()!);
        if (this.traversalStack.size() === 0) {
          this.start();
          return;
        }
      }

      this.visitNode(this.currentNode());
    }
  }

  currentNode(): FlowNode {
    return this.traversalStack.peek();
  }

  private visitNode(node: FlowNode) {
    this.visitedNodeIds.push(node.id);

    this.queueActionIds(node.actionIds);
    this.runAction();
  }

  private leaveNode(node: FlowNode) {
    for (const cleanupId of node.cleanupIds) {
      this.cleanupRunner(cleanupId);
    }
  }

  private runAction() {
    const actionId = this.actionIdQueue.pop();
    if (actionId) this.actionRunner(actionId);
  }

  private queueActionIds(actions: FlowActionId[]) {
    this.actionIdQueue.push(...actions);
  }

  private hasVisitedNode(node: FlowNode) {
    return this.visitedNodeIds.includes(node.id)
  }
}
