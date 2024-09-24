
I'm worried about needing to declare the onStart and onEnd with the flow definitions. That seems to make things harder.

But, where else would they be declared?

- could do events, and trigger an event onStart and onEnd for each node. allow subscribing by node id
  - may need to introduce node types and be able to subscribe to all nodes of a certain type
  - this would avoid needing to pass the `<State>` generic around in the flow definition
  - this lets subscriptions be dynamic at runtime
  - https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html would be used to create all event strings (nodeId::start, nodeID::end, nodeType::start, nodeType::end)
    - most likely mixed with https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html to grab all the ids and categories from the flow
    - this is probably doable, but complicated AF
    - could look into using https://github.com/sindresorhus/type-fest?tab=readme-ov-file as well
  ```ts
  node({ id: 'round1' }, [
    node({ id: 'turn1', type: 'player_turn' })
  ])
  engine.on('player_turn:start', onTurnStart);
  engine.on('round1:start', onTurnStart);
  engine.on('turn1:end', onTurnEnd);
  ```
- could allow editing node onStart and onEnd callbacks directly from the engine
  ```ts
  engine.node({ id: 'turn1' }).on.start(() => {})
  engine.node({ type: 'player_turn' }).on.start(() => {})
  // or
  engine.onStart({ id: 'turn1' }, () => {})
  engine.onStart({ type: 'player_turn' }, () => {})
  ```
  - would need to build node lookup
- for either of these approaches, declaring the game would be in two steps:
  - setting up the flow
  - wiring up the flow to handlers
  - there'd be a disconnect there where you wouldn't be declaring handlers with the flow
    - could lead to bugs when you wire up the handlers to the wrong flow by accident

- could declare Actions on each node
  ```ts
  f.node({
    id: 'turn',
    playerId: 'playerX',
    actions: [PlacePiece, CheckWin]
  })
  // or
  f.node({
    id: 'turn',
    playerId: 'playerX',
    actions: [f.action(PlacePiece), f.action(CheckWin)]
  })
  // or
  f.node({
    id: 'turn',
    playerId: 'playerX',
    actions: f.actions(PlacePiece, CheckWin)
  })
  ```
  - this declares the game in a single step in a very readable way
  - nodes are explicitly composed rather than through hidden event subscriberes
    - could still add functionality to add/remove actions at run-time if needed through a node query
  - `actions` are run when entering the node
    - could also introduce a `cleanup` set of actions to run when exiting a node
    - solves the problem of confusing "onStart" and "onEnd" language
    - actions are reusable
    - how to handle when `next()` is called?
      - if `next()` is called in any action the rest of them are skipped
      - or `next()` advances to the next action
        - i like this one