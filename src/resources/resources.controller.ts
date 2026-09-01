import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { ClientDataDto } from './dto/client-data.dto';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  createClient(@Body() createResourceDto: CreateResourceDto) {
    return this.resourcesService.createClient(createResourceDto);
  }

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadClientImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string,
  ) {
    if (!file) {
      throw new BadRequestException('Debes seleccionar una imagen para subir.');
    }

    return this.resourcesService.uploadClientImage(file, folder);
  }

  @Get(':client')
  getAllClientResources(@Param('client') client: string) {
    return this.resourcesService.getAllClientResources(client);
  }

  @Delete()
  removeClientImages(@Body() dataClient: ClientDataDto) {
    return this.resourcesService.removeClientImages(dataClient);
  }
}
