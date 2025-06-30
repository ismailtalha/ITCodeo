// src/app/services/socket.service.ts

import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
      withCredentials: true,
    });
  }

  // Emit an event
  emit(event: string, data: any): void {
    this.socket.emit(event, data);
  }

  // Listen for an event
  on<T = any>(event: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      this.socket.on(event, (data: T) => subscriber.next(data));
    });
  }

  // Disconnect the socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Connect (optional, in case you want manual connect)
  connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  // Check socket state
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
