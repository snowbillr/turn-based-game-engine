import { Stack } from './stack.js';
import { FlowNode } from './flow_node.js';
import { Queue } from './queue.js';
import { FlowContext, State } from './engine.js';

export type FlowActionId = number;
export type FlowCleanupId = number;

// TODO - return a symbol from FlowAction to ensure that f.next() was the last thing called
export type FlowAction<Attributes> = (
  state: State,
  f: FlowContext<Attributes>,
) => void | Promise<void>;

export type FlowCleanup<Attributes> = (state: State, f: FlowContext<Attributes>) => void;

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
  private cleanupIdQueue = new Queue<FlowCleanupId>();

  constructor(
    private nodes: FlowNode[],
    private actionRunner: (action: FlowActionId) => void | Promise<void>,
    private cleanupRunner: (cleanup: FlowCleanupId) => void | Promise<void>) {}

  start() {
    if (this.nodes.length === 0) throw new Error('Cannot start flow with no nodes');

    this.visitedNodeIds = [];

    const nodes = this.nodes.slice().reverse();

    this.traversalStack.push(...nodes);
    this.visitNode(this.traversalStack.peek());
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

    if (this.cleanupIdQueue.size() > 0) {
      this.runCleanup();
      return;
    }

    const current = this.traversalStack.peek();

    if (this.hasVisitedNode(current)) {
      this.leaveNode(current);
    } else {
      this.visitNode(current);
    }

    // go to the next node on the stack

    // if we've entered the `current` node, leave it
    //   either descend if children or pop if none
    // if we haven't entered the `current` node, visit it

    // if (current.children.length > 0) {
    //   this.visitNode(this.currentNode());
    //   return;
    // } else {
      // We know better than TypeScript here that the stack is not empty
      // because of the `size` check at the top of `next`.
      // this.leaveNode(this.traversalStack.pop()!);
      // if (this.traversalStack.size() === 0) {
      //   this.start();
      //   return;
      // }

      // while (this.hasVisitedNode(this.currentNode())) {
      //   // We know better than TypeScript here that the stack is not empty
      //   // because of the `size` check before this while loop
      //   this.leaveNode(this.traversalStack.pop()!);
      //   if (this.traversalStack.size() === 0) {
      //     this.start();
      //     return;
      //   }
      // }

      // this.visitNode(this.currentNode());
    // }
  }

  // is this only ever called in cleanup?
  repeat() {
    // stop traversing upwards and redo pushing the current node's children on the stack and visiting it
    // remove it from visited nodes
  }

  currentNode(): FlowNode {
    return this.traversalStack.peek();
  }

  private visitNode(node: FlowNode) {
    this.visitedNodeIds.push(node.id);

    if (node.children.length > 0) {
      this.traversalStack.push(...node.children.slice().reverse());
    }

    // TODO - if there are no actions, call next()
    if (node.actionIds.length === 0) {
      this.next();
    } else {
      this.queueActionIds(node.actionIds);
      this.runAction();
    }
  }

  private leaveNode(node: FlowNode) {
    this.traversalStack.pop();
    // TODO - if there are no cleanups, call next()
    // for (const cleanupId of node.cleanupIds) {
    //   this.cleanupRunner(cleanupId);
    // }
    if (node.cleanupIds.length === 0) {
      this.next();
    } else {
      this.queueCleanupIds(node.cleanupIds);
      this.runCleanup();
    }
  }

  private runAction() {
    const actionId = this.actionIdQueue.pop();
    if (actionId) void this.actionRunner(actionId); // using `void` to ignore the promise - flow is executed through calls to the `next` method
  }

  private runCleanup() {
    const cleanupId = this.cleanupIdQueue.pop();
    if (cleanupId) void this.cleanupRunner(cleanupId); // using `void` to ignore the promise - flow is executed through calls to the `next` method
  }

  private queueActionIds(actionIds: FlowActionId[]) {
    this.actionIdQueue.push(...actionIds);
  }

  private queueCleanupIds(cleanupIds: FlowCleanupId[]) {
    this.cleanupIdQueue.push(...cleanupIds);
  }

  private hasVisitedNode(node: FlowNode) {
    return this.visitedNodeIds.includes(node.id)
  }
}
