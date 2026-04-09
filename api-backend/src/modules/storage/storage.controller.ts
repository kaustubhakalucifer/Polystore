import {
  Controller,
  Post,
  Body,
  Delete,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpException,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import type { StorageCredentials } from '../../core/storage/storage.factory';
import {
  DeleteFileDto,
  ListFilesDto,
  DownloadFileDto,
  UploadFileDto,
} from './dto/storage.dto';
import type { Response } from 'express';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    const result = await this.storageService.uploadFile(
      dto.credentials as unknown as StorageCredentials,
      dto.path,
      file.buffer,
      file.mimetype,
    );
    return { path: result };
  }

  @Delete('delete')
  async delete(@Body() dto: DeleteFileDto) {
    await this.storageService.deleteFile(
      dto.credentials as unknown as StorageCredentials,
      dto.path,
    );
    return { success: true };
  }

  @Post('list')
  async list(@Body() dto: ListFilesDto) {
    return this.storageService.listFiles(
      dto.credentials as unknown as StorageCredentials,
      dto.prefix,
      dto.limit,
      dto.cursor,
    );
  }

  @Post('download')
  async download(@Body() dto: DownloadFileDto, @Res() res: Response) {
    try {
      const stream = await this.storageService.downloadFile(
        dto.credentials as unknown as StorageCredentials,
        dto.path,
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${dto.path.split('/').pop()}"`,
      );

      if (Buffer.isBuffer(stream)) {
        res.send(stream);
      } else {
        await pipeline(stream as Readable, res);
      }
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Download failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
