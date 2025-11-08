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
        <DialogContent className="sm:max-w-md border-animate-slow neon-glow rounded-3xl shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-2xl shadow-2xl bg-gradient-to-br from-primary to-primary/80">
                <Sparkles className="h-6 w-6 text-primary-foreground drop-shadow-lg" />
              </div>
              <DialogTitle className="text-2xl font-bold text-primary">
                Welcome to Eco Design Advisor!
              </DialogTitle>
            </div>
            <DialogDescription className="text-left space-y-4 pt-4">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 glass flex items-center justify-center text-primary font-bold shadow-lg">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Ask Anything</p>
                    <p className="text-sm text-muted-foreground/80">Get AI-powered advice on sustainable design, energy efficiency, and eco-friendly solutions.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 glass flex items-center justify-center text-primary font-bold shadow-lg">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Use Voice Input</p>
                    <p className="text-sm text-muted-foreground/80">Click the microphone icon to speak your questions instead of typing.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 glass flex items-center justify-center text-primary font-bold shadow-lg">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Generate Blueprints</p>
                    <p className="text-sm text-muted-foreground/80">After chatting, click "Generate House Blueprint" to create sustainable home designs.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/20">
                <p className="text-xs text-muted-foreground/80 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" />
                  Try the sample questions below to get started!
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              onClick={handleCloseWelcome} 
              className="w-full h-12 shadow-2xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary hover:to-primary transition-all duration-300 hover:scale-[1.02] border-0 font-semibold rounded-2xl text-primary-foreground"
            >
              Got it, let's start!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8 max-w-5xl h-[calc(100vh-8rem)] relative">
        {/* Crazy animated background with multiple blur orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-neon-cyan/20 via-neon-pink/20 to-neon-purple/20 animate-gradient-fast" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/30 to-neon-cyan/30 rounded-full blur-3xl animate-float neon-glow" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-neon-pink/30 to-neon-purple/30 rounded-full blur-3xl animate-float neon-glow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-neon-yellow/20 to-info/20 rounded-full blur-3xl animate-float neon-glow" style={{ animationDelay: '2s' }} />
        </div>
        
        <Card className="relative h-full flex flex-col rounded-3xl shadow-2xl border-2 border-primary/30 bg-card/95 backdrop-blur-3xl overflow-hidden">
          {/* Top Right Actions */}
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
            <Button
              onClick={() => navigate('/bills')}
              variant="ghost"
              size="icon"
              className="rounded-2xl glass hover:scale-105 transition-all duration-300 animate-float border-0 hover:bg-primary/10"
              aria-label="Go to Bills"
            >
              <FileText className="h-4 w-4 text-primary" />
            </Button>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="icon"
              className="rounded-2xl glass hover:scale-105 transition-all duration-300 animate-float border-0 hover:bg-destructive/10"
              aria-label="Close chat"
              style={{ animationDelay: '0.5s' }}
            >
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>

          {/* Header */}
          <div className="flex items-center gap-4 p-6 border-b border-border/20 glass backdrop-blur-2xl">
            <div className="p-3 rounded-2xl shadow-2xl bg-gradient-to-br from-primary to-primary/80">
              <Lightbulb className="h-6 w-6 text-primary-foreground drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">
                Eco Design Advisor
              </h1>
              <p className="text-sm text-muted-foreground">AI-powered sustainable design chat</p>
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-6 relative">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  <div className="p-6 rounded-3xl mx-auto w-fit shadow-2xl bg-gradient-to-br from-primary to-primary/80">
                    <Lightbulb className="h-16 w-16 text-primary-foreground drop-shadow-2xl" />
                  </div>
                  <p className="text-xl mt-6 font-semibold text-primary">
                    Start a conversation about sustainable design
                  </p>
                  <p className="text-sm mt-3 text-muted-foreground">Use text or voice input below</p>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[80%] rounded-3xl px-5 py-4 shadow-xl transition-all duration-300 hover:scale-[1.02] ${
                      message.role === 'user'
                        ? 'shadow-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
                        : 'border-animate glass-card'
                    }`}
                  >
                    <p className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${message.role === 'user' ? 'font-medium drop-shadow-sm' : 'text-foreground/90'}`}>
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="glass-card rounded-3xl px-5 py-4 shadow-xl border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-primary to-eco-accent rounded-full animate-pulse shadow-lg" style={{ animationDelay: '0ms' }} />
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-eco-accent to-info rounded-full animate-pulse shadow-lg" style={{ animationDelay: '150ms' }} />
                        <div className="w-2.5 h-2.5 bg-gradient-to-r from-info to-primary rounded-full animate-pulse shadow-lg" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm text-muted-foreground/80">EcoPulse is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Generate Blueprint Button */}
          {messages.length > 0 && (
            <div className="px-6 py-4 border-t border-border/20 glass backdrop-blur-2xl">
              <Button 
                onClick={handleGenerateBlueprint}
                className="w-full shadow-2xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary hover:to-primary transition-all duration-300 hover:scale-[1.02] border-0 h-12 rounded-2xl font-semibold text-primary-foreground"
                variant="default"
              >
                <Home className="mr-2 h-5 w-5 drop-shadow-lg" />
                Generate House Blueprint
              </Button>
            </div>
          )}

          {/* Sample Prompts */}
          {messages.length === 0 && (
            <div className="px-6 pb-6 glass border-t border-border/20 backdrop-blur-2xl">
              <p className="text-sm text-primary mb-3 mt-4 font-semibold">💚 Sample Questions:</p>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleClick(sample)}
                    className="text-xs px-4 py-2 rounded-2xl glass hover:scale-105 text-foreground/90 transition-all duration-300 hover:shadow-lg border-border/20 hover:bg-primary/5"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-border/20 glass backdrop-blur-2xl">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="E.g., 'How can I design a more energy-efficient office space?'"
                  className="w-full min-h-[56px] max-h-[120px] px-5 py-4 rounded-2xl glass-input text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-300 focus:scale-[1.01] placeholder:text-muted-foreground/50 bg-card/80 text-foreground"
                  rows={1}
                />
              </div>
              
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant="outline"
                size="icon"
                className={`h-[56px] w-[56px] rounded-2xl hover:scale-105 transition-all duration-300 border-0 ${
                  isRecording ? 'border-animate-fast neon-glow bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground shadow-xl' : 'glass hover:bg-primary/10'
                }`}
                aria-label={isRecording ? "Stop recording" : "Start voice input"}
              >
                {isRecording ? (
                  <MicOff className="h-5 w-5 drop-shadow-lg" />
                ) : (
                  <Mic className="h-5 w-5 text-primary" />
                )}
              </Button>

              <Button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !prompt.trim()}
                size="icon"
                className="h-[56px] w-[56px] rounded-2xl shadow-2xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary hover:to-primary transition-all duration-300 hover:scale-105 border-0 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground"
                aria-label="Send message"
              >
                <Send className="h-5 w-5 drop-shadow-lg" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Design;
