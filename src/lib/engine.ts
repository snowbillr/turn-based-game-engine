import { Flow, FlowContext } from './flow.js';
import { FlowBuilder } from './flow_builder.js';

interface EngineConfig<State> {
  players: Player[];
  initialState: State;
}

// TODO: Player's can have a set of attributes
interface Player {
  id: string;
  name: string;
}

export class Engine<State> {
  private players: Player[];
  private flow: Flow<State> | undefined;
  private flowContext: FlowContext<State>;

  private state: State;

  constructor(config: EngineConfig<State>) {
    this.players = config.players;
    this.state = config.initialState;
    this.flowContext = {
      state: this.state,
      getCurrentPlayer: this.getCurrentPlayer.bind(this),
      next: this.next.bind(this),
      gameOver: this.gameOver.bind(this),
    };
  }

  defineFlow(flowFn: (f: FlowBuilder<State>) => FlowBuilder<State>) {
    const flowBuilder = new FlowBuilder();
    this.flow = flowFn(flowBuilder).build();
  }

  async start() {
    if (this.flow == null)
      throw new Error('#defineFlow must be called before using the engine.');

    await this.flow.start(this.flowContext);
  }

  async next() {
    if (this.flow == null)
      throw new Error('#defineFlow must be called before using the engine.');

    await this.flow.next(this.flowContext);
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
