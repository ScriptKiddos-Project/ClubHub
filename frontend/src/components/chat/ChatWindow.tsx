// components/chat/ChatWindow.tsx
// Real-time chat window: virtual-scrolled message list, typing indicators,
// connection badge, and message input. Used inside MessagesPagePhase4.

import React, { useEffect, useRef, useState } from 'react';
import { Send, Wifi, WifiOff, Loader2, Archive, Megaphone } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '../../utils';
import { Avatar } from '../ui';
import type { ChatMessage, ChatRoom } from '../../types/phase4';

// ── Timestamp formatter ───────────────────────────────────────────────────────
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

// ── Single message bubble ─────────────────────────────────────────────────────
const MessageBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  if (msg.isDeleted) {
    return (
      <div className={cn('flex gap-2.5 max-w-lg', msg.isOwn && 'flex-row-reverse ml-auto')}>
        <div className="px-4 py-2.5 rounded-2xl bg-gray-100 text-gray-400 italic text-sm">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-end gap-2.5', msg.isOwn ? 'flex-row-reverse ml-auto max-w-[70%]' : 'max-w-[70%]')}>
      {!msg.isOwn && (
        <Avatar name={msg.senderName} src={msg.senderAvatar} size="sm" className="shrink-0 mb-1" />
      )}
      <div className="flex flex-col gap-1">
        {!msg.isOwn && (
          <span className="text-xs text-gray-400 font-medium ml-1">{msg.senderName}</span>
        )}
        {/* Reply preview */}
        {msg.replyTo && (
          <div className={cn(
            'px-3 py-1.5 rounded-xl text-xs border-l-4 mb-1',
            msg.isOwn
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
              : 'bg-gray-100 border-gray-300 text-gray-600'
          )}>
            <p className="font-semibold">{msg.replyTo.senderName}</p>
            <p className="truncate">{msg.replyTo.contentPreview}</p>
          </div>
        )}
        <div className={cn(
          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
          msg.isOwn
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-sm'
        )}>
          {msg.content}
        </div>
        <span className={cn(
          'text-[10px] text-gray-400 mt-0.5',
          msg.isOwn ? 'text-right mr-1' : 'ml-1'
        )}>
          {fmtTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
};

// ── Typing indicator ──────────────────────────────────────────────────────────
const TypingIndicator: React.FC<{ names: string[] }> = ({ names }) => {
  if (names.length === 0) return null;
  const label = names.length === 1 ? `${names[0]} is typing` : `${names.join(', ')} are typing`;
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-gray-400">
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
      {label}…
    </div>
  );
};

// ── Message input ─────────────────────────────────────────────────────────────
interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping: () => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, onTyping, disabled }) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="p-4 bg-white border-t border-gray-100 shrink-0">
      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent transition-all">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => { setText(e.target.value); onTyping(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={disabled ? 'Chat archived — read only' : 'Type a message…'}
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
        >
          <Send size={15} className="text-white" />
        </button>
      </div>
    </div>
  );
};

// ── Main ChatWindow ───────────────────────────────────────────────────────────
interface ChatWindowProps {
  room: ChatRoom;
  messages: ChatMessage[];
  historyLoading: boolean;
  connected: boolean;
  typingUsers: string[];
  onSend: (content: string) => void;
  onTyping: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  room,
  messages,
  historyLoading,
  connected,
  typingUsers,
  onSend,
  onTyping,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Virtual list
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 8,
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const isArchived = room.isArchived;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
          {room.type === 'announcement' ? <Megaphone size={16} /> : room.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-gray-900 text-sm truncate">{room.name}</p>
            {isArchived && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                <Archive size={9} /> Archived
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn('w-1.5 h-1.5 rounded-full', connected ? 'bg-green-400' : 'bg-gray-300')} />
            <p className="text-xs text-gray-500">
              {connected ? `${room.memberCount} members` : 'Reconnecting…'}
            </p>
          </div>
        </div>
        {/* Connection status icon */}
        <div title={connected ? 'Connected' : 'Offline'}>
          {connected
            ? <Wifi size={16} className="text-green-400" />
            : <WifiOff size={16} className="text-gray-300 animate-pulse" />
          }
        </div>
      </div>

      {/* Message list (virtualised) */}
      {historyLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={22} className="animate-spin text-indigo-400" />
        </div>
      ) : (
        <div ref={parentRef} className="flex-1 overflow-y-auto px-4 py-4">
          <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const msg = messages[virtualRow.index];
              const prevMsg = messages[virtualRow.index - 1];
              const showDateSep =
                virtualRow.index === 0 ||
                new Date(msg.timestamp).toDateString() !==
                  new Date(prevMsg.timestamp).toDateString();

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {showDateSep && (
                    <div className="flex justify-center my-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                        {new Date(msg.timestamp).toLocaleDateString('en-US', {
                          weekday: 'long', month: 'short', day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  <div className="py-1">
                    <MessageBubble msg={msg} />
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={bottomRef} />
        </div>
      )}

      {/* Typing indicator */}
      <TypingIndicator names={typingUsers} />

      {/* Input */}
      <MessageInput onSend={onSend} onTyping={onTyping} disabled={isArchived} />
    </div>
  );
};

export default ChatWindow;