import { IsNotEmpty, IsString } from "class-validator";

export class CreateResourceDto {

    @IsString()
    @IsNotEmpty()
    client_name: string;

}
