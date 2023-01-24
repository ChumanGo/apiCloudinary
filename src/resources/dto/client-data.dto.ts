import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class ClientDataDto {

    @IsString()
    @IsNotEmpty()
    client: string;

    @IsArray()
    @IsNotEmpty()
    images: Array<string>;

}
