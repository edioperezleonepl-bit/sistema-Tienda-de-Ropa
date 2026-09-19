import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '../../entities/user.entity.js';

export class LoginDto {
  @ApiProperty({ example: 'admin@fashionstore.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin123!' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'sofia@cliente.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Pass123!' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Sofia Mendoza' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: '+591 70012345', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: UserRole, default: UserRole.CLIENT, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ example: null, required: false })
  @IsOptional()
  branchId?: string;
}
