import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ImageAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string>("");
  const [modifiedImage, setModifiedImage] = useState<string>("");
  const [textPrompt, setTextPrompt] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 20MB",
        variant: "destructive"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setResult("");
    setModifiedImage("");
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      reader.onload = async () => {
        const base64Image = reader.result as string;

        // Upload original image to storage
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('analyzed-images')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('analyzed-images')
          .getPublicUrl(fileName);

        // Analyze the image
        const { data, error } = await supabase.functions.invoke('analyze_image', {
          body: { imageData: base64Image }
        });

        if (error) {
          throw new Error(error.message || 'Failed to analyze image');
        }

        if (!data?.analysis) {
          throw new Error('No analysis returned from server');
        }
        
        setResult(data.analysis);
        let modifiedUrl = '';
        
        if (data.modifiedImage) {
          // Convert base64 to blob and upload modified image
          const modifiedBlob = await (await fetch(data.modifiedImage)).blob();
          const modifiedFileName = `${user.id}/${Date.now()}_modified.png`;
          
          const { error: modUploadError } = await supabase.storage
            .from('analyzed-images')
            .upload(modifiedFileName, modifiedBlob);

          if (!modUploadError) {
            const { data: { publicUrl: modPublicUrl } } = supabase.storage
              .from('analyzed-images')
              .getPublicUrl(modifiedFileName);
            modifiedUrl = modPublicUrl;
            setModifiedImage(data.modifiedImage);
          }
        }

        // Save analysis record
        await supabase.from('image_analyses').insert({
          user_id: user.id,
          original_image_url: publicUrl,
          modified_image_url: modifiedUrl,
          analysis_text: data.analysis
        });

        toast({
          title: "Analysis complete",
          description: "Image has been analyzed and saved successfully"
        });
      };
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!textPrompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description of the image you want to generate",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    setGeneratedImage("");
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze_image', {
        body: { 
          textPrompt: textPrompt.trim(),
          mode: 'generate'
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate image');
      }

      if (!data?.generatedImage) {
        throw new Error('No image was generated');
      }

      setGeneratedImage(data.generatedImage);

      // Upload generated image to storage
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const generatedBlob = await (await fetch(data.generatedImage)).blob();
        const fileName = `${user.id}/${Date.now()}_generated.png`;
        
        const { error: uploadError } = await supabase.storage
          .from('analyzed-images')
          .upload(fileName, generatedBlob);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('analyzed-images')
            .getPublicUrl(fileName);

          // Save generation record
          await supabase.from('image_analyses').insert({
            user_id: user.id,
            generated_image_url: publicUrl,
            prompt: textPrompt.trim()
          });
        }
      }

      toast({
        title: "Image generated",
        description: "Your image has been created and saved successfully"
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">AI Image Tools</h1>
          <p className="text-muted-foreground">Analyze uploaded images or generate new ones from text</p>
        </div>

        <Tabs defaultValue="analyze" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analyze">Analyze Image</TabsTrigger>
            <TabsTrigger value="generate">Generate Image</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analyze" className="space-y-6">
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Upload Image
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-upload">Select an image (max 20MB)</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  className="relative"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {selectedFile && (
                  <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
                )}
              </div>
            </div>

            {previewUrl && (
              <div className="border border-border rounded-lg p-4">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-w-full h-auto rounded-md mx-auto max-h-96 object-contain"
                />
              </div>
            )}

            <Button 
              onClick={handleAnalyze}
              disabled={!selectedFile || analyzing}
              className="w-full"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Analyze Image
                </>
              )}
            </Button>
          </CardContent>
            </Card>

            {result && (
          <>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle>Analysis Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground whitespace-pre-wrap">{result}</p>
                </div>
              </CardContent>
            </Card>

            {modifiedImage && (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle>Enhanced Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border border-border rounded-lg p-4">
                    <img 
                      src={modifiedImage} 
                      alt="Enhanced version" 
                      className="max-w-full h-auto rounded-md mx-auto max-h-96 object-contain"
                    />
                  </div>
                </CardContent>
              </Card>
              )}
            </>
          )}
          </TabsContent>

          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Generate Image from Text
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Describe the image you want to create</Label>
                  <Textarea
                    id="prompt"
                    placeholder="A modern minimalist bedroom with industrial aesthetic, featuring exposed concrete ceiling..."
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={!textPrompt.trim() || generating}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Image
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {generatedImage && (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <CardTitle>Generated Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border border-border rounded-lg p-4">
                    <img 
                      src={generatedImage} 
                      alt="Generated image" 
                      className="max-w-full h-auto rounded-md mx-auto"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
