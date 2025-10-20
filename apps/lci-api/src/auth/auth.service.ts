// LCI API - Auth Service
// White-hat: Secure password hashing, JWT generation

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // White-hat: SHA-256 email hashing for search/dedup
  private hashEmail(email: string): string {
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  }

  async register(dto: RegisterDto) {
    const emailHash = this.hashEmail(dto.email);

    // Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Bu email adresi zaten kullanılıyor');
    }

    // White-hat: bcrypt with cost factor 12
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user with password hash
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        emailHash,
        passwordHash,
        kycLevel: 'NONE',
        status: 'ACTIVE',
        locale: dto.locale || 'tr',
        mfaEnabled: false,
      },
    });

    this.logger.log(`User registered: ${user.id}`);

    // Generate JWT
    const token = await this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        kycLevel: user.kycLevel,
        status: user.status,
        locale: user.locale,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    };
  }

  async login(dto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Email veya şifre hatalı');
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Hesabınız aktif değil');
    }

    // White-hat: Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email veya şifre hatalı');
    }

    this.logger.log(`User logged in: ${user.id}`);

    // Generate JWT
    const token = await this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        kycLevel: user.kycLevel,
        status: user.status,
        locale: user.locale,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      kycLevel: user.kycLevel,
      status: user.status,
    };
  }

  private async generateToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    };
  }
}
