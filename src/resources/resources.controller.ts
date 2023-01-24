import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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

  @Get(':client')
  getAllClientResources(@Param('client') client: string) {
    return this.resourcesService.getAllClientResources(client);
  }

  @Delete()
  removeClientImages(@Body() dataClient: ClientDataDto) {
    return this.resourcesService.removeClientImages(dataClient);
  }
}
