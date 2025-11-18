import {
  engine,
  Transform,
} from '@dcl/sdk/ecs'
import { Color4 } from '@dcl/sdk/math'
import ReactEcs, { Button, Label, ReactEcsRenderer, UiEntity, Input } from '@dcl/sdk/react-ecs'
import { Cube } from './components'
import { createCube } from './factory'
import { executeTask } from "@dcl/sdk/ecs"

/*export function setupUi() {
  ReactEcsRenderer.setUiRenderer(uiComponent)
}*/

/*const uiComponent = () => (
  <UiEntity
    uiTransform={{
      width: 400,
      height: 230,
      margin: '16px 0 8px 270px',
      padding: 4,
    }}
    uiBackground={{ color: Color4.create(0.5, 0.8, 0.1, 0.6) }}
  >
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
      uiBackground={{ color: Color4.fromHexString("#70ac76ff") }}
    >
      <UiEntity
        uiTransform={{
          width: '100%',
          height: 50,
          margin: '8px 0'
        }}
        uiBackground={{
          textureMode: 'center',
          texture: {
            src: 'images/scene-thumbnail.png',
          },
        }}
        uiText={{ value: 'SDK7', fontSize: 18 }}
      />
      <Label
        onMouseDown={() => {console.log('Player Position clicked !')}}
        value={`Player: ${getPlayerPosition()}`}
        fontSize={18}
        uiTransform={{ width: '100%', height: 30 } }
      />
      <Label
        onMouseDown={() => {console.log('# Cubes clicked !')}}
        value={`# Cubes: ${[...engine.getEntitiesWith(Cube)].length}`}
        fontSize={18}
        uiTransform={{ width: '100%', height: 30 } }
      />
      <Button
        uiTransform={{ width: 100, height: 40, margin: 8 }}
        value='Spawn cube'
        variant='primary'
        fontSize={14}
        onMouseDown={() => {
          createCube(1 + Math.random() * 8, Math.random() * 8, 1 + Math.random() * 8, false)
        }}
      />
     </UiEntity>
  </UiEntity>
)

function getPlayerPosition() {
  const playerPosition = Transform.getOrNull(engine.PlayerEntity)
  if (!playerPosition) return ' no data yet'
  const { x, y, z } = playerPosition.position
  return `{X: ${x.toFixed(2)}, Y: ${y.toFixed(2)}, z: ${z.toFixed(2)} }`
}
*/


// =====================
// Config
// =====================
const API = (globalThis as any).ENV_API_URL ?? "http://localhost:8787/chat"

// =====================
// Stato della chat
// =====================
type Msg = { from: "user" | "bot"; text: string }
let history: Msg[] = [{ from: "bot", text: "Ciao! Scrivimi una domanda 😊" }]
let inputText = ""
let sending = false

// Limita le righe visualizzate per evitare messaggi troppo lunghi nel kernel
function lastRows<T>(arr: T[], n = 50) { return arr.slice(Math.max(0, arr.length - n)) }

// =====================
// Chiamata al backend
// =====================
async function askBot(message: string): Promise<string> {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  })
  if (!r.ok) {
    const t = await r.text().catch(() => "")
    throw new Error(`HTTP ${r.status} – ${t.slice(0, 200)}`)
  }
  const j = await r.json().catch(() => ({} as any))
  const reply: string = String(j?.reply ?? "")
  return reply
}

// =====================
// Invio messaggio
// =====================
function sendMessage() {
  const msg = (inputText || "").trim()
  if (!msg || sending) return

  history.push({ from: "user", text: msg })
  inputText = ""
  sending = true

  executeTask(async () => {
    try {
      const reply = await askBot(msg)
      // Troncatura difensiva per non saturare la pipe kernel↔scene
      const safe = reply.length > 1500 ? reply.slice(0, 1500) + " …" : reply
      history.push({ from: "bot", text: safe })
    } catch (e: any) {
      history.push({ from: "bot", text: "⚠️ Errore: " + (e?.message || String(e)) })
    } finally {
      sending = false
    }
  })
}

// =====================
// UI componibile
// =====================
function ChatPanel() {
  const rows = lastRows(history, 50)

  return (
    <UiEntity
      uiTransform={{
        width: "50%",
        height: "45%",
        positionType: "absolute",
        position: { top: "5%", right: "5%" },
        display: "flex",
        flexDirection: "column"
      }}
      uiBackground={{ color: Color4.create(0, 0, 0, 0.65) }}
    >
      {/* Header */}
      <UiEntity
        uiTransform={{
          width: "100%",
          height: "10%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        uiBackground={{ color: Color4.create(0.15, 0.15, 0.2, 0.9) }}
      >
        <Label value="💬 Chat con il bot" fontSize={18} color={Color4.White()} textAlign="middle-center" />
      </UiEntity>

      {/* Area messaggi */}
      <UiEntity
        uiTransform={{
          width: "100%",
          height: "70%",
          padding: { left: "2%", right: "2%", top: "2%", bottom: "2%" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          overflow: "scroll"
        }}
      >
        {rows.map((m, i) => (
          <UiEntity
            key={`row-${i}`}
            uiTransform={{
              width: "96%",
              margin: { top: "4px", bottom: "4px" },
              alignSelf: m.from === "user" ? "flex-end" : "flex-start",
              padding: { top: 6, bottom: 6, left: 8, right: 8 }   // ✅ qui il padding
            }}
            uiBackground={{
              color:
                m.from === "user"
                  ? Color4.create(0.20, 0.55, 1.0, 0.85)
                  : Color4.create(0.12, 0.12, 0.12, 0.85)
            }}
          >
            <Label
              value={(m.from === "user" ? "Tu: " : "Bot: ") + m.text}
              fontSize={14}
              color={Color4.White()}
              textAlign="top-left"
            />
          </UiEntity>
        ))}
      </UiEntity>

      {/* Input + bottone */}
      <UiEntity
        uiTransform={{
          width: "100%",
          height: "20%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: { left: "2%", right: "2%" }
        }}
      >
        <Input
          value={inputText}
          onChange={(v) => (inputText = v ?? "")}
          onSubmit={() => sendMessage()}
          placeholder="Scrivi un messaggio…"
          fontSize={14}
          color={Color4.White()}
          uiTransform={{ width: "78%", height: "80%" }}
          uiBackground={{ color: Color4.create(0.08, 0.08, 0.10, 0.9) }}
        />
        <Button
          value={sending ? "Invio…" : "Invia"}
          variant="primary"
          fontSize={16}
          disabled={sending}
          uiTransform={{ width: "18%", height: "80%" }}
          onMouseDown={() => !sending && sendMessage()}
        />
      </UiEntity>
    </UiEntity>
  )
}

// Monta il renderer React-ECS con la chat
export function mountChatUI() {
  ReactEcsRenderer.setUiRenderer(() => <ChatPanel />)
}

