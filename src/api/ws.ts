import { useToastStore } from '../stores/toastStore';
import { mapNotification } from './mappers';
import { useNotificationsStore } from '../stores/notificationsStore';

const WS_BASE = (import.meta.env.VITE_WS_BASE_URL as string) || 'ws://localhost:8080/api/v1';

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 1000;

export type WSIncomingMessage =
  | {
      type: 'message';
      id: string;
      sender_id: string;
      receiver_id: string;
      content: string;
      image_url?: string;
      created_at: string;
    }
  | {
      type: 'notification';
      data: {
        id: string;
        actor: import('./types').BackendUserProfile;
        type: string;
        reference_id: string;
        reference_type: string;
        is_read: boolean;
        created_at: string;
      };
    };

type MessageHandler = (msg: WSIncomingMessage) => void;

export class WSClient {
  private socket: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private token: string;
  private closedIntentionally = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(token: string) {
    this.token = token;
  }

  connect() {
    if (this.socket) return;
    this.closedIntentionally = false;
    this.socket = new WebSocket(`${WS_BASE}/ws?token=${encodeURIComponent(this.token)}`);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WSIncomingMessage;

        if (msg.type === 'notification') {
          const notification = mapNotification(msg.data);
          useNotificationsStore.getState().addNotification(notification);
        }

        this.handlers.forEach((h) => h(msg));
      } catch (err) {
        console.warn('[WS] Failed to parse message:', err);
      }
    };

    this.socket.onerror = () => {
      this.socket = null;
    };

    this.socket.onclose = () => {
      this.socket = null;
      if (!this.closedIntentionally) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      useToastStore.getState().addToast('Connection lost. Please refresh the page.', 'error');
      return;
    }

    const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    if (this.reconnectAttempts === 1) {
      useToastStore.getState().addToast('Connection lost. Reconnecting...', 'warning');
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  send(receiverId: string, content: string, imageUrl?: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(
      JSON.stringify({
        type: 'message',
        receiver_id: receiverId,
        content,
        image_url: imageUrl ?? '',
      }),
    );
  }

  onMessage(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect() {
    this.closedIntentionally = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
    this.handlers.clear();
    this.reconnectAttempts = 0;
  }
}
