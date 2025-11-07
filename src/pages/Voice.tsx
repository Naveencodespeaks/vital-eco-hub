import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Trash2, Volume2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function Voice() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
      } else {
        setUserId(user.id);
      }
    });
  }, [navigate]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Convert audio to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];

        if (!base64Audio) {
          throw new Error("Failed to convert audio");
        }

        // Transcribe audio
        const { data: transcriptData, error: transcriptError } = await supabase.functions.invoke(
          "voice_to_text",
          { body: { audio: base64Audio } }
        );

        if (transcriptError) throw transcriptError;

        const userMessage: Message = {
          role: "user",
          content: transcriptData.text,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);

        // Get AI response
        const conversationContext = [...messages, userMessage]
          .map(m => `${m.role}: ${m.content}`)
          .join("\n");

        const { data: aiData, error: aiError } = await supabase.functions.invoke(
          "eco_copilot",
          {
            body: {
              message: transcriptData.text,
              context: conversationContext,
            },
          }
        );

        if (aiError) throw aiError;

        const aiMessage: Message = {
          role: "assistant",
          content: aiData.reply,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);

        // Log conversation
        if (userId) {
          await supabase.from("agent_logs").insert({
            user_id: userId,
            ai_action: "voice_conversation",
            summary: `User: ${transcriptData.text}\nAI: ${aiData.reply}`,
          });
        }

        // Speak the response
        speakText(aiData.reply);
      };
    } catch (error: any) {
      console.error("Error processing audio:", error);
      toast({
        title: "Processing Error",
        description: error.message || "Failed to process audio",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast({
      title: "Chat Cleared",
      description: "Conversation history has been reset",
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
              <Mic className="h-8 w-8 text-primary" />
              AI Voice Copilot
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Talk to your Eco Copilot in real-time for personalized sustainability advice
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Conversation Area */}
            <Card className="bg-muted/50 border-border/50">
              <ScrollArea className="h-96 p-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center space-y-2">
                      <Volume2 className="h-12 w-12 mx-auto mb-4 text-primary/50" />
                      <p>Press the microphone to start talking</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-background text-foreground border border-border"
                          }`}
                        >
                          <p className="text-sm font-medium mb-1">
                            {msg.role === "user" ? "You" : "AI Copilot"}
                          </p>
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-2">
                            {msg.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>

            {/* Recording Controls */}
            <div className="flex flex-col items-center gap-4">
              {isProcessing && (
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Processing your message...</span>
                </div>
              )}

              <div className="flex gap-4">
                {!isRecording ? (
                  <Button
                    size="lg"
                    onClick={startRecording}
                    disabled={isProcessing}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-16 w-16 rounded-full"
                  >
                    <Mic className="h-6 w-6" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={stopRecording}
                    variant="destructive"
                    className="h-16 w-16 rounded-full animate-pulse"
                  >
                    <Square className="h-6 w-6" />
                  </Button>
                )}

                {messages.length > 0 && (
                  <Button
                    size="lg"
                    onClick={clearChat}
                    variant="outline"
                    className="h-16 w-16 rounded-full"
                  >
                    <Trash2 className="h-6 w-6" />
                  </Button>
                )}
              </div>

              <p className="text-sm text-muted-foreground text-center">
                {isRecording
                  ? "Recording... Click stop when finished"
                  : "Click the microphone to start recording"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
