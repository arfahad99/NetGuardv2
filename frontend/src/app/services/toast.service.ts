import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  private toasts: Toast[] = [];

  success(message: string, duration: number = 5000): void {
    this.addToast('success', message, duration);
  }

  error(message: string, duration: number = 7000): void {
    this.addToast('error', message, duration);
  }

  warning(message: string, duration: number = 6000): void {
    this.addToast('warning', message, duration);
  }

  info(message: string, duration: number = 5000): void {
    this.addToast('info', message, duration);
  }

  private addToast(type: Toast['type'], message: string, duration: number): void {
    const id = this.generateId();
    const toast: Toast = { id, type, message, duration };
    
    this.toasts.push(toast);
    this.toastsSubject.next([...this.toasts]);

    // Auto remove toast after duration
    setTimeout(() => {
      this.removeToast(id);
    }, duration);
  }

  removeToast(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.toastsSubject.next([...this.toasts]);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}