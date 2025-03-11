import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { 
  InputAction,
  Transform,
  engine,
  pointerEventsSystem,
  MeshCollider,
  MeshRenderer,
  TextShape
} from '@dcl/sdk/ecs'
import { AvatarShape } from "@dcl/sdk/ecs"

import { changeColorSystem, circularSystem } from './systems'

export function main() {
  // Sistemi di esempio
  engine.addSystem(circularSystem)
  engine.addSystem(changeColorSystem)

  // 1) Creo un avatar NPC
  const myAvatar = engine.addEntity()
  AvatarShape.create(myAvatar)
  Transform.create(myAvatar, { 
    position: Vector3.create(4, 0, 5)
  })

  // 2) Testo sopra l'NPC (per mostrare le risposte di Rasa)
  const textEntity = engine.addEntity()
  TextShape.create(textEntity, { text: " ", fontSize: 2 })
  Transform.create(textEntity, {
    position: Vector3.create(4, 2.5, 5),
    rotation: Quaternion.fromEulerDegrees(0, 180, 0)
  })

  function updateText(message: string) {
    TextShape.getMutable(textEntity).text = message
  }

  // 3) Creo un testo di istruzioni (in 3D nella scena)
  const instructionText = engine.addEntity()
  TextShape.create(instructionText, { text: "Scegli una domanda:", fontSize: 2 })
  Transform.create(instructionText, {
    position: Vector3.create(8, 2, 2),
    rotation: Quaternion.fromEulerDegrees(0, 180, 0),
    scale: Vector3.create(2, 2, 2)
  })
  //MeshRenderer.setPlane(instructionText)
  MeshCollider.setPlane(instructionText)

  // -- Qui inserisco delle opzioni predefinite, invece del campo di input. --

  // 4) Creo entità con le domande predefinite
  const questions = ["Ciao!", "Come stai?", "Qual è il tuo nome?", "Che ore sono?"]

  // Posizionamento di base
  let startY = 1.7

  for (let i = 0; i < questions.length; i++) {
    const questionEntity = engine.addEntity()
    TextShape.create(questionEntity, { text: questions[i], fontSize: 2 })
    Transform.create(questionEntity, {
      position: Vector3.create(8, startY, 2),
      rotation: Quaternion.fromEulerDegrees(0, 180, 0),
      scale: Vector3.create(2, 2, 2)
    })
    //MeshRenderer.setPlane(questionEntity)
    MeshCollider.setPlane(questionEntity)

    // Quando clicchiamo su questa domanda, inviamo la stringa a Rasa
    pointerEventsSystem.onPointerDown(
      { entity: questionEntity, opts: { button: InputAction.IA_PRIMARY, hoverText: questions[i] } },
      () => {
        sendMessage(questions[i])
        return false
      }
    )

    // Abbassiamo la posizione Y per la prossima domanda
    startY -= 0.4
  }

  // 5) Trigger invisibile sull'NPC per attivare la chat (opzionale)
  const triggerEntity = engine.addEntity()
  Transform.create(triggerEntity, {
    position: Vector3.create(4, 0, 5),
    scale: Vector3.create(3, 2, 3)
  })
  MeshCollider.setBox(triggerEntity)

  let isChatOpen = false

  pointerEventsSystem.onPointerDown(
    { entity: triggerEntity, opts: { button: InputAction.IA_PRIMARY, hoverText: "Parla con me" } },
    () => {
      if (!isChatOpen) {
        isChatOpen = true
        // (In questo caso, non dobbiamo abilitare nulla perché non c'è input.)
        console.log("Chat abilitata. Clicca una domanda!")
      }
      return false
    }
  )

  // Funzione che invia un messaggio al server RASA
  async function sendMessage(message: string) {
    console.log("Domanda selezionata:", message)
    const response = await askRasa("ciao")
    updateText(response)
  }
}

// Function for call the RASA API
async function askRasa(question: string): Promise<string>{
  try {
    const response = await fetch('http://localhost:5005/webhooks/rest/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: "user", message: question })
    })

    const data = await response.json()
    if (data.length > 0) {
        return data[0].text // Ritorna la risposta di Rasa
    } else {
        return "Non ho capito, puoi ripetere?"
    }
  } catch (error) {
    console.error("Errore chiamando Rasa:", error)
    return "Errore nel contattare il server."
  }
  
}

// // Esempio di chiamata a RASA
// async function askRasa(question: string): Promise<string> {
//   try {
//     const controller = new AbortController()
//     const timeout = setTimeout(() => controller.abort(), 5000) // Timeout di 5 secondi

//     const response = await fetch('http://localhost:5005/webhooks/rest/webhook', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ sender: "user", message: question }),
//       signal: controller.signal
//     })

//     clearTimeout(timeout)
//     const data = await response.json()
//     if (data.length > 0) {
//       return data[0].text
//     } else {
//       return "Non ho capito, puoi ripetere?"
//     }
//   } catch (error) {
//     console.error("Errore chiamando Rasa:", error)
//     return "Errore nel contattare il server."
//   }
// }
