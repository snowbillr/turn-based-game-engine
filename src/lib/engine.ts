import { Flow, FlowContext } from './flow.js';
import { FlowBuilder } from './flow_builder.js';

interface EngineConfig {
  players: Player[];
}

interface Player {
  id: string;
  name: string;
}

// TODO - game state is generic
export type State = Record<string, unknown>;

export class Engine {
  private players: Player[];
  private flow: Flow | undefined;
  private flowContext: FlowContext;

  private state: State;

  constructor(config: EngineConfig) {
    this.players = config.players;
    this.state = {};
    this.flowContext = {
      next: this.next.bind(this),
      gameOver: this.gameOver.bind(this),
      getCurrentPlayer: this.getCurrentPlayer.bind(this),
    };
  }

  defineFlow(flowFn: (f: FlowBuilder) => FlowBuilder) {
    const flowBuilder = new FlowBuilder();
    this.flow = flowFn(flowBuilder).build();
  }

  async start() {
    if (this.flow == null)
      throw new Error('#defineFlow must be called before using the engine.');

    await this.flow.start(this.state, this.flowContext);
  }

  async next() {
    if (this.flow == null)
      throw new Error('#defineFlow must be called before using the engine.');

    await this.flow.next(this.state, this.flowContext);
  }

  gameOver() {
    console.log('Game over');
  }

  getCurrentPlayer(): Player | undefined {
    if (this.flow == null)
      throw new Error('#defineFlow must be called before using the engine.');

    return this.players.find((p) => p.id === this.flow!.currentNode().playerId);
  }
}
