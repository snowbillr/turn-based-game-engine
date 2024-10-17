import { Flow, FlowAction, FlowActionId, FlowCleanup, FlowCleanupId } from './flow.js';
import { FlowBuilder } from './flow_builder.js';
import { Player } from './player.js';

// TODO - game state is generic
export type State = Record<string, unknown>;

export interface FlowContext<Attributes> {
  next: Engine<Attributes>['next'];
  gameOver: Engine<Attributes>['gameOver'];
  getCurrentPlayer: Engine<Attributes>['getCurrentPlayer'];
}

interface EngineConfig<Attributes> {
  players: Player<Attributes>[]
}

export class Engine<Attributes> {
  private players: Player<Attributes>[];
  private flow: Flow | undefined;
  private actions: { [key: FlowActionId]: FlowAction<Attributes> } = {};
  private cleanups: { [key: FlowCleanupId]: FlowCleanup<Attributes> } = {};

  private state: State;

  constructor(config: EngineConfig<Attributes>) {
    this.players = config.players;
    this.state = {};
  }

  defineFlow(flowFn: (f: FlowBuilder<Attributes>) => void) {
    const flowBuilder = new FlowBuilder<Attributes>();
    flowFn(flowBuilder);

    const flowBuilderOutput = flowBuilder.build(
      this.runAction.bind(this),
      this.runCleanup.bind(this),
    );

    this.flow = flowBuilderOutput.flow;
    this.actions = flowBuilderOutput.actions;
    this.cleanups = flowBuilderOutput.cleanups;
  }

  start() {
    if (this.flow == null)
      throw new Error('#defineFlow must be called before using the engine.');

    this.flow.start();
  }

  next() {
    if (this.flow == null)
      throw new Error('#defineFlow must be called before using the engine.');

    this.flow.next();
  }

  repeat() {
    if (this.flow == null)
      throw new Error('#defineFlow must be called before using the engine.');

    this.flow.repeat();
  }

  gameOver() {
    console.log('Game over');
  }

  getCurrentPlayer(): Player<Attributes> | undefined {
    if (this.flow == null)
      throw new Error('#defineFlow must be called before using the engine.');

    const currentPlayerId = this.flow.currentNode().playerId;
    return this.players.find((p) => p.id === currentPlayerId);
  }

  // TODO reduce context creation duplication

  private runAction(actionId: FlowActionId) {
    void this.actions[actionId](this.state, {
      next: this.next.bind(this),
      gameOver: this.gameOver.bind(this),
      getCurrentPlayer: this.getCurrentPlayer.bind(this)
    });
  }

  private runCleanup(cleanupId: FlowCleanupId) {
    this.cleanups[cleanupId](this.state, {
      next: this.next.bind(this),
      gameOver: this.gameOver.bind(this),
      getCurrentPlayer: this.getCurrentPlayer.bind(this)
    });
  }
}
