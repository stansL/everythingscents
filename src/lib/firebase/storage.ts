import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata,
  UploadMetadata,
  UploadResult,
} from "firebase/storage";
import { storage } from "./config";

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export interface FileMetadata {
  name: string;
  fullPath: string;
  size: number;
  contentType?: string;
  customMetadata?: Record<string, string>;
  timeCreated: string;
  updated: string;
  downloadURL?: string;
}

export class StorageService {
  // Upload file with simple upload
  static async uploadFile(
    path: string,
    file: File | Blob,
    metadata?: UploadMetadata
  ): Promise<UploadResult> {
    try {
      const storageRef = ref(storage, path);
      const result = await uploadBytes(storageRef, file, metadata);
      return result;
    } catch (error) {
      console.error("Upload file error:", error);
      throw error;
    }
  }

  // Upload file with progress tracking
  static uploadFileWithProgress(
    path: string,
    file: File | Blob,
    onProgress?: (progress: UploadProgress) => void,
    metadata?: UploadMetadata
  ) {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    return new Promise<UploadResult>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          };
          
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error("Upload with progress error:", error);
          reject(error);
        },
        async () => {
          try {
            const result = await uploadTask;
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  // Get download URL for a file
  static async getDownloadURL(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error("Get download URL error:", error);
      throw error;
    }
  }

  // Delete a file
  static async deleteFile(path: string): Promise<boolean> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return true;
    } catch (error) {
      console.error("Delete file error:", error);
      throw error;
    }
  }

  // List all files in a directory
  static async listFiles(path: string): Promise<FileMetadata[]> {
    try {
      const storageRef = ref(storage, path);
      const result = await listAll(storageRef);
      
      const filePromises = result.items.map(async (itemRef) => {
        const metadata = await getMetadata(itemRef);
        let downloadURL: string | undefined;
        
        try {
          downloadURL = await getDownloadURL(itemRef);
        } catch {
          // File might not be accessible
          console.warn("Could not get download URL for:", itemRef.fullPath);
        }

        return {
          name: metadata.name,
          fullPath: metadata.fullPath,
          size: metadata.size,
          contentType: metadata.contentType,
          customMetadata: metadata.customMetadata,
          timeCreated: metadata.timeCreated,
          updated: metadata.updated,
          downloadURL,
        };
      });

      return await Promise.all(filePromises);
    } catch (error) {
      console.error("List files error:", error);
      throw error;
    }
  }

  // Get file metadata
  static async getFileMetadata(path: string): Promise<FileMetadata> {
    try {
      const storageRef = ref(storage, path);
      const metadata = await getMetadata(storageRef);
      
      let downloadURL: string | undefined;
      try {
        downloadURL = await getDownloadURL(storageRef);
      } catch {
        console.warn("Could not get download URL for:", path);
      }

      return {
        name: metadata.name,
        fullPath: metadata.fullPath,
        size: metadata.size,
        contentType: metadata.contentType,
        customMetadata: metadata.customMetadata,
        timeCreated: metadata.timeCreated,
        updated: metadata.updated,
        downloadURL,
      };
    } catch (error) {
      console.error("Get file metadata error:", error);
      throw error;
    }
  }

  // Update file metadata
  static async updateFileMetadata(
    path: string,
    metadata: UploadMetadata
  ): Promise<FileMetadata> {
    try {
      const storageRef = ref(storage, path);
      const updatedMetadata = await updateMetadata(storageRef, metadata);
      
      let downloadURL: string | undefined;
      try {
        downloadURL = await getDownloadURL(storageRef);
      } catch {
        console.warn("Could not get download URL for:", path);
      }

      return {
        name: updatedMetadata.name,
        fullPath: updatedMetadata.fullPath,
        size: updatedMetadata.size,
        contentType: updatedMetadata.contentType,
        customMetadata: updatedMetadata.customMetadata,
        timeCreated: updatedMetadata.timeCreated,
        updated: updatedMetadata.updated,
        downloadURL,
      };
    } catch (error) {
      console.error("Update file metadata error:", error);
      throw error;
    }
  }

  // Helper method to generate file path with timestamp
  static generateFilePath(
    folder: string,
    fileName: string,
    includeTimestamp: boolean = true
  ): string {
    const timestamp = includeTimestamp ? Date.now() : '';
    const fileExtension = fileName.split('.').pop();
    const baseName = fileName.replace(`.${fileExtension}`, '');
    
    return `${folder}/${baseName}${timestamp ? `_${timestamp}` : ''}.${fileExtension}`;
  }

  // Helper method to validate file type
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  // Helper method to validate file size
  static validateFileSize(file: File, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }
}

export { storage };