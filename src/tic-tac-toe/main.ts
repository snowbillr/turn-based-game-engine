import { number } from '@inquirer/prompts';

import { Board } from './board.js';
import { Player } from '../lib/player.js';
import { Engine, FlowContext, State } from '../lib/engine.js';
import { FlowAction, FlowCleanup } from '../lib/flow.js';

interface PlayerAttributes {
  name: string;
}
const players: Player<PlayerAttributes>[] = [
  new Player('playerX', { name: 'X' }),
  new Player('playerO', { name: 'O' }),
]

const engine = new Engine({ players });

const board = new Board();

const WelcomeMessage: FlowAction<PlayerAttributes> = (state, f) => {
  console.log('Welcome to Tic-Tac-Toe!')
  f.next()
}

const RoundStart: FlowAction<PlayerAttributes> = (state, f) => {
  console.log('Round started');
  f.next()
}
const RoundEnd: FlowCleanup = () => console.log('Round ended')

const TurnEnd: FlowCleanup = () => {
  console.log('Turn ended.');
}

// TODO make FlowAction type work with async functions
// may be better to make convenience methods in `FlowBuilder` first
// const TurnStart: FlowAction<PlayerAttributes> = async (state, f) => {
const TurnStart = async (state: State, f: FlowContext<PlayerAttributes>) => {
  console.log(`Turn started for ${f.getCurrentPlayer()!.attributes.name}`);

  board.print();

  let xCoord = -1;
  let yCoord = -1;
  while (!board.isValidMove(xCoord, yCoord)) {
    xCoord = (await number({ message: 'x coord:' })) ?? -1;
    yCoord = (await number({ message: 'y coord:' })) ?? -1;
  }

  board.move(f.getCurrentPlayer()!.attributes.name, xCoord, yCoord);

  if (board.hasWinner()) {
    f.gameOver();
  } else {
    f.next()
  }
}

engine.defineFlow((f) => {
  f.node({
    actions: f.actions(WelcomeMessage),
  })

  f.node(
    {
      actions: f.actions(RoundStart),
      cleanups: f.cleanups(RoundEnd),
    },
    players.map(player => f.node({
      playerId: player.id,
      actions: f.actions(TurnStart),
      cleanups: f.cleanups(TurnEnd),
    })),
  )
});

engine.start();

