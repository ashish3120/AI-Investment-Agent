import { useState, useRef, useEffect, useCallback } from "react";
import { API_BASE, WS_BASE } from "../lib/config";

// AudioWorklet processor code as a blob URL for capturing microphone PCM
const WORKLET_CODE = `
class PcmProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input.length > 0) {
      const float32 = input[0];
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      this.port.postMessage(int16.buffer, [int16.buffer]);
    }
    return true;
  }
}
registerProcessor("pcm-processor", PcmProcessor);
`;

function createWorkletBlobUrl() {
  const blob = new Blob([WORKLET_CODE], { type: "application/javascript" });
  return URL.createObjectURL(blob);
}

// Decode base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ArrayBuffer to base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default function ChatAssistant({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const workletNodeRef = useRef(null);
  const streamRef = useRef(null);
  const playbackContextRef = useRef(null);
  const pendingAudioRef = useRef([]);
  const isPlayingRef = useRef(false);
  const currentTextRef = useRef("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isTyping, isOpen]);

  // Connect to the WebSocket on mount
  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (!sessionId) return;

    setIsConnecting(true);
    const ws = new WebSocket(`${WS_BASE}/ws/live?sessionId=${sessionId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[ChatAssistant] WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "connected") {
          setIsConnected(true);
          setIsConnecting(false);
          ws._geminiReady = true;
          console.log("[ChatAssistant] Gemini Live session ready");
          return;
        }

        if (msg.type === "text") {
          currentTextRef.current += msg.content;
          setMessages(prev => {
            const newMsgs = [...prev];
            if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role === "assistant") {
              newMsgs[newMsgs.length - 1] = {
                ...newMsgs[newMsgs.length - 1],
                content: currentTextRef.current
              };
            } else {
              newMsgs.push({ role: "assistant", content: currentTextRef.current });
            }
            return newMsgs;
          });
        }

        if (msg.type === "audio") {
          // Queue audio for playback
          pendingAudioRef.current.push(msg.data);
          playNextAudio();
        }

        if (msg.type === "turn_complete") {
          currentTextRef.current = "";
          setIsTyping(false);
        }

        if (msg.type === "error") {
          console.error("[ChatAssistant] Error:", msg.message);
          setMessages(prev => [...prev, { role: "assistant", content: `Error: ${msg.message}` }]);
          setIsTyping(false);
        }
      } catch (err) {
        console.error("[ChatAssistant] Failed to parse WS message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("[ChatAssistant] WebSocket error:", err);
      setIsConnected(false);
      setIsConnecting(false);
    };

    ws.onclose = () => {
      console.log("[ChatAssistant] WebSocket closed");
      setIsConnected(false);
      setIsConnecting(false);
    };
  }, [sessionId]);

  // Pre-connect WebSocket eagerly when sessionId is available
  useEffect(() => {
    if (sessionId) {
      connectWs();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [sessionId, connectWs]);

  // Audio playback
  const playNextAudio = useCallback(() => {
    if (isPlayingRef.current || pendingAudioRef.current.length === 0) return;
    isPlayingRef.current = true;

    const base64Data = pendingAudioRef.current.shift();
    const pcmBuffer = base64ToArrayBuffer(base64Data);

    if (!playbackContextRef.current) {
      playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
    }
    const ctx = playbackContextRef.current;

    // Convert Int16 PCM to Float32
    const int16 = new Int16Array(pcmBuffer);
    const audioBuffer = ctx.createBuffer(1, int16.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < int16.length; i++) {
      channelData[i] = int16[i] / 32768;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.onended = () => {
      isPlayingRef.current = false;
      playNextAudio(); // play next chunk
    };
    source.start();
  }, []);

  // Text submission — always uses REST endpoint
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    if (!isOpen) setIsOpen(true);

    const text = input.trim();
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsTyping(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text, history })
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") break;
            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                assistantContent += data.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = assistantContent;
                  return newMessages;
                });
              }
            } catch (err) { /* ignore */ }
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Helper: wait for WS to be connected (setup complete from Gemini)
  const waitForWsConnected = () => {
    return new Promise((resolve, reject) => {
      // Already connected
      if (wsRef.current?.readyState === WebSocket.OPEN && isConnected) {
        resolve();
        return;
      }
      // Connect first
      connectWs();
      const checkInterval = setInterval(() => {
        if (isConnected || wsRef.current?._geminiReady) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve();
        }
      }, 100);
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error("WebSocket connection timed out"));
      }, 10000);
    });
  };

  // Microphone recording — WS is pre-connected, just ensure readiness
  const startRecording = async () => {
    try {
      setIsTyping(true);

      // Run mic permission + WS readiness check in parallel for faster startup
      const micPromise = navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      // Ensure WS is connected (should already be from pre-connect)
      const wsReadyPromise = new Promise((resolve, reject) => {
        if (wsRef.current?.readyState === WebSocket.OPEN && wsRef.current?._geminiReady) {
          resolve();
          return;
        }
        // Fallback: reconnect if not ready
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connectWs();
        }
        const checkInterval = setInterval(() => {
          if (wsRef.current?._geminiReady) {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            resolve();
          }
        }, 50); // Check faster (50ms instead of 100ms)
        const timeout = setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error("Gemini Live connection timed out"));
        }, 10000);
      });

      const [stream] = await Promise.all([micPromise, wsReadyPromise]);
      streamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const workletUrl = createWorkletBlobUrl();
      await audioCtx.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      const source = audioCtx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioCtx, "pcm-processor");
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const base64 = arrayBufferToBase64(e.data);
          wsRef.current.send(JSON.stringify({ type: "audio", data: base64 }));
        }
      };

      source.connect(workletNode);
      workletNode.connect(audioCtx.destination);

      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setIsTyping(false);
    }
  };

  const stopRecording = () => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    // Signal end of audio turn
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "audio_end" }));
    }

    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const connectionStatus = isConnected ? "connected" : isConnecting ? "connecting" : "disconnected";

  return (
    <div className="flex flex-col justify-end w-full">
      {/* Chat messages popover */}
      {isOpen && (
        <div className="bg-[#1e1f22]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl mb-3 overflow-hidden flex flex-col h-[400px] animate-fade-in relative">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h3 className="text-xs font-semibold text-white uppercase tracking-widest">Research Assistant</h3>
              {/* Connection indicator */}
              <span className={`w-2 h-2 rounded-full ${
                connectionStatus === "connected" ? "bg-emerald-400" :
                connectionStatus === "connecting" ? "bg-amber-400 animate-pulse" :
                "bg-red-400"
              }`} title={`Gemini Live: ${connectionStatus}`} />
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-sm text-slate-500 italic text-center mt-10">
                Ask me anything about the research!
                <br />
                <span className="text-xs mt-1 block text-slate-600">Type a message or hold the mic to talk</span>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-500/20 text-indigo-100 border border-indigo-500/30 rounded-br-none' 
                      : 'bg-white/5 text-slate-300 border border-white/10 rounded-bl-none whitespace-pre-wrap'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isTyping && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex items-start">
                <div className="bg-white/5 border border-white/10 rounded-lg rounded-bl-none px-4 py-3 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Floating Input Bar (Gemini Style) */}
      <form onSubmit={handleSubmit} className="relative w-full shadow-2xl">
        <div className={`bg-[#1e1f22] backdrop-blur-xl border rounded-full flex items-center px-4 py-2 transition-colors focus-within:border-white/30 ${
          isRecording ? 'border-red-500/50 shadow-red-500/10 shadow-lg' : 'border-white/10 hover:border-white/20'
        }`}>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={isRecording ? "Listening..." : "Ask Agent"}
            disabled={isTyping || !sessionId || isRecording}
            className="flex-1 bg-transparent border-none text-white placeholder-slate-400 focus:outline-none focus:ring-0 px-3 py-2 text-base w-full min-w-0"
          />

          <div className="flex items-center gap-1 shrink-0 text-slate-400 ml-2">
             <button
               type="button"
               onClick={toggleRecording}
               className={`rounded-full p-2 transition-all ${
                 isRecording 
                   ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30 animate-pulse' 
                   : 'hover:text-white hover:bg-white/10'
               }`}
               title={isRecording ? "Stop recording" : "Start voice input"}
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
             </button>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isTyping || !sessionId}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
              input.trim() && !isTyping && sessionId 
                ? 'text-white bg-indigo-500 hover:bg-indigo-600 shadow-md' 
                : 'text-transparent pointer-events-none'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
