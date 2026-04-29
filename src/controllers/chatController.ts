import { Request, Response, NextFunction } from 'express';
import * as chatService from '../services/chatService';

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