# NPC Chatbot with Rasa Integration

## 🧠 Rasa Server Setup

Open your terminal, navigate into your chatbot folder, and run the following commands:

```bash
rasa train
```

```bash
rasa run --enable-api --cors "*" --debug
```

---

## 🧱 Decentraland Scene Setup

Once the Rasa server is running, open Visual Studio Code and navigate to the `NPC` subfolder located inside the `NPC_Chatbot&NPC` directory.  
Make sure you have the **Decentraland SDK7 extension** installed and that all dependencies are fully loaded.

Before running the project, you need to make sure the Decentraland CLI is installed globally. Run the following command:

```bash
npm i -g decentraland
```

If this command does not work (for example, on a Mac M1), use the following command instead:

```bash
sudo npm i -g decentraland
```

> This will prompt for your system password to allow installation with admin permissions.

Then, start the local server with:

```bash
npm run start
```

> ⚠️ **This step is required**. Without starting the local server, you won’t be able to access the metaverse.
> ⚠️ **Server startup may take some time**

---

## 🔧 What I Built

- We created a chatbot-powered NPC in a Decentraland SDK7 scene.
- The NPC uses a custom chat GUI adapted from the [`inworld-ai-sdk7`](https://github.com/decentraland-scenes/inworld-ai-sdk7) project.
- Instead of using a cloud-based LLM like Inworld, my NPC connects directly to a **local Rasa server** for conversation handling.
- A new file `src/rasaApi.ts` was added to define the `askRasa()` function. This function sends the player’s message to the Rasa HTTP API and receives a response.
- The original `sendQuestion` function inside `customUIFunctionality.ts` was updated to use `askRasa()` instead of the default AI logic.
- The chat GUI displays both the player's message and the NPC's response in real-time.

---

## 💬 Where to See Chatbot Responses

> ⚠️ **NOTE:** At the moment, the chatbot's responses are only visible in the **Chrome developer console**.

To view them:

1. Enter the scene via your browser.
2. Click the three dots in the top right corner of Chrome.
3. Go to `More Tools` → `Developer Tools`.
4. In the **Console tab** (which appears on the right side of the screen), you will see the responses printed as logs.

We plan to display the messages in the GUI in a future update.

---

## ▶️ Usage Flow

1. Start your Rasa server as explained above.
2. Open the Decentraland scene in the `NPC` subfolder using VSCode and the SDK7 extension.
3. Make sure the CLI is installed (`npm i -g decentraland` or with `sudo`).
4. Run the scene locally with:

```bash
npm run start
```

5. Enter the scene and interact with the NPC using the chat interface. Messages will be sent to Rasa, and responses will appear in the **Chrome developer console**.

---

## ❗ Troubleshooting

- If the Rasa server does not respond, make sure it is running and reachable at:
  ```
  http://localhost:5005/webhooks/rest/webhook
  ```

- If `npm i -g decentraland` fails on Mac, use `sudo` as shown above.

- If chat messages are not shown, ensure the chat UI is correctly bound to the Rasa response (`askRasa`) and rendered using `updateChatUI` or equivalent.

