import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Mic, MicOff, X, Send, Volume2, Home, FileText, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const Design = () => {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user has seen the welcome message
    const hasSeenWelcome = localStorage.getItem('design_welcome_seen');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    localStorage.setItem('design_welcome_seen', 'true');
    setShowWelcome(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          const { data, error } = await supabase.functions.invoke('voice_to_text', {
            body: { audio: base64Audio }
          });

          if (error) throw error;
          
          const transcribedText = data.text;
          setPrompt(transcribedText);
          handleSendMessage(transcribedText);
          
          toast({
            title: "Voice recorded",
            description: "Your voice has been transcribed and sent",
          });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not access microphone: " + error.message,
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || prompt.trim();
    
    if (!textToSend) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('design_advisor', {
        body: { prompt: textToSend }
      });

      if (error) throw error;

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.advice || "No advice generated" 
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleClick = (sample: string) => {
    setPrompt(sample);
  };

  const handleClose = () => {
    if (mediaRecorder && isRecording) {
      stopRecording();
    }
    navigate('/');
  };

  const handleGenerateBlueprint = () => {
    navigate('/house-planning');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const samplePrompts = [
    "How can I maximize natural light in my living room?",
    "What are the best indoor plants for air purification?",
    "Use voice to describe your energy-saving goals",
    "How can I design a more energy-efficient office space?"
  ];

  return (
    <Layout>
      {/* Welcome Dialog */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-md glass-card border-primary/20">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gradient-to-br from-primary via-eco-accent to-info rounded-lg animate-gradient animate-pulse-slow shadow-glow">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <DialogTitle className="text-2xl bg-gradient-to-r from-primary via-eco-accent to-info bg-clip-text text-transparent animate-gradient">
                Welcome to Eco Design Advisor!
              </DialogTitle>
            </div>
            <DialogDescription className="text-left space-y-4 pt-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Ask Anything</p>
                    <p className="text-sm text-muted-foreground">Get AI-powered advice on sustainable design, energy efficiency, and eco-friendly solutions.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Use Voice Input</p>
                    <p className="text-sm text-muted-foreground">Click the microphone icon to speak your questions instead of typing.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Generate Blueprints</p>
                    <p className="text-sm text-muted-foreground">After chatting, click "Generate House Blueprint" to create sustainable home designs.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Try the sample questions below to get started!
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              onClick={handleCloseWelcome} 
              className="w-full bg-gradient-to-br from-primary via-eco-accent to-info hover:shadow-glow transition-all hover:scale-105 animate-gradient"
            >
              Got it, let's start!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8 max-w-5xl h-[calc(100vh-8rem)] relative">
        {/* Animated background gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-info/5 to-eco-accent/5 animate-gradient" />
        
        <Card className="relative h-full flex flex-col rounded-2xl shadow-lg border-primary/20 glass-card overflow-hidden">
          {/* Top Right Actions */}
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
            <Button
              onClick={() => navigate('/bills')}
              variant="ghost"
              size="icon"
              className="rounded-full glass hover:scale-110 transition-all animate-float shadow-glow"
              aria-label="Go to Bills"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="icon"
              className="rounded-full glass hover:scale-110 transition-all animate-float shadow-glow"
              aria-label="Close chat"
              style={{ animationDelay: '0.5s' }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 p-6 border-b border-border/50 glass">
            <div className="p-3 bg-gradient-to-br from-primary via-eco-accent to-info rounded-xl animate-gradient animate-pulse-slow shadow-glow">
              <Lightbulb className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground bg-gradient-to-r from-primary via-eco-accent to-info bg-clip-text text-transparent animate-gradient">
                Eco Design Advisor
              </h1>
              <p className="text-sm text-muted-foreground">AI-powered sustainable design chat</p>
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-6 relative">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <div className="p-4 bg-gradient-to-br from-primary via-eco-accent to-info rounded-full mx-auto w-fit animate-gradient animate-float shadow-glow">
                    <Lightbulb className="h-12 w-12 text-primary-foreground" />
                  </div>
                  <p className="text-lg mt-4 font-medium bg-gradient-to-r from-primary via-eco-accent to-info bg-clip-text text-transparent animate-gradient">
                    Start a conversation about sustainable design
                  </p>
                  <p className="text-sm mt-2">Use text or voice input below</p>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-lg transition-all hover:scale-105 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-primary via-eco-accent to-info text-primary-foreground animate-gradient glass-card'
                        : 'glass-card'
                    }`}
                  >
                    <p className={`text-sm whitespace-pre-wrap break-words ${message.role === 'user' ? 'font-medium' : ''}`}>
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="glass-card rounded-2xl px-4 py-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gradient-to-r from-primary to-eco-accent rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gradient-to-r from-eco-accent to-info rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gradient-to-r from-info to-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm text-muted-foreground">EcoPulse is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Generate Blueprint Button */}
          {messages.length > 0 && (
            <div className="px-6 py-4 border-t border-border/50 glass">
              <Button 
                onClick={handleGenerateBlueprint}
                className="w-full bg-gradient-to-br from-primary via-eco-accent to-info hover:shadow-glow transition-all hover:scale-105 animate-gradient"
                variant="default"
              >
                <Home className="mr-2 h-4 w-4" />
                Generate House Blueprint
              </Button>
            </div>
          )}

          {/* Sample Prompts */}
          {messages.length === 0 && (
            <div className="px-6 pb-4 glass border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-2 mt-4">💚 Sample Questions:</p>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleClick(sample)}
                    className="text-xs px-3 py-1.5 rounded-full glass hover:scale-105 text-foreground transition-all hover:shadow-glow"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-border/50 glass">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="E.g., 'How can I design a more energy-efficient office space?'"
                  className="w-full min-h-[50px] max-h-[120px] px-4 py-3 rounded-xl glass text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all focus:scale-105"
                  rows={1}
                />
              </div>
              
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant="outline"
                size="icon"
                className={`h-[50px] w-[50px] rounded-xl glass hover:scale-110 transition-all ${
                  isRecording ? 'bg-gradient-to-br from-destructive to-destructive/70 text-destructive-foreground animate-pulse shadow-glow' : ''
                }`}
                aria-label={isRecording ? "Stop recording" : "Start voice input"}
              >
                {isRecording ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>

              <Button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !prompt.trim()}
                size="icon"
                className="h-[50px] w-[50px] rounded-xl bg-gradient-to-br from-primary via-eco-accent to-info hover:shadow-glow transition-all hover:scale-110 animate-gradient"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Design;
