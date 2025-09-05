// Интерфейс для авторизации (SOLID принцип - разделение ответственности)
export interface IAuthService {
  getAuthHeaders(): Record<string, string>;
  setToken(token: string): void;
  hasToken(): boolean;
}

export class YandexDiskAuthService implements IAuthService {
  private token: string = '';

  setToken(token: string): void {
    this.token = token.trim();
  }

  getAuthHeaders(): Record<string, string> {
    if (!this.token) {
      throw new Error('Токен авторизации не установлен');
    }
    
    return {
      'Authorization': `OAuth ${this.token}`,
      'Accept': 'application/json'
    };
  }

  hasToken(): boolean {
    return this.token.length > 0;
  }
}
