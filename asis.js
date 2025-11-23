// URL EXACTA de tu Cloud Function
const API_URL = "https://us-central1-medicalhomeapp-1a68b.cloudfunctions.net/geminiChat";

const chatBox = document.getElementById('chat-box');
const input = document.getElementById('msg-input');
const btn = document.getElementById('send-btn');
const statusDiv = document.getElementById('status');

// Historial mínimo para la prueba
let history = [];

function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    // 1. UI Usuario
    appendMessage('user', text);
    input.value = '';
    input.disabled = true;
    btn.disabled = true;
    statusDiv.textContent = "Estado: Enviando a Firebase...";
    statusDiv.className = "";

    // 2. Preparar Datos (Formato Gemini)
    // Agregamos el mensaje actual al historial temporal
    const currentMsg = { role: "user", parts: [{ text: text }] };
    history.push(currentMsg);

    try {
        console.log("Enviando petición a:", API_URL);
        console.log("Payload:", JSON.stringify({ history: history }));

        // 3. Fetch Directo
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                history: history, // Enviamos historial acumulado
                systemInstruction: "Eres un asistente de prueba. Responde brevemente."
            })
        });

        console.log("Status respuesta:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("Datos recibidos:", data);

        const aiResponse = data.response;

        // 4. UI IA
        appendMessage('model', aiResponse);
        history.push({ role: "model", parts: [{ text: aiResponse }] });
        statusDiv.textContent = "Estado: Respuesta recibida correctamente.";

    } catch (error) {
        console.error("ERROR CRÍTICO:", error);
        appendMessage('model', `Error: ${error.message}`);
        statusDiv.textContent = "Estado: Falló la conexión.";
        statusDiv.className = "error";
        // Sacar el mensaje fallido del historial para no romper el siguiente intento
        history.pop(); 
    } finally {
        input.disabled = false;
        btn.disabled = false;
        input.focus();
    }
}

btn.addEventListener('click', sendMessage);
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});