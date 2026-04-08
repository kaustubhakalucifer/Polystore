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
} from './dto/storage.dto';
import type { Response } from 'express';
import { Readable } from 'stream';

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
    @Body('path') path: string,
    @Body('credentials') credentialsStr: string,
  ) {
    if (!path || !credentialsStr) {
      throw new HttpException(
        'Path and credentials are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    let credentials: StorageCredentials;
    try {
      credentials = JSON.parse(credentialsStr) as StorageCredentials;
    } catch {
      throw new HttpException(
        'Invalid credentials format',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.storageService.uploadFile(
      credentials,
      path,
      file.buffer,
      file.mimetype,
    );
    return { path: result };
  }

  @Delete('delete')
  async delete(@Body() dto: DeleteFileDto) {
    await this.storageService.deleteFile(dto.credentials, dto.path);
    return { success: true };
  }

  @Post('list')
  async list(@Body() dto: ListFilesDto) {
    return this.storageService.listFiles(
      dto.credentials,
      dto.prefix,
      dto.limit,
      dto.cursor,
    );
  }

  @Post('download')
  async download(@Body() dto: DownloadFileDto, @Res() res: Response) {
    try {
      const stream = await this.storageService.downloadFile(
        dto.credentials,
        dto.path,
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${dto.path.split('/').pop()}"`,
      );

      if (Buffer.isBuffer(stream)) {
        res.send(stream);
      } else {
        (stream as Readable).pipe(res);
      }
    } catch (error: unknown) {
      const e = error as Error;
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
