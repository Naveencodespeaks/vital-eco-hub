import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Sparkles, Upload, Mic, MicOff, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Design = () => {
  const [prompt, setPrompt] = useState("");
  const [advice, setAdvice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
          
          // Send to edge function for transcription
          const { data, error } = await supabase.functions.invoke('voice_to_text', {
            body: { audio: base64Audio }
          });

          if (error) throw error;
          
          setPrompt((prev) => prev + " " + data.text);
          toast({
            title: "Voice recorded",
            description: "Your voice has been transcribed",
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

  const handleGetAdvice = async () => {
    if (!prompt.trim() && !selectedImage) {
      toast({
        title: "Error",
        description: "Please enter a design prompt or upload an image",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAdvice("");

    try {
      const body: any = { prompt };

      if (selectedImage) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          body.image = (reader.result as string).split(',')[1];
          
          const { data, error } = await supabase.functions.invoke('design_advisor', {
            body
          });

          if (error) throw error;

          setAdvice(data.advice || "No advice generated");

          toast({
            title: "Success",
            description: "Design advice generated!",
          });
          setIsLoading(false);
        };
        reader.readAsDataURL(selectedImage);
      } else {
        const { data, error } = await supabase.functions.invoke('design_advisor', {
          body
        });

        if (error) throw error;

        setAdvice(data.advice || "No advice generated");

        toast({
          title: "Success",
          description: "Design advice generated!",
        });
        setIsLoading(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-primary to-primary/70 rounded-xl">
            <Lightbulb className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Multimodal Eco Design Advisor</h1>
            <p className="text-muted-foreground">AI-powered sustainable design with text, image & voice</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Multimodal Design Input</CardTitle>
            <CardDescription>
              Describe your challenge using text, images, or voice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Text Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="E.g., 'How can I design a more energy-efficient office space?'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Image Upload (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={isRecording ? stopRecording : startRecording}
                  className="flex-1"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Voice Input
                    </>
                  )}
                </Button>
              </div>
            </div>

            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <Button 
              onClick={handleGetAdvice} 
              disabled={isLoading}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isLoading ? "Generating Advice..." : "Get Design Advice"}
            </Button>
          </CardContent>
        </Card>

        {advice && (
          <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Design Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                {advice}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-muted/50 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">💚 Sample Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Upload a photo of your room and ask for sustainable redesign ideas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Use voice to describe your energy-saving goals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>How can I maximize natural light in my living room?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>What are the best indoor plants for air purification?</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Design;
