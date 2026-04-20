import React, { useState } from 'react';
import { Search, Phone, MoreVertical, Send, Plus, Smile, AlertTriangle, AtSign, Zap } from 'lucide-react';
import { Avatar, Badge, Card } from '../../components/ui';
import { cn } from '../../utils';

const MOCK_ROOMS = [
  { id: '1', name: 'Photography Club', type: 'club' as const, memberCount: 42, isOnline: true, lastMessage: { content: 'Alex: Just uploaded the gala photos! 📷', timestamp: '12:45 PM', isRead: false } },
  { id: '2', name: 'Music Fest 2024', type: 'event' as const, memberCount: 120, isOnline: false, lastMessage: { content: 'The lineup has been finalized for the m...', timestamp: 'Yesterday', isRead: true } },
  { id: '3', name: 'Marcus Chen', type: 'dm' as const, memberCount: 1, isOnline: true, lastMessage: { content: 'Hey, did you see the update on the bu...', timestamp: 'Tue', isRead: true } },
];

const MOCK_MESSAGES = [
  { id: '1', senderId: 'other', sender: { name: 'Sarah Miller' }, content: "Hey everyone! Don't forget the workshop starts at 5 PM in the Main Hall.", timestamp: '12:30 PM', isRead: true },
  { id: '2', senderId: 'alex', sender: { name: 'Alex Rivera' }, content: 'Just uploaded the gala photos! 📷 Check out these previews.', timestamp: '12:45 PM', isRead: true, imageUrl: 'https://via.placeholder.com/300x200' },
];

const RECENT_UPDATES = [
  { id: '1', type: 'alert', icon: <AlertTriangle size={14} className="text-red-600"/>, iconBg: 'bg-red-100', title: 'High Priority Alert', desc: "Room change for 'Debate Club' meeting to Hall B.", time: '2 mins ago' },
  { id: '2', type: 'mention', icon: <AtSign size={14} className="text-indigo-600"/>, iconBg: 'bg-indigo-100', title: 'Mentioned by Marcus', desc: '"Hey @User, can you review the latest flyers?"', time: '1 hour ago' },
  { id: '3', type: 'suggestion', icon: <Zap size={14} className="text-purple-600"/>, iconBg: 'bg-purple-100', title: 'New Club Recommendation', desc: "Based on your interests: 'AI Explorers' just launched.", time: '3 hours ago' },
];

const MessagesPage: React.FC = () => {
  const [activeRoom, setActiveRoom] = useState(MOCK_ROOMS[0]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [message, setMessage] = useState('');

  const filters = ['ALL', 'CLUBS', 'EVENTS', 'DMS'];

  return (
    <div className="flex h-full bg-gray-50">
      {/* Rooms sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Messages</h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input placeholder="Search clubs, events or names..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1 px-4 py-2 border-b border-gray-50">
          {filters.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={cn('px-3 py-1 rounded-full text-xs font-semibold transition-all', activeFilter === f ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100')}>
              {f}
            </button>
          ))}
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {MOCK_ROOMS.map((room) => (
            <button key={room.id} onClick={() => setActiveRoom(room)}
              className={cn('w-full px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left', activeRoom.id === room.id && 'bg-indigo-50')}>
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {room.name[0]}
                </div>
                {room.isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900 text-sm truncate">{room.name}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{room.lastMessage?.timestamp}</span>
                </div>
                <p className={cn('text-xs mt-0.5 truncate', room.lastMessage?.isRead ? 'text-gray-500' : 'text-gray-900 font-medium')}>{room.lastMessage?.content}</p>
              </div>
              {!room.lastMessage?.isRead && <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0"/>}
            </button>
          ))}
        </div>
      </aside>

      {/* Chat window */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">{activeRoom.name[0]}</div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{activeRoom.name}</p>
            <p className="text-xs text-green-500 font-medium">● {activeRoom.memberCount} Members Online</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><Search size={17}/></button>
            <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><Phone size={17}/></button>
            <button className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><MoreVertical size={17}/></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex justify-center">
            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">TODAY</span>
          </div>
          {MOCK_MESSAGES.map((msg) => (
            <div key={msg.id} className="space-y-1">
              <div className="flex items-end gap-2.5 max-w-lg">
                <Avatar name={msg.sender.name} size="sm" className="flex-shrink-0"/>
                <div>
                  <p className="text-xs text-gray-400 mb-1 ml-1">{msg.sender.name}</p>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <p className="text-sm text-gray-800">{msg.content}</p>
                    {msg.imageUrl && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="h-32 bg-gray-200 rounded-xl overflow-hidden"><div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400"/></div>
                        <div className="h-32 bg-gray-200 rounded-xl overflow-hidden"><div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-500"/></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 ml-1">{msg.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message input */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-2.5">
            <button className="text-gray-400 hover:text-indigo-600 transition-colors"><Plus size={20}/></button>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
              onKeyDown={(e) => { if (e.key === 'Enter' && message.trim()) setMessage(''); }}
            />
            <button className="text-gray-400 hover:text-amber-500 transition-colors"><Smile size={20}/></button>
            <button
              onClick={() => message.trim() && setMessage('')}
              className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors"
            >
              <Send size={15} className="text-white"/>
            </button>
          </div>
        </div>
      </div>

      {/* Activity Glass sidebar */}
      <aside className="hidden xl:flex w-72 bg-white border-l border-gray-100 flex-col p-4 flex-shrink-0">
        <h3 className="font-bold text-gray-900 mb-4">Activity Glass</h3>
        {/* Upcoming event */}
        <div className="bg-indigo-50 rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Upcoming</p>
          <h4 className="font-bold text-gray-900 text-sm">Golden Hour Photo Walk</h4>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">🕐 Today, 5:30 PM</p>
          <div className="mt-2 flex -space-x-1">
            {['A', 'B', 'C'].map((l, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-indigo-200 border-2 border-white flex items-center justify-center text-indigo-700 text-xs font-bold">{l}</div>
            ))}
            <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-500 text-xs font-bold">+8</div>
          </div>
        </div>

        {/* Recent updates */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-700 text-sm">Recent Updates</h4>
          <button className="text-xs text-indigo-600 font-medium hover:underline">Clear All</button>
        </div>
        <div className="space-y-3">
          {RECENT_UPDATES.map((u) => (
            <div key={u.id} className="flex items-start gap-3">
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', u.iconBg)}>{u.icon}</div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900">{u.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{u.desc}</p>
                <p className="text-xs text-gray-400 mt-0.5">{u.time}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default MessagesPage;
