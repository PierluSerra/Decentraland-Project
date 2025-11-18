// We define the empty imports so the auto-complete feature works as expected.
/*import {} from '@dcl/sdk/math'
import { engine } from '@dcl/sdk/ecs'

import { changeColorSystem, circularSystem } from './systems'
import { setupUi } from './ui'

export function main() {
  // Defining behavior. See `src/systems.ts` file.
  engine.addSystem(circularSystem)
  engine.addSystem(changeColorSystem)

  // draw UI. Here is the logic to spawn cubes.
  setupUi()
}*/
// src/index.ts
// src/index.ts
// import {
//   engine,
//   Transform,
//   GltfContainer,
//   MeshCollider,
//   MeshRenderer,
//   Material,
//   pointerEventsSystem,
//   InputAction
// } from "@dcl/sdk/ecs"
// import { Color4, Vector3 } from "@dcl/sdk/math"

// // === Config API (in preview locale) ===
// const API = "http://localhost:8787/chat"

// // Chiamata al backend → Ollama
// async function askBot(message: string): Promise<string> {
//   const r = await fetch(API, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ message })
//   })
//   if (!r.ok) {
//     throw new Error(`HTTP ${r.status}`)
//   }
//   const data = (await r.json()) as { reply?: string }
//   return String(data.reply ?? "")
// }

// function createNpc(): number {
//   const npc = engine.addEntity()

//   // Posizione dell'NPC nella scena (modifica a piacere)
//   Transform.create(npc, {
//     position: Vector3.create(8, 0, 8)
//   })

//   // PROVA 1: se hai un modello GLB
//   // GltfContainer.create(npc, { src: "models/npc.glb" })

//   // PROVA 2 (fallback): cubo semplice se non hai un GLB
//   MeshRenderer.setBox(npc)
//   Material.setPbrMaterial(npc, {
//     albedoColor: Color4.create(0.2, 0.6, 1, 1)
//   })

//   // Aggiunge il collider per poter cliccare l'entità
//   MeshCollider.setBox(npc)

//   // Interazione: click sinistro (IA_POINTER) → chiama il bot
//   pointerEventsSystem.onPointerDown(
//     {
//       entity: npc,
//       opts: {
//         button: InputAction.IA_POINTER, // enum, NON stringa
//         hoverText: "Parla con il bot",
//         // maxDistance: 8, showFeedback: true // opzionali
//       }
//     },
//     async () => {
//       try {
//         // Esempio domanda: cambia il testo come ti serve
//         const reply = await askBot("Ciao! Qual è l'orario di Programming del lunedì?")
//         console.log("BOT:", reply)
//         // TODO: qui puoi mostrare la risposta in UI (toast, label, ecc.)
//       } catch (e) {
//         console.error("Errore chiamando il bot:", e)
//       }
//     }
//   )

//   return npc
// }

// // entrypoint
// export function main() {
//   createNpc()
// }
// main()


//SECONDO SCRIPT
import {
  engine,
  Transform,
  GltfContainer,
  MeshCollider,
  MeshRenderer,
  Material,
  pointerEventsSystem,
  InputAction,
  TextShape, 
  Billboard, // Necessario per far ruotare l'etichetta verso il giocatore
  executeTask      // <— IMPORTA QUESTO
} from "@dcl/sdk/ecs"
import { Color4, Vector3, Quaternion} from "@dcl/sdk/math"
import { mountChatUI } from "./ui"
import { AvatarShape } from "@dcl/sdk/ecs"


const API = (globalThis as any).ENV_API_URL ?? "http://localhost:8787/chat"
console.log("API URL:", API) // debug: vedi in console che URL sta usando

/*
async function askBot(message: string): Promise<string> {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const data = (await r.json()) as { reply?: string }
  return String(data.reply ?? "")
}*/

async function askBot(message: string): Promise<string> {
  
  try {
    const r = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    })

    // Log diagnostico: stato HTTP, header CORS, ecc.
    console.log("CHAT status:", r.status, r.statusText)
    console.log("CHAT ACAO:", r.headers.get("access-control-allow-origin"))

    if (!r.ok) {
      const txt = await r.text().catch(() => "")
      throw new Error(`HTTP ${r.status} – ${txt.slice(0, 300)}`)
    }

    const data = await r.json().catch(() => ({} as any))
    if (!data || typeof data.reply !== "string") {
      throw new Error("JSON inatteso dalla /chat (manca 'reply')")
    }
    return data.reply
  } catch (err: any) {
    // Propaga un messaggio leggibile
    const msg = err?.message || String(err)
    console.error("askBot() errore:", msg)
    throw new Error(msg)
  }
}
console.log("typeof askBot =", typeof askBot)     // deve stampare "function"
;(globalThis as any)._dbgAsk = askBot             // la espongo su globalThis per test



function createNpc(): number {
  const npc = engine.addEntity()
  Transform.create(npc, { position: Vector3.create(8, 0, 8) })
  MeshRenderer.setBox(npc)
  Material.setPbrMaterial(npc, { albedoColor: Color4.create(0.2, 0.6, 1, 1) })
  MeshCollider.setBox(npc)

  pointerEventsSystem.onPointerDown(
    {
      entity: npc,
      opts: {
        button: InputAction.IA_POINTER,
        hoverText: "Parla con il bot"
      }
    },
    // ⚠️ CALLBACK SINCRONO
    () => {
      // Esegui l'async dentro a un task separato
      executeTask(async () => {
        try {
          const reply = await askBot("Ciao! Qual è l'orario del corso di Programmazione del lunedì?")
          // Evita log enormi
          console.log("BOT:", reply.slice(0, 500) + (reply.length > 500 ? " …[troncato]" : ""))
          // TODO: mostra in UI (label/toast) invece di loggare tutto
        } catch (e) {
          console.error("Errore chiamando il bot:", e)
        }
      })
    }
  )

  return npc
}


