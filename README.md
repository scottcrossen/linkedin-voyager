<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200"
      src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
  <h1>LinkedIn Voyager SDK</h1>
  <p>Access the internal LinkedIn API</p>
</div>

<h2 align="center">Disclaimer</h2>

LinkedIn may ban your account if you use this library. Although I can't un-ban your account,
please open an issue against this repository if this happens to you. So far, I've only seen
this happen while I was trying to get the login-flow correct.

Also note that LinkedIn seems to be requiring all IP addresses originating from cloud servers
to have to go through additional "challenge" tasks in order to login.

<h2 align="center">Usage</h2>

import

```bash
yarn add linkedin-voyager
```

use

```ts
import { API, MessageDetails } from 'linkedin-voyager';

const api = new API('email@domain.com');

// You don't actually need to provide a password if you've enabled cookie persistence in
// the 'config' object passed to 'API' assuming it has a valid, non-expired sesssion.
api.setPassword('password1');

// Configure the SDK to echo all messages sent to the account back to the sender.
// This method returns a closure that you can call to remove the listener.
const close = await api.messaging.messages((message: MessageDetails) =>
  api.messaging.sendToConversation(
    `Stupid says "${message.body}"`,
    message.conversationId,
  ),
);

// Wait one hour and then close the stream.
setTimeout(close, 60 * 60 * 1000);
```

<h2 align="center">Features</h2>

Adding additional API methods is easy but here's what I have so far:

- Send/receive messages
- Send/receive message receipts and message typing indicators
- Query for current conversations
- Query for current user identifiers

Other cool things which may persuade you to use this SDK instead of its competitors:

- Fully working login flow
- Session resumption
- Cookie persistence
- Compatible with node and browsers
- Realtime connections
- Connection reuse
- Typescript safe
- Ephemeral password usage

<h2 align="center">Notes</h2>

The SDK does not persist passwords. Provided passwords are maintained in memory.

If you work for LinkedIn, please consider opening your official OAuth-based API for non-partnered
developers. This would be ideal for all parties: Clients don't have to provide passwords, LinkedIn
can govern fine-grain ACLs and rate limits, and developers would get a better experience. It would
also be great if LinkedIn provided a realtime/eventstream endpoint to the official API surface so
that developers don't have to resort to shortpolling.

<h2 align="center">Contributors</h2>

### Scott Leland Crossen

<http://scottcrossen.com>  
<scottcrossen42@gmail.com>

<h2 align="center">Special Thanks</h2>

Inspired by [https://github.com/tomquirk/linkedin-api/](https://github.com/tomquirk/linkedin-api/)
