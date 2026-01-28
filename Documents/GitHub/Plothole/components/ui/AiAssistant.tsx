
import React, { useState, useRef, useEffect } from 'react';
import { ProjectData } from '../../types';
import { askProjectAI } from '../../services/geminiService';
import { Button } from './Button';
import { Sparkles, X, Send, MessageSquare } from 'lucide-react';

interface AiAssistantProps {
  projectData: ProjectData | null;
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ 
  projectData,
  isOpen: propsIsOpen,
  onClose,
  onToggle
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hi! I\'m your Plothole assistant. Ask me anything about your story, characters, or for writing advice.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isVisible = propsIsOpen !== undefined ? propsIsOpen : internalIsOpen;
  
  const handleToggle = () => {
    if (onToggle) onToggle();
    else setInternalIsOpen(!internalIsOpen);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isVisible]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await askProjectAI(userMsg, projectData);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I had trouble connecting to the muse.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button - Hidden on Mobile because it's in the Sidebar */}
      <button
        onClick={handleToggle}
        className={`
          hidden md:flex fixed z-50 rounded-full shadow-2xl items-center justify-center transition-all duration-300 hover:scale-110
          ${isVisible ? 'bg-slate-200 text-slate-600 rotate-90' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'}
          bottom-8 right-8 w-14 h-14
        `}
        title="Ask AI Assistant"
      >
        {isVisible ? <X size={24} /> : <Sparkles size={24} />}
      </button>

      {/* Chat Window */}
      {isVisible && (
        <div className="fixed z-40 bottom-[5rem] right-0 left-0 mx-auto w-[95vw] md:bottom-24 md:right-8 md:left-auto md:w-96 h-[500px] max-h-[60vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white flex items-center gap-2">
            <MessageSquare size={18} />
            <h3 className="font-bold text-sm">Story Assistant</h3>
            {projectData && (
               <span className="ml-auto text-[10px] bg-white/20 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                  {projectData.title}
               </span>
            )}
            {/* Mobile Close Button */}
            <button onClick={onClose || handleToggle} className="ml-2 md:hidden">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`
                    max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm
                    ${msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'}
                  `}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-500 border border-slate-200 rounded-2xl rounded-tl-none px-4 py-2 text-sm shadow-sm flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              autoFocus
              className="flex-1 bg-slate-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ask about your story..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <Button 
               type="submit" 
               disabled={!input.trim() || isLoading} 
               className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700"
            >
              <Send size={16} />
            </Button>
          </form>
        </div>
      )}
    </>
  );
};
