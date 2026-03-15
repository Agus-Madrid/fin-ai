import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { UploadResponseDto, UploadStatus } from './dtos/upload-response.dto';
import { Upload } from './upload.entity';
import { FILE_STORAGE_ADAPTER } from './uploads.constants';
import type { FileStorageAdapter } from './interfaces/file-storage-adapter.interface';
import { UploadedFilePayload } from './interfaces/uploaded-file.interface';
import { UploadFileResult } from './interfaces/upload-file-result.interface';
import {
  hasPdfMimeType,
  hasPdfSignature,
  isPdfFilename,
} from './utils/pdf-validation.util';
import { buildStorageKey } from './utils/storage-key.util';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(Upload)
    private readonly uploadsRepository: Repository<Upload>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Inject(FILE_STORAGE_ADAPTER)
    private readonly storageAdapter: FileStorageAdapter,
  ) {}

  async listUploads(userId: string): Promise<UploadResponseDto[]> {
    const uploads = await this.uploadsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    return uploads.map((upload) => this.toUploadResponse(upload));
  }

  async uploadPdf(
    userId: string,
    file: UploadedFilePayload | undefined,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('A PDF file is required');
    }

    this.validatePdfFile(file);

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const upload = this.uploadsRepository.create({
      filename: file.originalname,
      storageKey: buildStorageKey(userId),
      mimeType: 'application/pdf',
      sizeBytes: file.size,
      storageProvider: this.storageAdapter.provider,
      status: 'PROCESSING',
      user,
    });

    await this.uploadsRepository.save(upload);

    try {
      await this.storageAdapter.saveFile({
        key: upload.storageKey,
        body: file.buffer,
        contentType: upload.mimeType,
      });
    } catch {
      upload.status = 'FAILED';
      await this.uploadsRepository.save(upload);
      throw new InternalServerErrorException('File upload failed');
    }

    return this.toUploadResponse(upload);
  }

  async getUploadFile(
    userId: string,
    uploadId: string,
  ): Promise<UploadFileResult> {
    const upload = await this.uploadsRepository.findOne({
      where: { id: uploadId, user: { id: userId } },
    });

    if (!upload) {
      throw new NotFoundException(`Upload with id ${uploadId} not found`);
    }

    if (upload.status === 'FAILED') {
      throw new BadRequestException('Upload failed and cannot be consumed');
    }

    try {
      const storedFile = await this.storageAdapter.readFile(upload.storageKey);
      return {
        filename: upload.filename,
        body: storedFile.body,
        contentType: storedFile.contentType || upload.mimeType,
        sizeBytes: storedFile.sizeBytes,
      };
    } catch {
      throw new NotFoundException('Stored file was not found');
    }
  }

  async markUploadAsCompleted(userId: string, uploadId: string): Promise<void> {
    const upload = await this.uploadsRepository.findOne({
      where: { id: uploadId, user: { id: userId } },
    });

    if (!upload) {
      throw new NotFoundException(`Upload with id ${uploadId} not found`);
    }

    if (upload.status === 'FAILED') {
      throw new BadRequestException('Upload failed and cannot be completed');
    }

    if (upload.status === 'COMPLETED') {
      return;
    }

    upload.status = 'COMPLETED';
    await this.uploadsRepository.save(upload);
  }

  private validatePdfFile(file: UploadedFilePayload): void {
    if (!isPdfFilename(file.originalname)) {
      throw new BadRequestException('Only .pdf files are allowed');
    }

    if (!hasPdfMimeType(file.mimetype)) {
      throw new BadRequestException('Invalid file content type. PDF expected');
    }

    if (!hasPdfSignature(file.buffer)) {
      throw new BadRequestException('Invalid PDF file signature');
    }
  }

  private toUploadResponse(upload: Upload): UploadResponseDto {
    return {
      id: upload.id,
      filename: upload.filename,
      mimeType: upload.mimeType,
      sizeBytes: this.parseSizeBytes(upload.sizeBytes),
      status: upload.status as UploadStatus,
      createdAt: upload.createdAt,
      fileUrl: `/uploads/${upload.id}/file`,
    };
  }

  private parseSizeBytes(raw: number | string): number {
    if (typeof raw === 'number') {
      return raw;
    }

    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      return 0;
    }

    return parsed;
  }
}
