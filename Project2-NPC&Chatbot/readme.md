# Decentraland Chatbot with Predefined Questions

This repository contains a Decentraland scene built with SDK7 that demonstrates a simple chatbot interface using predefined questions. Instead of an input field, users choose from a list of static questions, which are sent to a Rasa server for a response. The response is then displayed above an NPC avatar.

## Features

- **NPC Avatar**: An NPC avatar is created using `AvatarShape`.
- **Response Display**: A text entity above the NPC displays responses received from the Rasa server.
- **Predefined Questions**: Multiple clickable text entities are shown as possible questions (e.g., "Ciao!", "Come stai?", "Qual è il tuo nome?", "Che ore sono?").
- **Clickable UI**: The text entities are rendered without any background panel, so the text appears floating in 3D space.
- **Rasa Integration**: On clicking a question, the scene sends a REST API call to a Rasa server (assumed to be running at `http://localhost:5005/webhooks/rest/webhook`) and displays the chatbot’s response.

## Prerequisites

- [Decentraland SDK7](https://docs.decentraland.org/development-guide/sdk7-overview/)
- A Rasa server running and listening on `http://localhost:5005/webhooks/rest/webhook`

## How It Works

1. **Avatar and Text Setup**:  
   - An NPC avatar is created at position (4, 0, 5).
   - A text entity is positioned above the NPC to display chatbot responses.
   
2. **Instruction Text**:  
   - A text entity is created to instruct the user to "Choose a question:" (without any background panel).

3. **Predefined Questions**:  
   - A list of static questions is defined.
   - For each question, a clickable text entity is created at a designated position in the scene.
   - When a user clicks on a question, the scene sends that message to the Rasa server.

4. **Sending and Receiving Messages**:  
   - The `askRasa` function makes a POST request with the selected question to the Rasa server.
   - The returned response is then displayed above the NPC.

5. **Chat Activation Trigger**:  
   - An invisible trigger placed on the NPC logs a message ("Chat enabled. Click a question!") when clicked.


## Install dependencies:
Make sure you have the Decentraland SDK7 installed and properly configured. Follow the decentraland documentation for setup.

## Run a Rasa Server
You must run the server with "rasa run --enable-api --cors "*" –debug" command.

