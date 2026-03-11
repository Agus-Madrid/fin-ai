import { LoginUserDto } from './login-user.interface';

export interface LoginResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: LoginUserDto;
}
