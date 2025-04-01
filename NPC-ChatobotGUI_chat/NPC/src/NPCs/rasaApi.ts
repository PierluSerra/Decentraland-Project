// src/rasaApi.ts

export async function askRasa(message: string): Promise<string> {
    try {
      const response = await fetch('http://localhost:5005/webhooks/rest/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: "user", message: message })
      });
      const data = await response.json();
      if (data && data.length > 0 && data[0].text) {
        return data[0].text;
      } else {
        return "Non ho capito, puoi ripetere?";
      }
    } catch (error) {
      console.error("Errore chiamando Rasa:", error);
      return "Errore nel contattare il server.";
    }
  }
  