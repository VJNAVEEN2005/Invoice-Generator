import { useState, useRef, useEffect } from "react";
import { useInvoice } from "../../context/InvoiceContext";
import { generateAIResponse, validateAIConfig } from "../../services/ai";
import { Sparkles, Send, X, Bot, User, Loader2, ChevronRight, Minimize2, ExternalLink } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";

export function AIAssistant({ onNavigate }) {
  const { 
    companySettings, 
    savedClients, 
    savedProducts, 
    setSavedClients, 
    setSavedProducts, 
    createNewInvoice, 
    setInvoice, 
    formatCurrency,
    drafts,
    invoiceHistory
  } = useInvoice();

  const [mode, setMode] = useState(null); // null, 'chat', 'voice'
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI assistant. I can help you create invoices, manage clients, or answer questions about your revenue." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Idle"); // Listening, Thinking, Speaking
  const [voiceContent, setVoiceContent] = useState(""); // The actual text (User or AI)
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const companySettingsRef = useRef(companySettings);

  // Sync ref with settings
  useEffect(() => {
    companySettingsRef.current = companySettings;
  }, [companySettings]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, mode]);

  // Initialize Speech API
  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }
    
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
         setIsListening(true);
         setVoiceStatus("Listening...");
         setVoiceContent(""); // Clear previous content when starting new listen
      };

      recognitionRef.current.onresult = (event) => {
         let finalTranscript = '';
         let interimTranscript = '';

         for (let i = event.resultIndex; i < event.results.length; ++i) {
           if (event.results[i].isFinal) {
             finalTranscript += event.results[i][0].transcript;
           } else {
             interimTranscript += event.results[i][0].transcript;
           }
         }


         if (finalTranscript) {
             setVoiceContent(`"${finalTranscript}"`);
             // Pass 'voice' explicitly to ensure mode is correct
             handleSend(finalTranscript, 'voice');
         } else if (interimTranscript) {
             setVoiceContent(`"${interimTranscript}"`);
         }
      };

      recognitionRef.current.onerror = (event) => {
         console.error("Speech Error:", event.error);
         setVoiceStatus("Error");
         setVoiceContent("Error: " + event.error);
         setIsListening(false);
      };

      recognitionRef.current.onend = () => {
         setIsListening(false);
         if (voiceStatus === "Listening...") setVoiceStatus("Idle");
      };
    }
  }, []);

  // Handle Border Effect
  useEffect(() => {
    if (mode === "voice") {
       document.body.classList.add("voice-mode-active");
    } else {
       document.body.classList.remove("voice-mode-active");
       stopSpeaking();
       if (isListening) recognitionRef.current?.stop();
    }
    return () => {
      document.body.classList.remove("voice-mode-active");
      stopSpeaking();
    };
  }, [mode]);

  const speak = (text) => {
    if (synthesisRef.current && text) {
       // Cancel any current speaking
       synthesisRef.current.cancel();
       const utterance = new SpeechSynthesisUtterance(text);
       utterance.onstart = () => {
           setIsListening(false); 
           setVoiceStatus("Speaking...");
       };
       utterance.onend = () => setVoiceStatus("Idle");
       synthesisRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
  };

  const handleSend = async (text = input, explicitMode = null) => {
    const currentMode = explicitMode || mode;
    
    if (!text.trim() || isLoading) return;

    if (currentMode === "chat") {
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: text }]);
    }
    
    setIsLoading(true);
    setVoiceStatus("Thinking...");
    
    // In voice mode, we keep showing the user's text while processing
    if (currentMode === "voice") {
        // voiceContent is already set to the user's text
    }

    try {
      const currentSettings = companySettingsRef.current;
      validateAIConfig(currentSettings.apiKey, currentSettings.aiModel);

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const recentActivity = invoiceHistory.filter(inv => {
          const d = inv.date.split('T')[0];
          return d === todayStr || d === yesterdayStr;
      }).map(inv => ({ 
          id: inv.id, 
          client: inv.client.name, 
          total: formatCurrency(inv.items.reduce((s, i) => s + (i.quantity*i.price), 0)),
          status: inv.status,
          date: inv.date 
      }));

      const context = {
        currentDate: todayStr,
        clients: savedClients.map(c => ({ name: c.name, email: c.email })), // Minimal data
        products: savedProducts.map(p => ({ name: p.name, price: p.price })),
        recentActivity,
        // Include summary if asked (simplified for now)
        financials: {
           totalRevenue: formatCurrency(invoiceHistory.reduce((s, i) => s + (i.items?.reduce((ss, ii) => ss + (ii.quantity*ii.price), 0)||0), 0)),
           count: invoiceHistory.length
        }
      };

      const result = await generateAIResponse(
        currentSettings.apiKey, 
        currentSettings.aiModel, 
        text, 
        context
      );

      // Process Action
      let assistantResponse = result.response || "Done.";

      if (result.action === "create_invoice") {
        const { clientName, items, notes } = result.params || {};
        
        createNewInvoice(); // Resets to new invoice
        
        // Update Invoice State
        setInvoice(prev => {
          const clientData = savedClients.find(c => (c.name || "").toLowerCase() === (clientName || "").toLowerCase()) 
                            || { name: clientName || "New Client", email: "", address: "" };
          
          const newItems = (items || []).map(item => {
             // Try to find product details
             const product = savedProducts.find(p => (p.name || "").toLowerCase() === (item.description || item.name || "").toLowerCase());
             return {
                id: crypto.randomUUID(),
                description: item.description || item.name || "Item",
                quantity: Number(item.quantity) || 1,
                price: product ? product.price : (Number(item.price) || 0)
             };
          });

          return {
            ...prev,
            client: { ...prev.client, ...clientData },
            items: newItems.length > 0 ? newItems : prev.items,
            notes: notes || prev.notes
          };
        });

        // Navigate to editor
        onNavigate("editor");
        assistantResponse = `I've created a draft invoice for ${clientName}. Please review it in the editor.`;
      
      } else if (result.action === "create_client") {
        const { name, email, phone, address } = result.params || {};
        if (name) {
             const newClient = { name, email: email || "", phone: phone || "", address: address || "" };
             setSavedClients(prev => [...prev, newClient]);
             assistantResponse = `Added new client: ${name}`;
             onNavigate("clients");
        } else {
             assistantResponse = "I couldn't add the client because the name was missing.";
        }

      } else if (result.action === "create_product") {
         const { name, price, description } = result.params || {};
         if (name && price) {
             const newProduct = { name, price: Number(price), description: description || "" };
             setSavedProducts(prev => [...prev, newProduct]);
             assistantResponse = `Added new product: ${name} (${formatCurrency(Number(price))})`;
             onNavigate("products");
         } else {
             assistantResponse = "I couldn't add the product. Name and price are required.";
         }

      } else if (result.action === "navigate") {
        const screen = (result.params?.formattedScreenName || "").toLowerCase();
        const validScreens = ["dashboard", "editor", "clients", "products", "settings", "reports", "calendar"];
        
        const navParams = {};
        if (result.params?.dateRange) {
           navParams.dateRange = result.params.dateRange;
           // If date range is present, default to reports unless specified otherwise
           if (screen === "" || screen === "reports") {
               onNavigate("reports", navParams);
               assistantResponse = `Showing reports for ${result.params.dateRange.start} to ${result.params.dateRange.end}...`;
               if (currentMode === "chat") setMessages(prev => [...prev, { role: "assistant", content: assistantResponse }]);
               if (currentMode === "voice") {
                   setVoiceContent(assistantResponse);
                   speak(assistantResponse);
               }
               return; 
           }
        }

        if (screen === "calendar") {
            onNavigate("reports", { view: "calendar", ...navParams });
            assistantResponse = "Opening calendar view...";
        } else if (validScreens.includes(screen)) {
            onNavigate(screen, navParams);
            assistantResponse = `Navigating to ${screen}...`;
        } else {
            assistantResponse = `I can't navigate to "${screen}". Try "dashboard", "editor", "clients", etc.`;
        }

      } else if (result.action === "get_financial_summary") {
         // The response text from AI should already cover this based on context, 
         // but if we implemented specific logic here we could.
         // For now, we rely on the AI using the context data to formulate the answer.
         // We might navigate to reports for better view.
         onNavigate("reports");
      }

      if (currentMode === "chat") {
         setMessages(prev => [...prev, { role: "assistant", content: assistantResponse }]);
      }
      
      if (currentMode === "voice") {
          setVoiceContent(assistantResponse);
          speak(assistantResponse);
      }

    } catch (error) {
       console.error(error);
       if (currentMode === "chat") {
          setMessages(prev => [...prev, { role: "assistant", content: `Error: ${error.message}` }]);
       }
       if (currentMode === "voice") {
           setVoiceStatus("Error");
           setVoiceContent("Error occurred. Please try again.");
           speak("Sorry, I encountered an error.");
       }
    } finally {
      setIsLoading(false);
      if (currentMode === "voice" && voiceStatus === "Thinking...") {
          setVoiceStatus("Idle"); // Only reset if we were thinking, otherwise speak() handles it
      }
    }
  };

  const startVoice = () => {
    setMode("voice");
    setIsExpanded(false);
    
    if (recognitionRef.current) {
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error("Microphone busy or error", e);
        }
    } else {
        setVoiceStatus("Error");
        setVoiceContent("Voice not supported on this browser.");
    }
  };

  const closeAI = () => {
      setMode(null);
      setIsExpanded(false);
      setIsListening(false);
      stopSpeaking();
      if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e){}
      }
  };

  // Check if AI is enabled
  if (!companySettings.enableAI) return null;

  return (
    <>
      {/* Expanded Main Options */}
      {isExpanded && !mode && (
        <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
           <button 
             onClick={() => { setMode("chat"); setIsExpanded(false); }}
             className="flex items-center gap-3 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl shadow-xl border border-slate-100 font-medium transition-all hover:scale-105 active:scale-95"
           >
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                 <Bot size={20} />
              </div>
              Chat Mode
           </button>
           <button 
             onClick={startVoice}
             className="flex items-center gap-3 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl shadow-xl border border-slate-100 font-medium transition-all hover:scale-105 active:scale-95"
           >
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                 <span className="relative flex h-3 w-3">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                 </span>
              </div>
              Voice Mode
           </button>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => {
            if (mode) closeAI();
            else setIsExpanded(!isExpanded);
        }}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
          mode || isExpanded ? "bg-slate-800 rotate-90" : "bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse-slow shadow-purple-500/30"
        }`}
      >
        {mode || isExpanded ? <X className="text-white" /> : <Sparkles className="text-white" />}
      </button>

      {/* Chat Mode UI */}
      {mode === "chat" && (
        <div className="fixed bottom-24 right-6 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] z-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300 origin-bottom-right">
           <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50" />
           
           <div className="relative flex-1 flex flex-col overflow-hidden rounded-3xl">
              {/* Header */}
              <div className="p-4 bg-white/50 border-b border-slate-100 flex items-center justify-between backdrop-blur-md">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-md">
                       <Bot size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">AI Assistant</h3>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1">
                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                           {companySettings.aiModel || "Gemini"}
                        </p>
                    </div>
                 </div>
                 <button onClick={closeAI} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                    <Minimize2 size={16} />
                 </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
                 {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                       <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          msg.role === "user" 
                            ? "bg-slate-800 text-white rounded-br-none" 
                            : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                       }`}>
                          {msg.content}
                       </div>
                    </div>
                 ))}
                 {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm flex items-center gap-2">
                           <Loader2 size={16} className="animate-spin text-purple-500" />
                           <span className="text-xs text-slate-400 font-medium">Thinking...</span>
                        </div>
                    </div>
                 )}
                 <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-slate-100">
                 <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Ask me to create an invoice..."
                      className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                    />
                    <button 
                       onClick={() => handleSend()}
                       disabled={isLoading || !input.trim()}
                       className="p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex items-center justify-center w-12"
                    >
                       <Send size={18} />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Voice Mode UI */}
      {mode === "voice" && (
        <div className="fixed bottom-24 right-6 w-[300px] z-50 flex flex-col items-center animate-in zoom-in fade-in duration-300 origin-bottom-right">
             <div className="bg-slate-900/90 backdrop-blur-xl text-white p-6 rounded-3xl shadow-2xl border border-white/10 w-full flex flex-col items-center gap-6">
                 
                 {/* Visualizer */}
                 <div className="h-20 flex items-center justify-center gap-1.5">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="voice-bar" style={{ animationDelay: `${i * 0.1}s`, background: isListening || isLoading ? '#ec4899' : 'gray' }}></div>
                    ))}
                 </div>

                 <div className="text-center w-full">
                     <p className="text-xs text-pink-300 uppercase tracking-widest font-semibold mb-2 animate-pulse">{voiceStatus}</p>
                     <p className="font-medium text-lg min-h-[3rem] px-2">{voiceContent || "Waiting for command..."}</p>
                 </div>

                 {/* Controls */}
                 <div className="flex gap-4 w-full">
                     <button 
                        onClick={() => {
                            stopSpeaking();
                            if (isListening) {
                                recognitionRef.current?.stop();
                                setIsListening(false);
                            } else {
                                recognitionRef.current?.start();
                            }
                        }}
                        className={`flex-1 py-3 rounded-xl transition-colors font-medium text-sm border ${
                            isListening ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-white border-white/20 hover:bg-white/10'
                        }`}
                     >
                        {isListening ? "Listening..." : "Tap to Speak"}
                     </button>
                 </div>
             </div>
        </div>
      )}
    </>
  );
}
