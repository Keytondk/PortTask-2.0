'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/lib/auth';

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL || 'ws://localhost:8084/ws';

// Event types from the realtime service
export type EventType =
  | 'port_call:created'
  | 'port_call:updated'
  | 'port_call:status_changed'
  | 'port_call:deleted'
  | 'vessel:position_updated'
  | 'vessel:created'
  | 'vessel:updated'
  | 'service:created'
  | 'service:updated'
  | 'service:status_changed'
  | 'rfq:created'
  | 'rfq:updated'
  | 'rfq:published'
  | 'rfq:closed'
  | 'rfq:awarded'
  | 'rfq:quote_received'
  | 'rfq:quote_withdrawn'
  | 'notification:new'
  | 'notification:read'
  | 'system:heartbeat'
  | 'system:error';

export interface RealtimeEvent {
  id: string;
  type: EventType;
  timestamp: string;
  data: unknown;
  organization_id?: string;
  workspace_id?: string;
  entity_id?: string;
  entity_type?: string;
}

interface ServerMessage {
  type: 'event' | 'subscribed' | 'unsubscribed' | 'error' | 'heartbeat' | 'connected';
  event?: RealtimeEvent;
  channel?: string;
  error?: string;
  data?: unknown;
}

type EventHandler = (event: RealtimeEvent) => void;

