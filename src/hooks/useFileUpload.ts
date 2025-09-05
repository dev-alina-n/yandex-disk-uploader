import { useState, useCallback, useMemo } from 'react';
import { UploadState } from '../types';
import { YandexDiskAuthService } from '../services/authService';
import { YandexDiskUploadService } from '../services/uploadService';
import { validateFileName } from '../utils/fileUtils';

const INITIAL_UPLOAD_STATE: UploadState = {
  isUploading: false,
  progress: 0,
  error: null,
  success: false,
  downloadUrl: null,
  fileExists: false,
  uploadedFileName: null
};

const BUTTON_TEXTS = {
  UPLOADING: 'Загрузка...',
  UPLOAD: 'Загрузить файл'
} as const;

const FILE_INPUT_TEXTS = {
  SELECT: 'Выбрать файл',
  CHANGE: 'Изменить файл'
} as const;

export const useFileUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [uploadState, setUploadState] = useState<UploadState>(INITIAL_UPLOAD_STATE);

  const authService = useMemo(() => {
    const service = new YandexDiskAuthService();
    const token = process.env.REACT_APP_YANDEX_DISK_TOKEN;
    
    if (!token) {
      console.error('REACT_APP_YANDEX_DISK_TOKEN не найден в переменных окружения');
    }
    
    service.setToken(token || '');
    return service;
  }, []);
  
  const uploadService = useMemo(() => new YandexDiskUploadService(authService), [authService]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setUploadState(prev => ({
        ...prev,
        error: null,
        success: false,
        fileExists: false,
        downloadUrl: null
      }));
    }
  }, []);

  const handleFileNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.value);
  }, []);

  const handleUpload = useCallback(async (overwrite: boolean = false) => {
    if (!selectedFile || !fileName.trim()) {
      return;
    }

    if (!validateFileName(fileName)) {
      setUploadState(prev => ({
        ...prev,
        error: 'Некорректное имя файла. Имя не должно содержать символ "/"'
      }));
      return;
    }

    if (!process.env.REACT_APP_YANDEX_DISK_TOKEN) {
      setUploadState(prev => ({
        ...prev,
        error: 'Токен авторизации не настроен. Проверьте файл .env'
      }));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      error: null,
      fileExists: false,
      progress: 0
    }));

    try {
      // Симуляция прогресса
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const downloadUrl = await uploadService.uploadFile(selectedFile, fileName, overwrite);
      
      clearInterval(progressInterval);
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        success: true,
        downloadUrl,
        progress: 100,
        uploadedFileName: fileName
      }));
    } catch (error: any) {
      switch (error.message) {
        case 'FILE_EXISTS':
          setUploadState(prev => ({
            ...prev,
            isUploading: false,
            fileExists: true,
            error: 'Файл с таким именем уже существует'
          }));
          break;
        
        case 'UNAUTHORIZED':
          setUploadState(prev => ({
            ...prev,
            isUploading: false,
            error: 'Ошибка авторизации. Проверьте токен в .env файле'
          }));
          break;
        
        case 'FORBIDDEN':
          setUploadState(prev => ({
            ...prev,
            isUploading: false,
            error: 'Доступ запрещен. Проверьте права токена'
          }));
          break;
        
        case 'FILE_TOO_LARGE':
          setUploadState(prev => ({
            ...prev,
            isUploading: false,
            error: 'Файл слишком большой для загрузки'
          }));
          break;
        
        case 'INSUFFICIENT_STORAGE':
          setUploadState(prev => ({
            ...prev,
            isUploading: false,
            error: 'Недостаточно места на диске'
          }));
          break;
        
        default:
          setUploadState(prev => ({
            ...prev,
            isUploading: false,
            error: error.message || 'Ошибка при загрузке файла'
          }));
          break;
      }
    }
  }, [selectedFile, fileName, uploadService]);

  const handleRetryWithOverwrite = useCallback(() => {
    handleUpload(true);
  }, [handleUpload]);

  const handleUploadClick = useCallback(() => {
    handleUpload(false);
  }, [handleUpload]);

  const handleCancelOverwrite = useCallback(() => {
    setUploadState(prev => ({ 
      ...prev, 
      fileExists: false, 
      error: null 
    }));
  }, []);

  // Мемоизированные вычисления
  const isFormValid = useMemo(() => 
    selectedFile && fileName.trim() && !uploadState.isUploading, 
    [selectedFile, fileName, uploadState.isUploading]
  );

  const buttonText = useMemo(() => 
    uploadState.isUploading ? BUTTON_TEXTS.UPLOADING : BUTTON_TEXTS.UPLOAD,
    [uploadState.isUploading]
  );

  const fileInputLabelText = useMemo(() => 
    selectedFile ? FILE_INPUT_TEXTS.CHANGE : FILE_INPUT_TEXTS.SELECT,
    [selectedFile]
  );

  return {
    // Состояние
    selectedFile,
    fileName,
    uploadState,
    isFormValid,
    buttonText,
    fileInputLabelText,
    
    // Обработчики
    handleFileSelect,
    handleFileNameChange,
    handleUploadClick,
    handleRetryWithOverwrite,
    handleCancelOverwrite
  };
};
