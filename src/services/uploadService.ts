import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { IAuthService } from './authService';
import { UploadResponse, YandexDiskError } from '../types';
import { GLOBAL_ERROR_MAP, SERVICE_ERROR_MAP, mapYandexError } from './errorMap';
import { AppError } from './appError';

export interface IUploadService {
  uploadFile(file: File, fileName: string, overwrite?: boolean): Promise<string>;
}

export class YandexDiskUploadService implements IUploadService {
  private readonly baseURL = 'https://cloud-api.yandex.net/v1/disk';
  private readonly httpClient: AxiosInstance;
  private readonly authService: IAuthService;

  constructor(authService: IAuthService, httpClient?: AxiosInstance) {
    this.authService = authService;
    this.httpClient = httpClient ?? axios.create({
      baseURL: this.baseURL,
      timeout: 30000
    });

    this.httpClient.interceptors.request.use((config) => {
      if (!this.authService.hasToken()) {
        return Promise.reject(new Error('UNAUTHORIZED'));
      }

      const authHeaders = this.authService.getAuthHeaders();
      const headers = (config.headers ?? {}) as any;
      Object.assign(headers, authHeaders);
      config.headers = headers;

      return config;
    });

    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error && error.response) {
          const status = error.response.status;
          const mapped = mapYandexError(status, undefined, GLOBAL_ERROR_MAP);
          return Promise.reject(mapped ?? error);
        } else if (error && error.request) {
          return Promise.reject(new Error('NO_RESPONSE'));
        }

        return Promise.reject(error);
      }
    );
  }

  async uploadFile(file: File, fileName: string, overwrite: boolean = false): Promise<string> {
    try {
      // Получаем URL для загрузки
      const uploadUrl = await this.getUploadUrl(fileName, overwrite);
      // Загружаем файл
      await this.uploadToUrl(uploadUrl, file);
      // Получаем ссылку для скачивания с правильным именем файла
      const downloadUrl = await this.getDownloadUrl(fileName);
      return downloadUrl;
    } catch (error) {
      const appError = this.handleError(error);
      throw appError;
    }
  }

  private async getUploadUrl(fileName: string, overwrite: boolean): Promise<string> {
    const params = this.buildPathParams(fileName, overwrite);

    const response: AxiosResponse<UploadResponse> = await this.httpClient.get(
      `/resources/upload?${params}`
    );

    return this.extractHref<UploadResponse>(response);
  }

  private async uploadToUrl(uploadUrl: string, file: File): Promise<void> {
    await this.httpClient.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type
      }
    });
  }

  private async getDownloadUrl(fileName: string): Promise<string> {
    const params = this.buildPathParams(fileName);

    const response: AxiosResponse<UploadResponse> = await this.httpClient.get(
      `/resources/download?${params}`
    );

    return this.extractHref<UploadResponse>(response);
  }

  private handleError(error: any): AppError {
    if (error && error.response) {
      const status: number = error.response.status;
      const errorData: YandexDiskError = error.response.data;

      const mapped = mapYandexError(status, errorData?.message, SERVICE_ERROR_MAP);
      if (mapped) return mapped;
      return new AppError('UNKNOWN_HTTP_ERROR', undefined, status);
    }

    if (error && error.message) {
      return new AppError(error.message);
    }

    return new AppError('UNKNOWN_ERROR');
  }

  private buildPathParams(fileName: string, overwrite?: boolean): string {
    const params: Record<string, string | number | boolean> = { path: `/${fileName}` };
    if (typeof overwrite !== 'undefined') {
      params.overwrite = overwrite;
    }
    return this.buildParams(params);
  }

  private buildParams(params: Record<string, string | number | boolean>): string {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      usp.set(key, String(value));
    });
    return usp.toString();
  }

  private extractHref<T>(response: AxiosResponse<T & { href: string }>): string {
    return response.data.href;
  }
}