interface UseRealtimeOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const {
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
  } = options;

  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventHandlers = useRef<Map<EventType | '*', Set<EventHandler>>>(new Map());
  const subscriptions = useRef<Set<string>>(new Set());

  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (!isAuthenticated || !user) return;

    const token = authService.getAccessToken();
    const url = new URL(REALTIME_URL);
    if (token) {
      url.searchParams.set('token', token);
    }
    url.searchParams.set('user_id', user.id);
    url.searchParams.set('organization_id', user.organization_id);
    url.searchParams.set('workspace_id', user.workspace_id);

    const ws = new WebSocket(url.toString());

    ws.onopen = () => {
      console.log('[Realtime] Connected');
      setIsConnected(true);
      setLastError(null);
      reconnectAttempts.current = 0;

      // Re-subscribe to previously subscribed channels
      subscriptions.current.forEach((channel) => {
        ws.send(JSON.stringify({ type: 'subscribe', channel }));
      });
    };

    ws.onclose = (event) => {
      console.log('[Realtime] Disconnected', event.code, event.reason);
      setIsConnected(false);
      wsRef.current = null;

      // Attempt reconnection
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          console.log(
            `[Realtime] Reconnecting... (attempt ${reconnectAttempts.current})`
          );
          connect();
        }, reconnectInterval);
      }
    };

    ws.onerror = (error) => {
      console.error('[Realtime] Error', error);
      setLastError('Connection error');
    };

    ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (err) {
        console.error('[Realtime] Failed to parse message', err);
      }
    };

    wsRef.current = ws;
  }, [isAuthenticated, user, reconnectInterval, maxReconnectAttempts]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Auto-invalidate React Query cache based on event type
  const invalidateQueriesForEvent = useCallback(
    (event: RealtimeEvent) => {
      const type = event.type;

      if (type.startsWith('port_call:')) {
        queryClient.invalidateQueries({ queryKey: ['port-calls'] });
        if (event.entity_id) {
          queryClient.invalidateQueries({ queryKey: ['port-call', event.entity_id] });
        }
      }

      if (type.startsWith('vessel:')) {
        queryClient.invalidateQueries({ queryKey: ['vessels'] });
        queryClient.invalidateQueries({ queryKey: ['fleet-positions'] });
        if (event.entity_id) {
          queryClient.invalidateQueries({ queryKey: ['vessel', event.entity_id] });
        }
      }

      if (type.startsWith('service:')) {
        queryClient.invalidateQueries({ queryKey: ['service-orders'] });
        if (event.entity_id) {
          queryClient.invalidateQueries({
            queryKey: ['service-order', event.entity_id],
          });
        }
      }

      if (type.startsWith('rfq:')) {
        queryClient.invalidateQueries({ queryKey: ['rfqs'] });
        if (event.entity_id) {
          queryClient.invalidateQueries({ queryKey: ['rfq', event.entity_id] });
          queryClient.invalidateQueries({
            queryKey: ['rfq-comparison', event.entity_id],
          });
        }
      }

      if (type.startsWith('notification:')) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    },
    [queryClient]
  );

  // Handle a single event
  const handleEvent = useCallback(
    (event: RealtimeEvent) => {
      // Call specific event handlers
      const handlers = eventHandlers.current.get(event.type);
      handlers?.forEach((handler) => handler(event));

      // Call wildcard handlers
      const wildcardHandlers = eventHandlers.current.get('*');
      wildcardHandlers?.forEach((handler) => handler(event));

      // Auto-invalidate relevant queries
      invalidateQueriesForEvent(event);
    },
    [invalidateQueriesForEvent]
  );

  // Handle incoming messages
  const handleMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.type) {
        case 'event':
          if (message.event) {
            handleEvent(message.event);
          }
          break;
        case 'subscribed':
          console.log('[Realtime] Subscribed to', message.channel);
          break;
        case 'unsubscribed':
          console.log('[Realtime] Unsubscribed from', message.channel);
          break;
        case 'error':
          console.error('[Realtime] Server error:', message.error);
          setLastError(message.error || 'Unknown error');
          break;
        case 'heartbeat':
          // Heartbeat received, connection is alive
          break;
        case 'connected':
          console.log('[Realtime] Connection confirmed', message.data);
          break;
      }
    },
    [handleEvent]
  );





  // Subscribe to a channel
  const subscribe = useCallback((channel: string) => {
    subscriptions.current.add(channel);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', channel }));
    }
  }, []);

  // Unsubscribe from a channel
  const unsubscribe = useCallback((channel: string) => {
    subscriptions.current.delete(channel);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', channel }));
    }
  }, []);

  // Add event handler
  const on = useCallback((eventType: EventType | '*', handler: EventHandler) => {
    if (!eventHandlers.current.has(eventType)) {
      eventHandlers.current.set(eventType, new Set());
    }
    eventHandlers.current.get(eventType)!.add(handler);

    // Return cleanup function
    return () => {
      eventHandlers.current.get(eventType)?.delete(handler);
    };
  }, []);

  // Remove event handler
  const off = useCallback((eventType: EventType | '*', handler: EventHandler) => {
    eventHandlers.current.get(eventType)?.delete(handler);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && isAuthenticated) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, isAuthenticated, connect, disconnect]);

  return {
    isConnected,
    lastError,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    on,
    off,
  };
}

// Hook for subscribing to specific event types
export function useRealtimeEvent(
  eventType: EventType | EventType[],
  handler: EventHandler
) {
  const { on } = useRealtime({ autoConnect: true });

  useEffect(() => {
    const types = Array.isArray(eventType) ? eventType : [eventType];
    const cleanups = types.map((type) => on(type, handler));

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [eventType, handler, on]);
}

// Hook for vessel position updates
export function useVesselPositionUpdates(
  onUpdate: (data: {
    vessel_id: string;
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  }) => void
) {
  useRealtimeEvent('vessel:position_updated', (event) => {
    onUpdate(event.data as any);
  });
}

// Hook for RFQ quote notifications
export function useQuoteNotifications(
  rfqId: string | null,
  onQuoteReceived: (data: {
    rfq_id: string;
    quote_id: string;
    vendor_id: string;
    vendor_name: string;
    total_price: number;
    currency: string;
  }) => void
) {
  useRealtimeEvent('rfq:quote_received', (event) => {
    const data = event.data as any;
    if (!rfqId || data.rfq_id === rfqId) {
      onQuoteReceived(data);
    }
  });
}
