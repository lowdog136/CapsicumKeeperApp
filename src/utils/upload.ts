import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from 'src/boot/firebase';

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Загружает файл в Firebase Storage
 * @param file - файл для загрузки
 * @param folder - папка в storage (например, 'pepper-photos')
 * @param fileName - имя файла (если не указано, используется оригинальное имя)
 * @returns Promise с URL и путем к файлу
 */
export async function uploadFile(
  file: File,
  folder: string = 'pepper-photos',
  fileName?: string,
): Promise<UploadResult> {
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop();
  const finalFileName = fileName || `${timestamp}.${fileExtension}`;
  const storageRef = ref(storage, `${folder}/${finalFileName}`);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
    };
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    throw new Error('Не удалось загрузить файл');
  }
}

/**
 * Удаляет файл из Firebase Storage
 * @param filePath - путь к файлу в storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Ошибка удаления файла:', error);
    throw new Error('Не удалось удалить файл');
  }
}

/**
 * Проверяет, является ли URL файлом из Firebase Storage
 * @param url - URL для проверки
 * @returns true, если это файл из Firebase Storage
 */
export function isFirebaseStorageUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com');
}

/**
 * Извлекает путь к файлу из URL Firebase Storage
 * @param url - URL файла
 * @returns путь к файлу или null
 */
export function getFilePathFromUrl(url: string): string | null {
  if (!isFirebaseStorageUrl(url)) return null;

  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+?)\?/);
    return pathMatch && pathMatch[1] ? decodeURIComponent(pathMatch[1]) : null;
  } catch {
    return null;
  }
}
