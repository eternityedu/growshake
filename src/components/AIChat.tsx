import { useState, useRef, useEffect } from "react";
import { useAIChat } from "@/hooks/useAIChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Sparkles, 
  RefreshCw, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  Paperclip,
  X 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AIChatProps {
  type: "trending" | "health" | "farmer" | "admin";
  title: string;
  placeholder?: string;
  context?: Record<string, unknown>;
  initialMessage?: string;
}

interface Attachment {
  type: "image" | "file";
  name: string;
  url: string;
}

const AIChat = ({ type, title, placeholder, context, initialMessage }: AIChatProps) => {
  const { messages, isLoading, sendMessage, clearMessages } = useAIChat({ type, context });
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (initialMessage && !initialized.current && messages.length === 0) {
      initialized.current = true;
      sendMessage(initialMessage);
    }
  }, [initialMessage, messages.length, sendMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      let messageContent = input.trim();
      
      // Add attachment descriptions to the message
      if (attachments.length > 0) {
        const attachmentList = attachments.map(a => 
          a.type === "image" ? `[Attached Image: ${a.name}]` : `[Attached File: ${a.name}]`
        ).join("\n");
        messageContent = messageContent 
          ? `${messageContent}\n\n${attachmentList}` 
          : attachmentList;
      }
      
      sendMessage(messageContent);
      setInput("");
      setAttachments([]);
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
          stream.getTracks().forEach(track => track.stop());
          
          // For now, we'll show a message that voice was recorded
          // In a full implementation, you would send this to a speech-to-text service
          toast.info("Voice recording captured. Converting to text...");
          
          // Placeholder - in production, send to speech-to-text API
          setInput(prev => prev + " [Voice input recorded]");
        };

        mediaRecorder.start();
        setIsRecording(true);
        toast.info("Recording... Click mic again to stop");
      } catch (error) {
        console.error("Error accessing microphone:", error);
        toast.error("Could not access microphone. Please check permissions.");
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      const url = URL.createObjectURL(file);
      setAttachments(prev => [...prev, {
        type: "image",
        name: file.name,
        url
      }]);
    });

    e.target.value = "";
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      setAttachments(prev => [...prev, {
        type: "file",
        name: file.name,
        url
      }]);
    });

    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      URL.revokeObjectURL(newAttachments[index].url);
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  return (
    <Card className="h-[500px] flex flex-col border-primary/10">
      <CardHeader className="pb-3 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={clearMessages}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center p-4">
              <div>
                <Bot className="h-12 w-12 mx-auto text-primary/30 mb-3" />
                <p className="text-muted-foreground text-sm">
                  Ask me anything about {type === "health" ? "vegetable health benefits" : "vegetable trends"}!
                </p>
                <p className="text-muted-foreground text-xs mt-2">
                  You can use voice, upload images, or attach files
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="p-2 rounded-full bg-primary/10 h-fit">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 max-w-[80%]",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="p-2 rounded-full bg-primary h-fit">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3">
                  <div className="p-2 rounded-full bg-primary/10 h-fit">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-2xl px-4 py-2 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 border-t border-primary/10 flex gap-2 flex-wrap">
            {attachments.map((attachment, idx) => (
              <div 
                key={idx} 
                className="relative group bg-muted rounded-lg p-2 flex items-center gap-2"
              >
                {attachment.type === "image" ? (
                  <img 
                    src={attachment.url} 
                    alt={attachment.name} 
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-xs truncate max-w-[100px]">{attachment.name}</span>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="p-0.5 rounded-full bg-destructive/10 hover:bg-destructive/20 transition-colors"
                >
                  <X className="h-3 w-3 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 border-t border-primary/10">
          <div className="flex gap-2">
            {/* Voice Input */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleVoiceInput}
              className={cn(
                "flex-shrink-0",
                isRecording && "text-destructive animate-pulse"
              )}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>

            {/* Image Upload */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => imageInputRef.current?.click()}
              className="flex-shrink-0"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              multiple
            />

            {/* File Upload */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              multiple
            />

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder || "Type your message..."}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={isLoading || (!input.trim() && attachments.length === 0)} 
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AIChat;