import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send, User, Menu, Plus, MessageSquare, FileText, Sparkles, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import Galaxy from '../components/Galaxy';
import { useAuth } from '../context/AuthContext';

// Types
interface Message {
    id: string;
    role: 'user' | 'bot';
    content: string;
    sources?: Source[];
}

interface Source {
    source_file: string;
}

interface Conversation {
    id: number;
    title: string;
}

export default function Chat() {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { token, userEmail, logout } = useAuth();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    useEffect(() => {
        if (token) {
            fetchConversations();
        }
    }, [token]);

    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    const fetchConversations = async () => {
        try {
            const response = await axios.get(`${API_URL}/chat/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(response.data);
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        }
    };

    const loadConversation = async (id: number) => {
        try {
            const response = await axios.get(`${API_URL}/chat/sessions/${id}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Map the backend Message models to our frontend format
            const loadedMessages: Message[] = response.data.map((msg: any) => ({
                id: msg.id.toString(),
                role: msg.role,
                content: msg.content
            }));

            setCurrentConversationId(id);
            setMessages(loadedMessages);
            if (window.innerWidth < 768) setSidebarOpen(false);
        } catch (error) {
            console.error("Failed to load conversation", error);
        }
    };

    const handleNewChat = async () => {
        try {
            const response = await axios.post(`${API_URL}/chat/sessions`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurrentConversationId(response.data.id);
            setMessages([]);
            setQuery('');
            fetchConversations();
            if (window.innerWidth < 768) setSidebarOpen(false);
        } catch (error) {
            console.error("Failed to create new chat session", error);
            // Fallback to local reset if network fails
            setCurrentConversationId(null);
            setMessages([]);
            setQuery('');
        }
    };

    const handleSend = async () => {
        if (!query.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: query
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setQuery('');

        try {
            const payload = {
                query: userMessage.content,
                conversation_id: currentConversationId || undefined
            };

            const response = await axios.post(`${API_URL}/retrieve/`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // If creating a new chat, update ID and refresh sidebar
            if (!currentConversationId && response.data.conversation_id) {
                setCurrentConversationId(response.data.conversation_id);
                fetchConversations();
            }

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'bot',
                content: response.data.answer,
                sources: response.data.sources
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error: any) {
            console.error("Error fetching response:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'bot',
                content: error.response?.status === 401 ? "Unauthorized. Please log in again." : "Sorry, I encountered an error while processing your request. Please try again."
            };
            setMessages(prev => [...prev, errorMessage]);
            if (error.response?.status === 401) {
                logout();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="w-full h-screen flex bg-black text-gray-100 overflow-hidden relative font-sans selection:bg-primary/30">

            {/* Animated Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <Galaxy />
            </div>

            {/* Sidebar */}
            <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: sidebarOpen ? 280 : 0, opacity: sidebarOpen ? 1 : 0 }}
                className="h-full bg-black/70 backdrop-blur-xl border-r border-white/10 flex flex-col z-20 shrink-0 overflow-hidden"
            >
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <Menu className="w-5 h-5 cursor-pointer hover:text-gray-300 transition-colors" onClick={() => setSidebarOpen(!sidebarOpen)} />
                        <span className="font-medium tracking-tight">VITC_Chatbot</span>
                    </div>
                </div>

                <button onClick={handleNewChat} className="mx-4 mt-2 p-3 bg-dark-800 hover:bg-dark-700/50 rounded-full flex items-center gap-3 text-sm text-gray-300 transition-all border border-transparent hover:border-gray-700">
                    <Plus className="w-4 h-4 text-gray-400" />
                    <span>New chat</span>
                </button>

                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="text-xs font-medium text-gray-500 mb-3 ml-2">Recent</div>
                    <div className="space-y-1">
                        {conversations.length === 0 && (
                            <div className="text-sm text-gray-600 ml-2">No history yet</div>
                        )}
                        {conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => loadConversation(conv.id)}
                                className={`group p-2 rounded-lg hover:bg-dark-800/50 text-sm cursor-pointer flex items-center gap-2 transition-colors ${currentConversationId === conv.id ? 'bg-dark-800/80 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                <MessageSquare className="w-4 h-4 shrink-0" />
                                <span className="truncate">{conv.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 flex flex-col gap-3 pb-6">
                    {/* User Profile Area */}
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-dark-800/30 border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 shrink-0">
                            <User className="w-5 h-5 text-gray-300" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-medium text-gray-200 truncate">
                                {userEmail ? userEmail.split('@')[0] : 'User'}
                            </span>
                            <span className="text-xs text-gray-500 truncate">
                                {userEmail || 'Loading profile...'}
                            </span>
                        </div>
                    </div>

                    <button onClick={logout} className="flex items-center justify-center gap-2 p-2 w-full hover:bg-dark-800 rounded-lg transition-colors text-red-400 hover:text-red-300 border border-transparent hover:border-red-500/20">
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Logout</span>
                    </button>

                    <div className="text-center text-[10px] text-gray-600 mt-1">
                        v1.0.0 • Connected to Weaviate
                    </div>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative z-10 h-full">
                {/* Top Bar (Mobile/Collapsed Sidebar Trigger) */}
                {!sidebarOpen && (
                    <div className="absolute top-4 left-4 z-50">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                )}

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto w-full">
                    <div className="w-full max-w-[95%] mx-auto px-4 pb-32 pt-20">

                        {/* Welcome Screen */}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-start justify-center min-h-[60vh] space-y-8 animate-in fade-in zoom-in duration-500">
                                <div className="space-y-4">
                                    <h1 className="text-5xl md:text-6xl font-bold tracking-tighter drop-shadow-lg">
                                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Hello, User</span>
                                    </h1>
                                    <p className="text-2xl text-gray-200 font-light drop-shadow-md">How can I help you today?</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    {['Summarize document', 'Explain code snippet', 'Debug error logs', 'Find references'].map((suggestion, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setQuery(suggestion)}
                                            className="p-4 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/10 rounded-xl text-left text-sm text-gray-200 hover:text-white transition-all hover:scale-[1.02] shadow-lg"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="space-y-10">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                                    {msg.role === 'bot' && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-purple-500/20">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                    )}

                                    <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-5 py-3.5 rounded-2xl ${msg.role === 'user'
                                            ? 'bg-dark-800 text-gray-100 rounded-br-sm' // User message is simplified dark pill
                                            : 'text-gray-200 w-full' // Bot message blends into background more
                                            }`}>
                                            {msg.role === 'user' ? (
                                                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            ) : (
                                                <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10 max-w-none">
                                                    <ReactMarkdown
                                                        components={{
                                                            code(props) {
                                                                const { children, className, node, ref, ...rest } = props
                                                                const match = /language-(\w+)/.exec(className || '')
                                                                return match ? (
                                                                    <SyntaxHighlighter
                                                                        {...rest}
                                                                        PreTag="div"
                                                                        children={String(children).replace(/\n$/, '')}
                                                                        language={match[1]}
                                                                        style={vscDarkPlus}
                                                                        customStyle={{ background: 'transparent', margin: 0 }}
                                                                    />
                                                                ) : (
                                                                    <code {...rest} className={`${className} bg-white/10 px-1 py-0.5 rounded text-sm text-pink-300`}>
                                                                        {children}
                                                                    </code>
                                                                )
                                                            }
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sources */}
                                        {msg.role === 'bot' && msg.sources && msg.sources.length > 0 && (
                                            <div className="pl-1 mt-1 flex flex-wrap gap-2">
                                                {msg.sources.map((src, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-900/50 border border-white/5 rounded-full text-xs text-gray-400 hover:text-gray-300 hover:border-white/10 transition-colors cursor-pointer">
                                                        <FileText className="w-3 h-3" />
                                                        <span className="truncate max-w-[150px]">{src.source_file}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center shrink-0 mt-1">
                                            <User className="w-4 h-4 text-gray-300" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 mt-1 animate-pulse">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex items-center gap-1 mt-2">
                                        <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </div>

                {/* Input Area (Floating) */}
                <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center z-50">
                    <div className="w-full max-w-4xl bg-black/70 backdrop-blur-xl border border-white/15 rounded-full p-2 pl-6 pr-2 shadow-2xl flex items-center gap-4 transition-all focus-within:bg-black/80 focus-within:border-white/30 focus-within:shadow-purple-500/20 focus-within:ring-1 focus-within:ring-purple-500/30">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask VITC_Chatbot..."
                            className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none min-h-[3rem]"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !query.trim()}
                            className="p-3 bg-white text-black rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                        </button>
                    </div>
                    <div className="absolute bottom-[-1.5rem] opacity-0 pointer-events-none text-xs text-gray-500">
                        VITC_Chatbot may display inaccurate info, including about people, so double-check its responses.
                    </div>
                </div>
            </div>
        </div>
    );
}
