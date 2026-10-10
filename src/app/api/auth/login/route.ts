import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signAccessToken, signRefreshToken, hashToken } from '@/lib/jwt';
import { COOKIES, TOKEN_EXPIRY } from '@/lib/constants';
import { apiError } from '@/lib/api-response';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return apiError(validation.error.issues[0]?.message || 'Invalid credentials format', 400);
    }

    const { email, password } = validation.data;

    // 1. Fetch user from database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        staff: true,
        student: true,
      },
    });

    if (!user) {
      return apiError('Invalid email or password', 401);
    }

    // 2. Validate password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return apiError('Invalid email or password', 401);
    }

    // 3. Prepare payload info
    const name = user.staff?.fullName || user.student?.fullName;
    const staffId = user.staff?.staffId;
    const studentId = user.student?.studentId;
    const department = user.staff?.department;

    // 4. Generate Access and Refresh Tokens
    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name,
      staffId,
      studentId,
    });

    const rawRefreshToken = await signRefreshToken({ userId: user.id });
    const tokenHash = await hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY.REFRESH_SECONDS * 1000);

    // 5. Store refresh token in database for rotation/revocation
    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    // 6. Set HTTP-Only cookies with standard response shape
    const userPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name,
      staffId,
      studentId,
      department,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: userPayload,
    });

    const isProduction = process.env.NODE_ENV === 'production';

    response.cookies.set(COOKIES.ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: TOKEN_EXPIRY.ACCESS_SECONDS,
    });

    response.cookies.set(COOKIES.REFRESH_TOKEN, rawRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: TOKEN_EXPIRY.REFRESH_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return apiError('An internal error occurred during authentication.', 500);
  }
}
