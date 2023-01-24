import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientDataDto } from './dto/client-data.dto';
import { CreateResourceDto } from './dto/create-resource.dto';
import {v2} from 'cloudinary/';

v2.config({
  cloud_name: "dgsix0s9f",
  api_key: "363567531263241",
  api_secret: "BDhIJ46AE_PuIH_-GI6To_CaRew",
  secure: true
});

@Injectable()
export class ResourcesService {

  async isClientCreated(CreateResourceDto: CreateResourceDto){
    const clientName = CreateResourceDto.client_name
    return await v2.api.sub_folders(`clients`)
      .then(response => {
        const folders:Array<Object> = response.folders;
        const existFolderClient:Boolean = folders.some(folder => Object.values(folder).some(name => name.includes(clientName)));
        return existFolderClient;
      });
  };

  async createClient(createResourceDto: CreateResourceDto) {
    const client = createResourceDto.client_name;
    return await this.isClientCreated(createResourceDto)
      .then(response => {
        const existFolderClient = response;
        if(existFolderClient)
          throw new NotFoundException(`Client with name ${client} already exist.`);
        else
          return v2.api.create_folder(`clients/${client}`)
            .then(response => response);
      });
  };
  
  async getAllClientResources(client: string) {
    return await v2.api
      .resources({
        type: 'upload',
        resource_type: 'image',
        prefix: `clients/${client}`
      })
      .then(response => {
        const rawResponse = response.resources;        
        return rawResponse.filter(content => content.folder.includes(client))
      });
  }

  async removeClientImages(dataClient: ClientDataDto) {
    const client: string = dataClient.client;
    const images: Array<string> = dataClient.images;
    const path = `clients/${client}`;
    const cloudinaryPath = images.map(image => `${path}/${image}`)

    return await v2.api.delete_resources(cloudinaryPath)
      .then(response => response);
  };
}
