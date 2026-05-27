import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import { logger } from '../../utils/logger.js';

const expo = new Expo();

export interface PushPayload {
  to: string; // expo push token
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotifications(payloads: PushPayload[]): Promise<ExpoPushTicket[]> {
  const messages: ExpoPushMessage[] = payloads
    .filter((p) => Expo.isExpoPushToken(p.to))
    .map((p) => ({
      to: p.to,
      sound: 'default',
      title: p.title,
      body: p.body,
      data: p.data ?? {},
      priority: 'high',
    }));

  if (messages.length === 0) return [];

  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (err) {
      logger.error({ err }, 'Failed to send Expo push notification batch');
    }
  }

  return tickets;
}
