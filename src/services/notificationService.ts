import { prisma } from '../prisma/client';

export interface NotificationData {
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  static async createNotification(userId: number, data: NotificationData): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId,
          title: data.title,
          content: data.content,
          metadata: data.metadata || {},
        },
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  static async createNotifications(userIds: number[], data: NotificationData): Promise<void> {
    try {
      const notifications = userIds.map((userId) => ({
        userId,
        title: data.title,
        content: data.content,
        metadata: data.metadata || {},
      }));

      await prisma.notification.createMany({
        data: notifications,
      });
    } catch (error) {
      console.error('Failed to create notifications:', error);
    }
  }

  static async getUsersByRole(role: string): Promise<number[]> {
    try {
      const users = await prisma.user.findMany({
        where: { role },
        select: { id: true },
      });
      return users.map((user) => user.id);
    } catch (error) {
      console.error('Failed to get users by role:', error);
      return [];
    }
  }

  static async getAdministrators(): Promise<number[]> {
    return this.getUsersByRole('administrator');
  }
}
