// pages/student/MessagesPagePhase4.tsx
// Phase 4: Club & event chat rooms with real-time Socket.io messaging.
// Left panel = room list; right panel = ChatWindow.

import React, { useState } from 'react';
import { MessageSquare, Search, Users, Bell, Archive } from 'lucide-react';
import { cn } from '../../utils';
import { Avatar, Skeleton } from '../../components/ui';
import ChatWindow from '../../components/chat/ChatWindow';
import { useChatRooms, useChatRoom } from '../../hooks/useChat';
import type { ChatRoom } from '../../types/phase4';

// ── Room list item ─────────────────────────────────────────────────────────────
const RoomItem: React.FC<{
  room: ChatRoom;
  isActive: boolean;
  onClick: () => void;
}> = ({ room, isActive, onClick }) => {
  const Icon = room.type === 'announcement' ? Bell : room.type === 'event' ? Archive : MessageSquare;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 text-left',
        isActive
          ? 'bg-indigo-50 border border-indigo-100'
          : 'hover:bg-gray-50 border border-transparent'
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {room.avatarUrl ? (
          <img src={room.avatarUrl} className="w-10 h-10 rounded-xl object-cover" alt={room.name} />
        ) : (
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold',
            isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
          )}>
            <Icon size={16} />
          </div>
        )}
        {room.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center px-1">
            {room.unreadCount > 99 ? '99+' : room.unreadCount}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            'text-sm font-semibold truncate',
            isActive ? 'text-indigo-900' : 'text-gray-900'
          )}>
            {room.name}
          </p>
          {room.lastMessage && (
            <span className="text-[10px] text-gray-400 shrink-0">
              {new Date(room.lastMessage.timestamp).toLocaleTimeString('en-US', {
                hour: 'numeric', minute: '2-digit'
              })}
            </span>
          )}
        </div>
        {room.lastMessage ? (
          <p className="text-xs text-gray-500 truncate mt-0.5">
            <span className="font-medium">{room.lastMessage.senderName}:</span>{' '}
            {room.lastMessage.content}
          </p>
        ) : (
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <Users size={10} /> {room.memberCount} members
          </p>
        )}
      </div>
    </button>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const MessagesPagePhase4: React.FC = () => {
  const { rooms, loading, markRoomRead } = useChatRooms();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { messages, historyLoading, connected, typingUsers, sendMessage, emitTyping } =
    useChatRoom(activeRoomId);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null;

  const filtered = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    markRoomRead(roomId);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden">
      {/* ── Room sidebar ── */}
      <div className={cn(
        'w-full md:w-80 lg:w-96 shrink-0 bg-white border-r border-gray-100 flex flex-col',
        activeRoomId ? 'hidden md:flex' : 'flex'
      )}>
        {/* Sidebar header */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Messages</h2>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms…"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare size={32} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">
                {search ? 'No rooms match your search' : 'No chat rooms yet'}
              </p>
            </div>
          ) : (
            filtered.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={room.id === activeRoomId}
                onClick={() => handleSelectRoom(room.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Chat panel ── */}
      <div className={cn(
        'flex-1 min-w-0',
        !activeRoomId ? 'hidden md:flex' : 'flex'
      )}>
        {activeRoom ? (
          <ChatWindow
            room={activeRoom}
            messages={messages}
            historyLoading={historyLoading}
            connected={connected}
            typingUsers={typingUsers}
            onSend={sendMessage}
            onTyping={emitTyping}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Select a conversation</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Choose a club or event chat room from the left to start messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPagePhase4;
