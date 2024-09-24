
I'm worried about needing to declare the onStart and onEnd with the flow definitions. That seems to make things harder.

But, where else would they be declared?
- could do events, and trigger an event onStart and onEnd for each node. allow subscribing by node id
  - may need to introduce node types and be able to subscribe to all nodes of a certain type
  - this would avoid needing to pass the `<State>` generic around in the flow definition
  - this lets subscriptions be dynamic at runtime