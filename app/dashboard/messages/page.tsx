'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Image from 'next/image';
import { Send, Search, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  booking_id: string | null;
  read: boolean;
  created_at: string;
  sender_username: string;
  sender_artist_name: string;
  sender_avatar: string;
  recipient_username: string;
  recipient_artist_name: string;
  recipient_avatar: string;
};

type Conversation = {
  userId: string;
  username: string;
  artistName: string;
  avatar: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
};

type User = {
  id: string;
  username: string;
  artist_name: string;
  profile_image_url: string;
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchConversations();
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        handleNewMessage
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
    }
  }, [selectedUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewMessage = (payload: any) => {
    if (
      payload.new.sender_id === selectedUserId ||
      payload.new.recipient_id === selectedUserId
    ) {
      setMessages((prev) => [...prev, payload.new]);
    }
    fetchConversations();
  };

  async function fetchConversations() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: messages, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const conversationsMap = new Map<string, Conversation>();

      for (const message of messages) {
        const isUserSender = message.sender_id === user.id;
        const otherUserId = isUserSender
          ? message.recipient_id
          : message.sender_id;
        const otherUsername = isUserSender
          ? message.recipient_username
          : message.sender_username;
        const otherArtistName = isUserSender
          ? message.recipient_artist_name
          : message.sender_artist_name;
        const otherAvatar = isUserSender
          ? message.recipient_avatar
          : message.sender_avatar;

        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            userId: otherUserId,
            username: otherUsername,
            artistName: otherArtistName || otherUsername,
            avatar: otherAvatar,
            lastMessage: message.content,
            lastMessageDate: message.created_at,
            unreadCount: !message.read && !isUserSender ? 1 : 0,
          });
        }
      }

      setConversations(Array.from(conversationsMap.values()));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function searchUsers(query: string) {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, artist_name, profile_image_url')
      .or(`username.ilike.%${query}%,artist_name.ilike.%${query}%`)
      .limit(5);

    if (error) {
      console.error('Error searching users:', error);
      return;
    }

    setSearchResults(data || []);
  }

  async function startNewConversation(userId: string) {
    setSelectedUserId(userId);
    setIsSearching(false);
    setSearchResults([]);
  }

  async function fetchMessages(userId: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(messages);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('recipient_id', user.id)
        .eq('sender_id', userId);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedUserId) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: selectedUserId,
        content: newMessage,
      });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  }

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='flex h-[calc(100vh-4rem)]'>
      {/* Conversations Sidebar */}
      <div className='w-80 border-r border-zinc-800 flex flex-col'>
        <div className='p-4 border-b border-zinc-800'>
          <div className='flex items-center justify-between mb-4'>
            <div className='relative flex-1 mr-2'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
              <Input
                placeholder='Search conversations...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
            <Dialog open={isSearching} onOpenChange={setIsSearching}>
              <DialogTrigger asChild>
                <Button variant='outline' size='icon'>
                  <Plus className='h-4 w-4' />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Conversation</DialogTitle>
                </DialogHeader>
                <div className='mt-4'>
                  <Input
                    placeholder='Search for users...'
                    onChange={(e) => searchUsers(e.target.value)}
                  />
                  <ScrollArea className='h-[300px] mt-4'>
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className='flex items-center p-2 hover:bg-zinc-800 cursor-pointer rounded-lg'
                        onClick={() => startNewConversation(user.id)}
                      >
                        <Image
                          src={user.profile_image_url || '/placeholder.svg'}
                          alt={user.username}
                          width={40}
                          height={40}
                          className='rounded-full'
                        />
                        <div className='ml-3'>
                          <p className='font-medium text-white'>
                            {user.artist_name || user.username}
                          </p>
                          <p className='text-sm text-zinc-400'>
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <ScrollArea className='flex-1'>
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.userId}
              className={`p-4 cursor-pointer hover:bg-zinc-800 transition-colors ${
                selectedUserId === conversation.userId ? 'bg-zinc-800' : ''
              }`}
              onClick={() => setSelectedUserId(conversation.userId)}
            >
              <div className='flex items-center space-x-3'>
                <div className='relative'>
                  <Image
                    src={conversation.avatar || '/placeholder.svg'}
                    alt={conversation.username}
                    width={40}
                    height={40}
                    className='rounded-full'
                  />
                  {conversation.unreadCount > 0 && (
                    <div className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-medium text-white truncate'>
                    {conversation.artistName}
                  </p>
                  <p className='text-sm text-gray-400 truncate'>
                    {conversation.lastMessage}
                  </p>
                </div>
                <div className='text-xs text-gray-500'>
                  {format(new Date(conversation.lastMessageDate), 'MMM d')}
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className='flex-1 flex flex-col'>
        {selectedUserId ? (
          <>
            {/* Messages Header */}
            <div className='p-4 border-b border-zinc-800'>
              {
                conversations.find((c) => c.userId === selectedUserId)
                  ?.artistName
              }
            </div>

            {/* Messages List */}
            <ScrollArea className='flex-1 p-4'>
              <div className='space-y-4'>
                {messages.map((message) => {
                  const isSender = message.sender_id === selectedUserId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isSender ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isSender ? 'bg-zinc-800' : 'bg-red-600'
                        }`}
                      >
                        <p className='text-white'>{message.content}</p>
                        <p className='text-xs text-gray-400 mt-1'>
                          {format(new Date(message.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className='p-4 border-t border-zinc-800'>
              <div className='flex space-x-2'>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder='Type a message...'
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage}>
                  <Send className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className='flex-1 flex items-center justify-center text-gray-500'>
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}