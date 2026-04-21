/**
 * Real-Time Collaboration Service
 * Handles real-time synchronization of canvas state across users
 */

import { supabase } from '@/lib/supabase';
import { DrawingObject } from '@/types';
import { useStore } from '@/store/store';

export interface CollaborationEvent {
  type: 'add_object' | 'update_object' | 'remove_object' | 'clear_layer' | 'add_layer' | 'remove_layer';
  projectId: string;
  userId: string;
  data: any;
  timestamp: number;
}

class CollaborationService {
  private projectId: string | null = null;
  private userId: string | null = null;
  private channel: any = null;
  private isConnected = false;

  /**
   * Initialize collaboration for a project
   */
  async initialize(projectId: string, userId: string): Promise<void> {
    // Prevent multiple initializations
    if (this.isConnected || (this.projectId === projectId && this.userId === userId)) {
      console.log('Collaboration already initialized');
      return;
    }

    // Clean up any existing connection
    if (this.channel) {
      await this.disconnect();
    }

    this.projectId = projectId;
    this.userId = userId;

    try {
      // Join the project channel
      this.channel = supabase.channel(`project-${projectId}`);

      // Listen for presence changes (users joining/leaving)
      this.channel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = this.channel.presenceState();
          console.log('Presence state:', presenceState);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }: { key: string; newPresences: any[] }) => {
          console.log('User joined:', key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }: { key: string; leftPresences: any[] }) => {
          console.log('User left:', key, leftPresences);
        })
        .on('broadcast', { event: 'canvas_update' }, (payload: any) => {
          this.handleCanvasUpdate(payload);
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            console.log('Connected to collaboration channel');

            // Track presence
            await this.channel.track({
              user_id: userId,
              online_at: new Date().toISOString(),
            });
          }
        });

    } catch (error) {
      console.error('Failed to initialize collaboration:', error);
      throw error;
    }
  }

  /**
   * Handle incoming canvas updates from other users
   */
  private handleCanvasUpdate(payload: any): void {
    const { event, userId: senderId } = payload;

    // Ignore our own events
    if (senderId === this.userId) return;

    const state = useStore.getState();

    switch (event.type) {
      case 'add_object':
        state.addObjectToLayer(event.data);
        break;
      case 'update_object':
        state.updateObjectInLayer(event.data.objectId, event.data.updates);
        break;
      case 'remove_object':
        state.removeObject(event.data.objectId);
        break;
      case 'clear_layer':
        state.clearLayer(event.data.layerId);
        break;
      case 'add_layer':
        state.addLayer(event.data.name);
        break;
      case 'remove_layer':
        state.removeLayer(event.data.layerId);
        break;
    }
  }

  /**
   * Broadcast a canvas event to other users
   */
  async broadcastEvent(event: Omit<CollaborationEvent, 'projectId' | 'userId' | 'timestamp'>): Promise<void> {
    if (!this.isConnected || !this.channel || !this.projectId || !this.userId) {
      return;
    }

    try {
      const fullEvent: CollaborationEvent = {
        ...event,
        projectId: this.projectId,
        userId: this.userId,
        timestamp: Date.now(),
      };

      await this.channel.send({
        type: 'broadcast',
        event: 'canvas_update',
        payload: { event: fullEvent, userId: this.userId },
      });
    } catch (error) {
      console.error('Failed to broadcast event:', error);
    }
  }

  /**
   * Send object addition event
   */
  async addObject(object: DrawingObject): Promise<void> {
    await this.broadcastEvent({
      type: 'add_object',
      data: object,
    });
  }

  /**
   * Send object update event
   */
  async updateObject(objectId: string, updates: Partial<DrawingObject>): Promise<void> {
    await this.broadcastEvent({
      type: 'update_object',
      data: { objectId, updates },
    });
  }

  /**
   * Send object removal event
   */
  async removeObject(objectId: string): Promise<void> {
    await this.broadcastEvent({
      type: 'remove_object',
      data: { objectId },
    });
  }

  /**
   * Send layer clear event
   */
  async clearLayer(layerId: string): Promise<void> {
    await this.broadcastEvent({
      type: 'clear_layer',
      data: { layerId },
    });
  }

  /**
   * Send layer addition event
   */
  async addLayer(name: string): Promise<void> {
    await this.broadcastEvent({
      type: 'add_layer',
      data: { name },
    });
  }

  /**
   * Send layer removal event
   */
  async removeLayer(layerId: string): Promise<void> {
    await this.broadcastEvent({
      type: 'remove_layer',
      data: { layerId },
    });
  }

  /**
   * Get list of online users
   */
  getOnlineUsers(): string[] {
    if (!this.channel) return [];

    const presenceState = this.channel.presenceState();
    return Object.keys(presenceState);
  }

  /**
   * Disconnect from collaboration
   */
  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.untrack();
      await supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.isConnected = false;
    this.projectId = null;
    this.userId = null;
  }

  /**
   * Check if collaboration is active
   */
  isActive(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();