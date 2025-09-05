import React from 'react';
import classNames from 'classnames';
import { useFileUpload } from '../hooks/useFileUpload';
import { formatFileSize } from '../utils/fileUtils';
import styles from './FileUploader.module.css';

const FileUploader: React.FC = () => {
  const {
    selectedFile,
    fileName,
    uploadState,
    isFormValid,
    buttonText,
    fileInputLabelText,
    handleFileSelect,
    handleFileNameChange,
    handleUploadClick,
    handleRetryWithOverwrite,
    handleCancelOverwrite
  } = useFileUpload();

  const {
    isUploading,
    progress,
    error,
    success,
    downloadUrl,
    fileExists,
    uploadedFileName
  } = uploadState;

  const {
    name = '',
    size = 0,
    type = ''
  } = selectedFile || {};

  const formattedFileSize = selectedFile ? formatFileSize(size) : '';
  const fileType = type || 'Не определен';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Загрузка файла на Яндекс Диск</h1>
        <p className={styles.subtitle}>Выберите файл для загрузки</p>
      </div>

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="fileInput">
            Выберите файл
          </label>
          <input
            id="fileInput"
            type="file"
            className={styles.fileInput}
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <label
            htmlFor="fileInput"
            className={classNames(styles.fileInputLabel, {
              [styles.fileInputLabelDisabled]: isUploading
            })}
          >
            {fileInputLabelText}
          </label>
        </div>

        {selectedFile && (
          <div className={styles.fileInfo}>
            <div className={styles.fileInfoTitle}>Информация о файле:</div>
            <div className={styles.fileInfoItem}>
              <strong>Оригинальное имя:</strong> {name}
            </div>
            <div className={styles.fileInfoItem}>
              <strong>Размер:</strong> {formattedFileSize}
            </div>
            <div className={styles.fileInfoItem}>
              <strong>Тип:</strong> {fileType}
            </div>
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="fileName">
            Имя файла на диске
          </label>
          <input
            id="fileName"
            type="text"
            className={styles.input}
            value={fileName}
            onChange={handleFileNameChange}
            placeholder="Введите имя файла"
            disabled={isUploading}
          />
          <div className={styles.helpText}>
            Файл будет сохранен с этим именем на Яндекс Диск
          </div>
        </div>

        {isUploading && (
          <div className={styles.progressContainer}>
            <div className={styles.progress}>
              <div
                className={styles.progressBar}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className={styles.progressText}>
              Загрузка... {progress}%
            </div>
          </div>
        )}

        {error && !fileExists && (
          <div className={styles.error}>
            <strong>Ошибка:</strong> {error}
          </div>
        )}

        {fileExists && (
          <div className={styles.overwritePrompt}>
            <h4>Файл уже существует</h4>
            <p>Файл с именем "{fileName}" уже существует на диске. Хотите перезаписать его?</p>
            <button
              className={classNames(styles.button, styles.primaryButton)}
              onClick={handleRetryWithOverwrite}
              disabled={isUploading}
            >
              Перезаписать файл
            </button>
            <button
              className={classNames(styles.button, styles.secondaryButton)}
              onClick={handleCancelOverwrite}
              disabled={isUploading}
            >
              Отмена
            </button>
          </div>
        )}

        {success && (
          <div className={styles.success}>
            <h4>✅ Файл успешно загружен!</h4>
            <p>Файл сохранен на Яндекс Диск с именем: <strong>"{uploadedFileName}"</strong></p>
            {downloadUrl && (
              <div className={styles.downloadContainer}>
                <a
                  href={downloadUrl}
                  className={styles.downloadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📥 Скачать файл "{uploadedFileName}"
                </a>
                <div className={styles.downloadHelpText}>
                  Ссылка действительна в течение 24 часов
                </div>
              </div>
            )}
          </div>
        )}

        <button
          className={classNames(styles.button, styles.primaryButton)}
          onClick={handleUploadClick}
          disabled={!isFormValid}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default FileUploader;
