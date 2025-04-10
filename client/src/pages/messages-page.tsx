import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Search, Send, UserPlus, Phone, Video, Info, Smile } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNav from "@/components/layout/mobile-nav";

interface User {
  id: number;
  username: string;
  name: string | null;
  profileImage: string | null;
}

interface Conversation {
  id: number;
  user: User;
  lastMessage: {
    content: string;
    timestamp: string;
    isRead: boolean;
    sentByMe: boolean;
  };
  hasUnread: boolean;
}

interface Message {
  id: number;
  content: string;
  timestamp: string;
  sentByMe: boolean;
  isRead: boolean;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check user preference when page loads
  useEffect(() => {
    const userPreference = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (userPreference === 'dark' || (!userPreference && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  }, []);
  
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('darkMode', isDark ? 'dark' : 'light');
    setIsDarkMode(isDark);
  };
  
  const { data: conversations, isLoading: isConversationsLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/messages/conversations'],
  });
  
  const { data: messages, isLoading: isMessagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages/conversations', activeConversation],
    enabled: activeConversation !== null
  });
  
  const filteredConversations = conversations?.filter(conv => 
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.user.name && conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const activeConversationData = conversations?.find(conv => conv.id === activeConversation);
  
  // Scroll to bottom of messages when messages change or a new conversation is selected
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeConversation]);
  
  const sendMessage = () => {
    if (messageText.trim() === '' || !activeConversation) return;
    
    // In a real app, we would send the message to the API here
    console.log(`Sending message to conversation ${activeConversation}: ${messageText}`);
    
    setMessageText('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="flex flex-col h-screen md:flex-row">
      <MobileHeader toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      <Sidebar toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} />
      
      <main className="flex-1 flex overflow-hidden pb-16 md:pb-0">
        {/* Conversations sidebar */}
        <div className="w-full md:w-80 lg:w-96 border-r border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex flex-col">
          <div className="p-4 border-b border-neutral-300 dark:border-neutral-700">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold">{user?.username}</h1>
              <Button variant="ghost" size="icon">
                <UserPlus className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative">
              <Input 
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            {isConversationsLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !filteredConversations || filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                <MessageCircle className="h-10 w-10 mx-auto mb-4 text-neutral-400" />
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Start messaging by searching for a user</p>
              </div>
            ) : (
              <div>
                {filteredConversations.map(conversation => (
                  <div 
                    key={conversation.id}
                    className={`flex items-center gap-3 p-4 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer ${
                      activeConversation === conversation.id ? 'bg-neutral-200 dark:bg-neutral-700' : ''
                    }`}
                    onClick={() => setActiveConversation(conversation.id)}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.user.profileImage || ""} />
                        <AvatarFallback>{getInitials(conversation.user.username)}</AvatarFallback>
                      </Avatar>
                      {conversation.hasUnread && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-medium truncate">{conversation.user.name || conversation.user.username}</p>
                        <p className="text-xs text-neutral-500">{formatTimestamp(conversation.lastMessage.timestamp)}</p>
                      </div>
                      <p className={`text-sm truncate ${
                        !conversation.lastMessage.isRead && !conversation.lastMessage.sentByMe 
                          ? 'font-semibold text-black dark:text-white' 
                          : 'text-neutral-500'
                      }`}>
                        {conversation.lastMessage.sentByMe ? 'You: ' : ''}{conversation.lastMessage.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        
        {/* Message area */}
        <div className="hidden md:flex md:flex-1 flex-col">
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageCircle className="h-16 w-16 mb-4 text-neutral-300 dark:text-neutral-600" />
              <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
              <p className="text-neutral-500 max-w-sm">
                Send private messages to your friends and connections
              </p>
              <Button className="mt-6">
                Start a Conversation
              </Button>
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <div className="flex items-center p-4 border-b border-neutral-300 dark:border-neutral-700">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={activeConversationData?.user.profileImage || ""} />
                  <AvatarFallback>{activeConversationData?.user ? getInitials(activeConversationData.user.username) : ""}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{activeConversationData?.user.name || activeConversationData?.user.username}</p>
                  <p className="text-xs text-neutral-500">Active now</p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Info className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {isMessagesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                        <Skeleton className={`h-12 ${i % 2 === 0 ? 'w-64' : 'w-48'} rounded-lg`} />
                      </div>
                    ))}
                  </div>
                ) : !messages || messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <p className="text-neutral-500">No messages yet</p>
                    <p className="text-sm text-neutral-400">Start the conversation by sending a message below</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div 
                        key={message.id} 
                        className={`flex ${message.sentByMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!message.sentByMe && (
                          <Avatar className="h-8 w-8 mr-2 mt-1">
                            <AvatarImage src={activeConversationData?.user.profileImage || ""} />
                            <AvatarFallback>{activeConversationData?.user ? getInitials(activeConversationData.user.username) : ""}</AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <div 
                            className={`px-4 py-2 rounded-lg max-w-xs ${
                              message.sentByMe 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-neutral-200 dark:bg-neutral-700'
                            }`}
                          >
                            <p>{message.content}</p>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">
                            {formatTimestamp(message.timestamp)}
                            {message.sentByMe && (message.isRead ? ' • Seen' : ' • Delivered')}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
              
              {/* Message input */}
              <div className="p-4 border-t border-neutral-300 dark:border-neutral-700">
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message..."
                    className="flex-1"
                  />
                  <Button 
                    size="icon" 
                    disabled={messageText.trim() === ''} 
                    onClick={sendMessage}
                    className="shrink-0"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}