import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { compare, hash } from 'bcryptjs';
import { User } from '../user/user.entity';
import { LoginDto } from './dtos/login.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { LoginResponseDto } from './interfaces/login-response.interface';

@Injectable()
export class AuthService {
  private readonly jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? '8h';
  private readonly bcryptPrefixRegex = /^\$2[aby]\$\d{2}\$/;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const normalizedEmail = dto.email?.trim().toLowerCase();
    const incomingPassword = dto.password ?? '';

    if (!normalizedEmail || !incomingPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValidation = await this.validatePassword(
      incomingPassword,
      user.password,
    );

    if (!passwordValidation.isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (passwordValidation.mustRehash) {
      user.password = await this.hashPassword(incomingPassword);
      await this.userRepository.save(user);
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.jwtExpiresIn,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  private async validatePassword(
    plainPassword: string,
    storedPassword: string,
  ): Promise<{ isValid: boolean; mustRehash: boolean }> {
    if (this.bcryptPrefixRegex.test(storedPassword)) {
      const isValid = await compare(plainPassword, storedPassword);
      return { isValid, mustRehash: false };
    }

    const isValid = plainPassword === storedPassword;
    return { isValid, mustRehash: isValid };
  }

  private async hashPassword(password: string): Promise<string> {
    return hash(password, 10);
  }
}
