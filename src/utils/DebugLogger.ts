/**
 * Debug Logger - Konsol loglarını in-app debug ekranında göstermek için
 */

type LogEntry = {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
};

class DebugLoggerClass {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private maxLogs = 200; // Son 200 log sakla

  log(message: string, type: LogEntry['type'] = 'info') {
    const timestamp = new Date().toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
    
    const entry: LogEntry = { timestamp, message, type };
    this.logs.push(entry);
    
    // Sadece son maxLogs kadar tut
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Tüm dinleyicileri bilgilendir
    this.listeners.forEach(listener => listener([...this.logs]));
    
    // Konsola da yaz
    console.log(`[${timestamp}] ${message}`);
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    // İlk çağrıda mevcut logları gönder
    listener([...this.logs]);
    
    // Unsubscribe fonksiyonu döndür
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getLogs() {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }
}

export const DebugLogger = new DebugLoggerClass();
export type { LogEntry };
