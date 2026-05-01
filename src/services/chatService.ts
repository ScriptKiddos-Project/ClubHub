import prisma from '../config/database';
import { getIO } from '../config/socket';
import { RoomType } from '@prisma/client';

export const getOrCreateChatRoom = async (type: RoomType, refId: string) => {
  return prisma.chatRoom.upsert({
    where: { type_ref_id: { type, ref_id: refId } }, // matches @@unique([type, ref_id])
    create: { type, ref_id: refId },
    update: {},
  });
};

export const saveMessage = async (
  roomId: string,
  senderId: string,
  content: string,
  isAnnouncement = false
) => {
  return prisma.chatMessage.create({
    data: {
      room_id: roomId,
      sender_id: senderId,
      content,
      is_announcement: isAnnouncement,
    },
    include: {
      sender: { select: { id: true, name: true } },
    },
  });
};

export const getRoomMessages = async (roomId: string, cursor?: string, limit = 30) => {
  return prisma.chatMessage.findMany({
    where: { room_id: roomId },
    orderBy: { created_at: 'desc' },
    take: limit,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: {
      sender: { select: { id: true, name: true } },
    },
  });
};

export const archiveEventRoom = async (eventId: string) => {
  return prisma.chatRoom.updateMany({
    where: { type: 'event', ref_id: eventId },
    data: { is_archived: true },
  });
};

export const broadcastAnnouncement = async (
  clubId: string,
  postedBy: string,
  title: string,
  body: string
) => {
  // Persist announcement record
  const announcement = await prisma.announcement.create({
    data: { club_id: clubId, posted_by: postedBy, title, body },
    include: { author: { select: { id: true, name: true } } },
  });

  // Notify all club members via socket
  const members = await prisma.userClub.findMany({
    where: { club_id: clubId },
    select: { user_id: true },
  });

  const io = getIO();
  members.forEach(({ user_id }) => {
    io.of('/notifications').to(`user:${user_id}`).emit('announcement', announcement);
  });

  // Also post to club chat room as a pinned message
  const room = await getOrCreateChatRoom('club', clubId);
  const message = await saveMessage(room.id, postedBy, `📢 ${title}: ${body}`, true);
  io.of('/club-chat').to(`club:${clubId}`).emit('new_message', {
    ...message,
    senderName: announcement.author.name,
  });

  return announcement;
};

export const getAnnouncements = async (clubId: string) => {
  return prisma.announcement.findMany({
    where: { club_id: clubId },
    orderBy: { created_at: 'desc' },
    include: { author: { select: { id: true, name: true } } },
  });
};

export const getUserChatRooms = async (userId: string) => {
  return prisma.chatRoom.findMany({
    where: {
      is_archived: false,
      // rooms where user is a member of the club
      OR: [
        {
          type: 'club',
          ref_id: {
            in: (await prisma.userClub.findMany({
              where: { user_id: userId },
              select: { club_id: true },
            })).map(uc => uc.club_id),
          },
        },
        { type: 'event' }, // adjust based on your event membership logic
      ],
    },
    orderBy: { created_at: 'desc' },
  });
};