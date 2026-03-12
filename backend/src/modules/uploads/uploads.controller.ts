import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { UploadsService } from './uploads.service';
import { MAX_UPLOAD_FILE_SIZE_BYTES } from './uploads.constants';
import type { UploadedFilePayload } from './interfaces/uploaded-file.interface';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get()
  listUploads(@CurrentUser() user: AuthenticatedUser) {
    return this.uploadsService.listUploads(user.userId);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_UPLOAD_FILE_SIZE_BYTES,
        files: 1,
      },
    }),
  )
  uploadPdf(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedFilePayload | undefined,
  ) {
    return this.uploadsService.uploadPdf(user.userId, file);
  }

  @Get(':uploadId/file')
  async getUploadFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('uploadId') uploadId: string,
    @Res() response: Response,
  ): Promise<void> {
    const file = await this.uploadsService.getUploadFile(user.userId, uploadId);
    response.setHeader('Content-Type', file.contentType);
    response.setHeader('Content-Length', file.sizeBytes.toString());
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${this.sanitizeFilename(file.filename)}"`,
    );
    response.send(file.body);
  }

  private sanitizeFilename(filename: string): string {
    return filename.replaceAll('"', '');
  }
}
