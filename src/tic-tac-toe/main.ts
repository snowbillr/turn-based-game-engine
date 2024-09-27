import { number } from '@inquirer/prompts';

import { Engine, State } from '../lib/engine.js';

import { Board } from './board.js';
import { FlowContext } from '../lib/flow.js';
import { FlowAction, FlowCleanup } from '../lib/flow_node.js';

const engine = new Engine({
  players: [
    { id: 'playerX', name: 'X' },
    { id: 'playerO', name: 'O' },
  ],
});

const board = new Board();

const RoundStart: FlowAction = (state, f) => {
  console.log('Round started');
  f.next()
}
const RoundEnd: FlowCleanup = () => console.log('Round ended')

const TurnEnd: FlowCleanup = () => {
  console.log('Turn ended.');
}

// TODO make FlowAction type work with async functions
// may be better to make convenience methods in `FlowBuilder` first
const TurnStart = async (_state: State, f: FlowContext) => {
  console.log(`Turn started for ${f.getCurrentPlayer()!.name}`);

  board.print();

  let xCoord = -1;
  let yCoord = -1;
  while (!board.isValidMove(xCoord, yCoord)) {
    xCoord = (await number({ message: 'x coord:' })) ?? -1;
    yCoord = (await number({ message: 'y coord:' })) ?? -1;
  }

  board.move(f.getCurrentPlayer()!.name, xCoord, yCoord);

  if (board.hasWinner()) {
    f.gameOver();
  } else {
    f.next()
  }
}

engine.defineFlow((f) => 
  f.node(
    {
      id: 'round1',
      actions: [RoundStart],
      cleanup: [RoundEnd],
    },
    f.eachPlayerNode(player => ({
      id: `turn1::${player.id}`,
      playerId: player.id,
      actions: [TurnStart],
      cleanup: [TurnEnd],
    }))
    ,
  )
);

engine.start();
