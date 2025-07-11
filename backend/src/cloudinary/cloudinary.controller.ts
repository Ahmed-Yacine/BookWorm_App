/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  UseInterceptors,
  UploadedFile,
  Post,
  UploadedFiles,
} from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  public uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.cloudinaryService.uploadFile(file);
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('file[]', 5))
  public uploadImages(@UploadedFiles() _files: Express.Multer.File[]) {
    // // Note: The uploadImages method is not implemented in the service.
  }
}
