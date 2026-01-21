import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import FarmerSidebar from '@/components/dashboard/FarmerSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Send, Upload, FileText, Image, MessageCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  sender_type: string;
  message: string;
  attachments: string[];
  created_at: string;
  is_read: boolean;
}

interface FarmerProfile {
  id: string;
  farm_name: string;
  verification_status: string;
}

export default function FarmerChat() {
  const { user } = useAuth();
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchFarmerProfile();
    }
  }, [user]);

  useEffect(() => {
    if (farmerProfile) {
      fetchMessages();
      // Set up realtime subscription
      const channel = supabase
        .channel('admin_messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'admin_messages',
            filter: `farmer_id=eq.${farmerProfile.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [farmerProfile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchFarmerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('farmer_profiles')
        .select('id, farm_name, verification_status')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setFarmerProfile(data);
    } catch (error) {
      console.error('Error fetching farmer profile:', error);
    }
  };

  const fetchMessages = async () => {
    if (!farmerProfile) return;

    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .eq('farmer_id', farmerProfile.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !farmerProfile || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from('admin_messages').insert({
        farmer_id: farmerProfile.id,
        sender_type: 'farmer',
        sender_id: user.id,
        message: newMessage.trim(),
        attachments: [],
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user || !farmerProfile) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('verification-docs')
          .upload(fileName, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('verification-docs')
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      }

      // Send message with attachments
      const { error } = await supabase.from('admin_messages').insert({
        farmer_id: farmerProfile.id,
        sender_type: 'farmer',
        sender_id: user.id,
        message: `Uploaded ${files.length} document(s) for verification`,
        attachments: uploadedUrls,
      });

      if (error) throw error;
      toast.success('Documents uploaded successfully');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <DashboardLayout sidebar={<FarmerSidebar />}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<FarmerSidebar />}>
      <div className="space-y-6 h-full">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chat with Admin</h1>
          <p className="text-muted-foreground">
            Message the admin for verification or support
          </p>
        </div>

        <Card className="border-primary/20">
          <CardHeader className="border-b bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Admin Support</CardTitle>
                  <CardDescription>
                    Verification Status: 
                    <span className={`ml-2 font-medium ${
                      farmerProfile?.verification_status === 'approved' 
                        ? 'text-green-600' 
                        : farmerProfile?.verification_status === 'rejected'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}>
                      {farmerProfile?.verification_status || 'pending'}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground">
                    Send a message or upload verification documents
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'farmer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender_type === 'farmer'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 text-xs underline ${
                                  msg.sender_type === 'farmer' ? 'text-primary-foreground/80' : 'text-primary'
                                }`}
                              >
                                {getFileIcon(url)}
                                View Document {idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                        <p className={`text-xs mt-1 ${
                          msg.sender_type === 'farmer' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="border-t p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  multiple
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" disabled={sending || !newMessage.trim()}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                Upload PDFs, images, or documents for verification
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
