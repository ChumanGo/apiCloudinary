import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClientDataDto } from './dto/client-data.dto';
import { CreateResourceDto } from './dto/create-resource.dto';
import {v2} from 'cloudinary/';

@Injectable()
export class ResourcesService {

  private readonly allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ]);

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      v2.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }
  }

  private ensureCloudinaryConfigured() {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new ServiceUnavailableException(
        'El servicio de imágenes no está configurado.',
      );
    }
  }

  private getClientFolder(folder?: string) {
    const normalized = String(folder || '')
      .trim()
      .replace(/[^a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ _.-]/g, '')
      .replace(/\s+/g, ' ');

    if (!normalized) {
      throw new BadRequestException('Falta el nombre del perfil para guardar la imagen.');
    }

    return `clients/${normalized}`;
  }

  async uploadClientImage(file: Express.Multer.File, folder?: string) {
    this.ensureCloudinaryConfigured();

    if (!this.allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Formato de imagen no permitido.');
    }

    const clientFolder = this.getClientFolder(folder);

    try {
      const result = await new Promise<any>((resolve, reject) => {
        const stream = v2.uploader.upload_stream(
          {
            folder: clientFolder,
            resource_type: 'image',
            overwrite: false,
          },
          (error, uploadResult) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(uploadResult);
          },
        );
        stream.end(file.buffer);
      });

      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
      };
    } catch (error) {
      throw new InternalServerErrorException('No fue posible guardar la imagen.');
    }
  }

  async isClientCreated(CreateResourceDto: CreateResourceDto){
    this.ensureCloudinaryConfigured();
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
    this.ensureCloudinaryConfigured();
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
    this.ensureCloudinaryConfigured();
    const client: string = dataClient.client;
    const images: Array<string> = dataClient.images;
    const path = `clients/${client}`;
    const cloudinaryPath = images.map(image => `${path}/${image}`)

    return await v2.api.delete_resources(cloudinaryPath)
      .then(response => response);
  };
}
