import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AdminSidebar from '@/components/dashboard/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Send, FileText, Image, MessageCircle, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  sender_type: string;
  message: string;
  attachments: string[];
  created_at: string;
  is_read: boolean;
}

interface FarmerConversation {
  farmer_id: string;
  farm_name: string;
  verification_status: string;
  unread_count: number;
  last_message?: string;
  last_message_time?: string;
}

export default function AdminMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<FarmerConversation[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedFarmer) {
      fetchMessages(selectedFarmer);
      // Set up realtime subscription
      const channel = supabase
        .channel('admin_messages_admin')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'admin_messages',
            filter: `farmer_id=eq.${selectedFarmer}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
            // Mark as read if admin
            markAsRead(payload.new.id as string);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedFarmer]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      // Get all farmer profiles
      const { data: farmers, error: farmersError } = await supabase
        .from('farmer_profiles')
        .select('id, farm_name, verification_status');

      if (farmersError) throw farmersError;

      // Get messages for each farmer
      const conversationsData: FarmerConversation[] = [];

      for (const farmer of farmers || []) {
        const { data: messages } = await supabase
          .from('admin_messages')
          .select('id, message, created_at, is_read, sender_type')
          .eq('farmer_id', farmer.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const { count } = await supabase
          .from('admin_messages')
          .select('id', { count: 'exact', head: true })
          .eq('farmer_id', farmer.id)
          .eq('is_read', false)
          .eq('sender_type', 'farmer');

        conversationsData.push({
          farmer_id: farmer.id,
          farm_name: farmer.farm_name,
          verification_status: farmer.verification_status,
          unread_count: count || 0,
          last_message: messages?.[0]?.message,
          last_message_time: messages?.[0]?.created_at,
        });
      }

      // Sort by unread count and last message time
      conversationsData.sort((a, b) => {
        if (a.unread_count !== b.unread_count) {
          return b.unread_count - a.unread_count;
        }
        return new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime();
      });

      setConversations(conversationsData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (farmerId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark all as read
      const unreadIds = data?.filter(m => !m.is_read && m.sender_type === 'farmer').map(m => m.id) || [];
      for (const id of unreadIds) {
        await markAsRead(id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('admin_messages')
        .update({ is_read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFarmer || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from('admin_messages').insert({
        farmer_id: selectedFarmer,
        sender_type: 'admin',
        sender_id: user.id,
        message: newMessage.trim(),
        attachments: [],
      });

      if (error) throw error;
      setNewMessage('');
      fetchConversations(); // Refresh conversations
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const selectedConversation = conversations.find(c => c.farmer_id === selectedFarmer);

  if (loading) {
    return (
      <DashboardLayout sidebar={<AdminSidebar />}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Farmer Messages</h1>
          <p className="text-muted-foreground">
            Communicate with farmers about verification and support
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No conversations yet
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations.map((conv) => (
                      <button
                        key={conv.farmer_id}
                        onClick={() => setSelectedFarmer(conv.farmer_id)}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                          selectedFarmer === conv.farmer_id ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{conv.farm_name}</p>
                              {conv.unread_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conv.unread_count}
                                </Badge>
                              )}
                            </div>
                            <Badge
                              variant={
                                conv.verification_status === 'approved'
                                  ? 'default'
                                  : conv.verification_status === 'rejected'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className="text-xs mt-1"
                            >
                              {conv.verification_status}
                            </Badge>
                            {conv.last_message && (
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {conv.last_message}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2">
            {selectedFarmer ? (
              <>
                <CardHeader className="border-b bg-primary/5">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>{selectedConversation?.farm_name}</CardTitle>
                      <CardDescription>
                        Status: {selectedConversation?.verification_status}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px] p-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">No messages yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.sender_type === 'admin'
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
                                        msg.sender_type === 'admin' ? 'text-primary-foreground/80' : 'text-primary'
                                      }`}
                                    >
                                      {getFileIcon(url)}
                                      View Document {idx + 1}
                                    </a>
                                  ))}
                                </div>
                              )}
                              <p className={`text-xs mt-1 ${
                                msg.sender_type === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground'
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
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <MessageCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Select a conversation</p>
                <p className="text-sm text-muted-foreground">
                  Choose a farmer from the list to view messages
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
