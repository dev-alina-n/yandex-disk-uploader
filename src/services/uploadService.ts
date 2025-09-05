import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { IAuthService } from './authService';
import { UploadResponse, YandexDiskError } from '../types';

export interface IUploadService {
  uploadFile(file: File, fileName: string, overwrite?: boolean): Promise<string>;
}

export class YandexDiskUploadService implements IUploadService {
  private readonly baseURL = 'https://cloud-api.yandex.net/v1/disk';
  private readonly httpClient: AxiosInstance;
  private readonly authService: IAuthService;

  constructor(authService: IAuthService) {
    this.authService = authService;
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000
    });
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
      this.handleError(error);
    }
  }

  private async getUploadUrl(fileName: string, overwrite: boolean): Promise<string> {
    const params = new URLSearchParams({
      path: `/${fileName}`,
      overwrite: overwrite.toString()
    });

    const response: AxiosResponse<UploadResponse> = await this.httpClient.get(
      `/resources/upload?${params}`,
      {
        headers: this.authService.getAuthHeaders()
      }
    );

    return response.data.href;
  }

  private async uploadToUrl(uploadUrl: string, file: File): Promise<void> {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type
      }
    });
  }

  private async getDownloadUrl(fileName: string): Promise<string> {
    const params = new URLSearchParams({
      path: `/${fileName}`
    });

    const response: AxiosResponse<UploadResponse> = await this.httpClient.get(
      `/resources/download?${params}`,
      {
        headers: this.authService.getAuthHeaders()
      }
    );

    return response.data.href;
  }

  private handleError(error: any): never {
    if (error.response) {
      const errorData: YandexDiskError = error.response.data;
      
      switch (error.response.status) {
        case 409:
          throw new Error('FILE_EXISTS');
        case 401:
          throw new Error('UNAUTHORIZED');
        case 403:
          throw new Error('FORBIDDEN');
        case 404:
          throw new Error('NOT_FOUND');
        case 413:
          throw new Error('FILE_TOO_LARGE');
        case 507:
          throw new Error('INSUFFICIENT_STORAGE');
        default:
          throw new Error(errorData.message || 'Неизвестная ошибка');
      }
    } else if (error.request) {
      throw new Error('Ошибка сети. Проверьте подключение к интернету.');
    } else {
      throw new Error(error.message || 'Произошла неизвестная ошибка');
    }
  }
}
