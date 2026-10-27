import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        role: UserRole.FOUNDER,
        profile: {
          create: {
            fullName: dto.fullName.trim(),
            location: dto.location?.trim(),
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      message: 'Account registered successfully',
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.profile?.fullName,
        location: user.profile?.location,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      message: 'Logged in successfully',
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.profile?.fullName,
        location: user.profile?.location,
      },
    };
  }

  private generateToken(userId: string, email: string, role: string) {
    return this.jwtService.sign({
      sub: userId,
      email,
      role,
    });
  }
}
