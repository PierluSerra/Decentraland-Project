import { REGISTRY } from "../registry"
import { closeAllInteractions, createMessageObject, sendMsgToAI } from "../utils/connectedUtils"
import { closeCustomUI, resetInputField } from "./customUi"
import * as serverStateSpec from '../connection/state/server-state-spec'
import { GAME_STATE } from "../state"
import { initArena } from "../lobby-scene/lobbyScene"
import { askRasa } from './rasaApi' // Assicurati di importare la funzione che hai creato

export class NpcQuestionData {
  displayText: string
  aiQuery: string
}

export const genericPrefinedQuestions: NpcQuestionData[] = [
  { displayText: "Sing me a song!", aiQuery: "Sing me a song!" },
  { displayText: "Recite me a poem!", aiQuery: "Recite me a poem!" },
  { displayText: "Tell me a joke!", aiQuery: "Tell me a joke!" },
  { displayText: "Your Favorite music?", aiQuery: "What is your favorite music?" },
  { displayText: "Do you have any pets?", aiQuery: "Do you have any pets?" },
  { displayText: "What can I do here?", aiQuery: "What can I do here?" },
  { displayText: "What is a wearable!", aiQuery: "What is a wearable!" },
  { displayText: "What is an emote!", aiQuery: "What is an emote!" }
]

// Modifica la funzione sendQuestion per utilizzare askRasa
export async function sendQuestion(questionData: NpcQuestionData | string) {
  // Estrae la query: se è un oggetto prende la proprietà aiQuery, altrimenti usa la stringa direttamente
  const messageQuery = typeof questionData === 'string' ? questionData : questionData.aiQuery;
  console.log("Invio a Rasa:", messageQuery);

  // Chiude le interazioni attive, mantenendo quella dell'NPC attivo
  closeAllInteractions({ exclude: REGISTRY.activeNPC });

  // Invia il messaggio al server Rasa e attende la risposta
  const response = await askRasa(messageQuery);
  console.log("Risposta da Rasa:", response);

  // Aggiorna l'interfaccia della chat con la risposta ricevuta
  // Implementa updateChatUI in base a come gestisci la visualizzazione dei messaggi nella GUI
  updateChatUI("NPC: " + response);

  // Chiude la UI della chat e resetta il campo di input
  closeCustomUI(false);
  resetInputField();
}

// Esempio di funzione per aggiornare l'interfaccia della chat
// Se la chat utilizza uno state o un meccanismo simile, implementa l'aggiornamento qui
function updateChatUI(responseText: string): void {
  console.log("Aggiornamento della chat con:", responseText);
  // Qui inserisci la logica per aggiornare la UI, ad esempio aggiungendo il messaggio ad uno state React
  // oppure aggiornando un componente Label o simili.
}

// export function sendQuestion(questionData: NpcQuestionData | string) {
//   const messageQuery = (typeof (questionData) === 'string') ? questionData : questionData.aiQuery
//   const message = (typeof (questionData) === 'string') ? questionData : questionData.aiQuery
//   console.log("QUESTIONS", "sending ", message)

//   closeAllInteractions({ exclude: REGISTRY.activeNPC })

//   const doSend = () => {
//     const chatMessage: serverStateSpec.ChatMessage = createMessageObject(messageQuery, undefined, GAME_STATE.gameRoom)
//     sendMsgToAI(chatMessage)
//   }
//   if (GAME_STATE.gameRoom && GAME_STATE.gameConnected === 'connected') {
//     doSend()
//   } else {
//     REGISTRY.lobbyScene.pendingConvoActionWithNPC = doSend
//     initArena(REGISTRY.lobbyScene, false)
//     return
//   }

//   closeCustomUI(false)

//   resetInputField()//TODO: missing implementation
// }