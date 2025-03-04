// We define the empty imports so the auto-complete feature works as expected.
import { Vector3 } from '@dcl/sdk/math'
import { InputAction, PointerEventType, PointerEvents, Transform, engine, executeTask, pointerEventsSystem, MeshCollider, MeshRenderer} from '@dcl/sdk/ecs'
import { AvatarShape } from "@dcl/sdk/ecs"

import { changeColorSystem, circularSystem } from './systems'
import { setupUi } from './ui'

export function main() {
  // Defining behavior. See `src/systems.ts` file.
  engine.addSystem(circularSystem)
  engine.addSystem(changeColorSystem)

  //Add an entity
  const myAvatar = engine.addEntity()


  //Create an Avatar into entity
  AvatarShape.create(myAvatar)

  //Create a trasformation for the avatat position into the scene
  Transform.create(myAvatar, {
    position: Vector3.create(4, 0, 5) //Avatar position
  })

  MeshCollider.setBox(myAvatar)
  MeshRenderer.setBox(myAvatar)

  // Interaction with Player
  pointerEventsSystem.onPointerDown(
    {entity: myAvatar, opts: {button: InputAction.IA_PRIMARY, hoverText: "Parla con me"}},
    function(){
      executeTask(async()=>{
        const response = await askRasa("Ciao!") // Send a message to Rasa
        console.log("NPC Risponde:", response) // Show the responde of RasaBot
      })
    }
  )
  // draw UI. Here is the logic to spawn cubes.
  //setupUi()
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
