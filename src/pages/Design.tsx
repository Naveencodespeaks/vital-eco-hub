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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="text-lg font-semibold">
                Welcome to Eco Design Advisor
              </DialogTitle>
            </div>
            <DialogDescription className="text-left space-y-3 pt-3">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Ask Anything</p>
                    <p className="text-xs text-muted-foreground">Get AI-powered advice on sustainable design and energy efficiency.</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Use Voice Input</p>
                    <p className="text-xs text-muted-foreground">Click the microphone icon to speak your questions.</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Generate Blueprints</p>
                    <p className="text-xs text-muted-foreground">Create sustainable home designs after chatting.</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lightbulb className="h-3 w-3 text-primary" />
                  Try the sample questions to get started
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="pt-3">
            <Button 
              onClick={handleCloseWelcome} 
              className="w-full"
            >
              Get Started
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8 max-w-5xl h-[calc(100vh-8rem)]">
        <Card className="h-full flex flex-col border overflow-hidden bg-card">
          {/* Top Right Actions */}
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
            <Button
              onClick={() => navigate('/bills')}
              variant="ghost"
              size="icon"
              aria-label="Go to Bills"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="icon"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Header */}
          <div className="flex items-center gap-4 p-4 border-b bg-background">
            <div className="p-2 bg-primary/10">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Eco Design Advisor
              </h1>
              <p className="text-sm text-muted-foreground">AI-powered sustainable design chat</p>
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  <div className="p-4 mx-auto w-fit bg-muted">
                    <Lightbulb className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-lg mt-6 font-medium text-foreground">
                    Start a conversation about sustainable design
                  </p>
                  <p className="text-sm mt-2 text-muted-foreground">Use text or voice input below</p>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Generate Blueprint Button */}
          {messages.length > 0 && (
            <div className="px-4 py-3 border-t bg-background">
              <Button 
                onClick={handleGenerateBlueprint}
                className="w-full"
                variant="default"
              >
                <Home className="mr-2 h-4 w-4" />
                Generate House Blueprint
              </Button>
            </div>
          )}

          {/* Sample Prompts */}
          {messages.length === 0 && (
            <div className="px-4 pb-4 border-t bg-background">
              <p className="text-sm text-foreground font-medium mb-2 mt-3">Sample Questions:</p>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleClick(sample)}
                    className="text-xs px-3 py-1.5 bg-muted hover:bg-accent text-foreground border"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t bg-background">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your question here..."
                  className="w-full min-h-[44px] max-h-[120px] px-3 py-2 border bg-background text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
                  rows={1}
                />
              </div>
              
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant="outline"
                size="icon"
                className={`h-[44px] w-[44px] ${
                  isRecording ? 'bg-destructive text-destructive-foreground' : ''
                }`}
                aria-label={isRecording ? "Stop recording" : "Start voice input"}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>

              <Button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !prompt.trim()}
                size="icon"
                className="h-[44px] w-[44px]"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Design;
