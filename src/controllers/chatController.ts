import { Request, Response, NextFunction } from 'express';
import * as chatService from '../services/chatService';
import prisma from '../config/database';

export const getChatRooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const userClubs = await prisma.userClub.findMany({
      where: { user_id: userId },
      include: { club: true },
    });

    // Get or create chat rooms for each club
    const rooms = await Promise.all(
      userClubs.map(async ({ club }) => {
        const chatRoom = await prisma.chatRoom.upsert({
          where: { type_ref_id: { type: 'club', ref_id: club.id } },
          create: { type: 'club', ref_id: club.id },
          update: {},
        });

        return {
          id: chatRoom.id,        // ← actual chat_rooms.id for message queries
          name: club.name,
          type: 'club' as const,
          entityId: club.id,      // ← club id for reference
          avatarUrl: club.logo_url ?? undefined,
          memberCount: club.member_count,
          isArchived: chatRoom.is_archived,
          unreadCount: 0,
          lastMessage: undefined,
        };
      })
    );

    res.json({ success: true, data: rooms });
  } catch (err) {
    next(err);
  }
};

export const getRoomHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const messages = await chatService.getRoomMessages(roomId, undefined, limit);
    
    // Shape to match frontend ChatMessage type
    const shaped = messages.map((m) => ({
      id: m.id,
      roomId: m.room_id,
      senderId: m.sender_id,
      senderName: (m.sender as { name: string }).name,
      content: m.content,
      timestamp: m.created_at.toISOString(), // ← frontend expects "timestamp" not "created_at"
      isOwn: false, // set client-side
    }));

    res.json({ success: true, data: shaped.reverse() });
  } catch (err) {
    next(err);
  }
};

export const getClubMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await chatService.getOrCreateChatRoom('club', req.params.clubId);
    const messages = await chatService.getRoomMessages(room.id, req.query.cursor as string);
    res.json({ success: true, data: messages.reverse() });
  } catch (err) {
    next(err);
  }
};

export const getEventMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await chatService.getOrCreateChatRoom('event', req.params.eventId);
    const messages = await chatService.getRoomMessages(room.id, req.query.cursor as string);
    res.json({ success: true, data: messages.reverse() });
  } catch (err) {
    next(err);
  }
};

export const postAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, body } = req.body;
    const userId = req.user!.id;// JwtPayload uses userId
    const announcement = await chatService.broadcastAnnouncement(
      req.params.clubId,
      userId,
      title,
      body
    );
    res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    next(err);
  }
};

export const getAnnouncements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const announcements = await chatService.getAnnouncements(req.params.clubId);
    res.json({ success: true, data: announcements });
  } catch (err) {
    next(err);
  }
};