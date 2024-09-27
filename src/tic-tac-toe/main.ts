import { number } from '@inquirer/prompts';

import { Engine, State } from '../lib/engine.js';

import { Board } from './board.js';
import { FlowContext } from '../lib/flow.js';

const engine = new Engine({
  players: [
    { id: 'playerX', name: 'X' },
    { id: 'playerO', name: 'O' },
  ],
});

const board = new Board();

const RoundStart = () => console.log('Round started');
const RoundEnd = () => console.log('Round ended');

function TurnEnd() {
  console.log('Turn ended.');
}

async function TurnStart(_state: State, f: FlowContext) {
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
    await f.next();
  }
}

engine.defineFlow((f) => {
  f.node(
    {
      id: 'round1',
      autoAdvance: true, // TODO - autoAdvance automatically when there are no `actions`
      actions: [RoundStart],
      cleanup: [RoundEnd],
    },
    [
      f.node({
        id: 'turn1::X',
        playerId: 'playerX',
        actions: [TurnStart],
        cleanup: [TurnEnd],
      }),
      f.node({
        id: 'turn1::O',
        playerId: 'playerO',
        actions: [TurnStart],
        cleanup: [TurnEnd],
      }),
    ],
  );

  return f;
});

await engine.start();