// Se non funziona ELIMINARE, creazione muro e personaggio non giocante

/** Crea un muro bianco (un box molto sottile) */
function createWhiteWall(opts?: {
  position?: Vector3
  scale?: Vector3
  rotationDegY?: number
}) {
  const e = engine.addEntity()

  const position = opts?.position ?? Vector3.create(8, 1.5, 13)
  const scale = opts?.scale ?? Vector3.create(20, 15, 0.2) // largo x alto x spessore
  const rotation =
    opts?.rotationDegY !== undefined
      ? Quaternion.fromEulerDegrees(0, opts.rotationDegY, 0)
      : Quaternion.Identity()

  Transform.create(e, { position, scale, rotation })

  MeshRenderer.setBox(e)
  MeshCollider.setBox(e)

  Material.setPbrMaterial(e, {
    albedoColor: Color4.create(1, 1, 1, 1),   // bianco pieno
    roughness: 0.8,
    metallic: 0
  })

  return e
}

/** Crea un NPC: usa un GLB se disponibile, altrimenti un cilindro colorato */

function createNpc2(){
  const myAvatar = engine.addEntity()
  AvatarShape.create(myAvatar, {id:"Random-npc-id", wearables:[], emotes:[], name: "Assistente"})

  // === Calcolo della Rotazione ===
  // Crea un Quaternion che rappresenta una rotazione di 180 gradi attorno all'asse Y
  const rotation180 = Quaternion.fromEulerDegrees(0, 180, 0)

  Transform.create(myAvatar, {
	position: Vector3.create(6, 0.0, 13),
  rotation:rotation180,
})

// // 2. CREAZIONE DELL'ETICHETTA PERSONALIZZATA
// const label = engine.addEntity()
  
// // Posizioniamo l'etichetta come CHILD dell'avatar, 2.2m sopra la base (sopra la testa)
// Transform.create(label, {
//   parent: myAvatar, 
//   position: Vector3.create(0, 2.2, 0), 
// })

// // 3. TEXTSHAPE: Controllo completo sulla leggibilità
// TextShape.create(label, {
//   text: "Assistente",
  
//   // Aumenta la dimensione per renderlo leggibile da lontano
//   fontSize: 2, 
//   textColor: Color4.White(), 
  
//   // Aggiungi un contorno per migliorare il contrasto e la nitidezza (riduce l'effetto sgranato)
//   outlineWidth: 0.1, 
//   outlineColor: Color4.Black(),
   
// })

// // 4. BILLBOARD: L'etichetta ruota sempre verso il giocatore
// Billboard.create(label)
}
// function createNpc2(opts?: { position?: Vector3; glbSrc?: string }) {
//   const e = engine.addEntity()

//   Transform.create(e, {
//     position: opts?.position ?? Vector3.create(8, 0, 8),
//     scale: Vector3.create(1, 1, 1)
//   })

//   if (opts?.glbSrc) {
//     // Modello 3D (metti il tuo file in "models/npc.glb" o simile)
//     GltfContainer.create(e, { src: opts.glbSrc })
//   } else {
//     // Fallback geometrico: un cilindro blu
//     MeshRenderer.setCylinder(e)
//     MeshCollider.setCylinder(e)
//     Material.setPbrMaterial(e, {
//       albedoColor: Color4.create(0.25, 0.55, 0.95, 1),
//       roughness: 0.6,
//       metallic: 0
//     })
//   }

//   // Interazione: click → chiedi qualcosa al bot
//   pointerEventsSystem.onPointerDown(
//     {
//       entity: e,
//       opts: {
//         button: InputAction.IA_POINTER,
//         hoverText: "Parla con l'assistente"
//       }
//     },
//     () => {
//       // La callback deve essere sincrona: esegui l’async in un task
//       executeTask(async () => {
//         try {
//           const reply = await askBot(
//             "Ciao! Qual è il docente di Programmazione?"
//           )
//           console.log("BOT:", reply)
//           // Qui puoi anche inviare la risposta alla tua UI React-ECS
//         } catch (err) {
//           console.error("NPC/askBot error:", err)
//         }
//       })
//     }
//   )

//   return e
// }




export function main() {
  //createNpc()
  mountChatUI() // <<=== monta la UI

  // Eliminare se non funziona
  // Muro bianco dietro l’NPC (ruotalo se serve)
  createWhiteWall({ position: Vector3.create(8, 1.5, 14), rotationDegY: 0 })

  // Muro 2 (Sud)
  createWhiteWall({
  position: Vector3.create(8, 1.5, 0.1),
  scale: Vector3.create(16, 3, 0.2),
  rotationDegY: 0
  })

  // Muro 3 (Ovest)
  createWhiteWall({
    position: Vector3.create(0.1, 1.5, 8),
    scale: Vector3.create(16, 3, 0.2), 
    rotationDegY: 90 // RUOTATO di 90 gradi
  })

  // Muro 4 (Est)
  createWhiteWall({
    position: Vector3.create(15.9, 1.5, 8),
    scale: Vector3.create(16, 3, 0.2), 
    rotationDegY: 90 // RUOTATO di 90 gradi
  })

  // Pavimento
  createWhiteWall({
    position: Vector3.create(8, 0, 8), // Posizione in basso
    scale: Vector3.create(16, 0.2, 16), // Larghezza, Spessore, Profondità
  })

  // NPC: passa un glb se lo hai (es.: "models/npc.glb"), altrimenti lascia vuoto
  createNpc2()

}
main()

