import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '@/lib/jwt';
import { COOKIES, TOKEN_EXPIRY } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const rawRefreshToken = req.cookies.get(COOKIES.REFRESH_TOKEN)?.value;

    if (!rawRefreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token not found' },
        { status: 401 }
      );
    }

    // 1. Verify token signature
    const verified = await verifyRefreshToken(rawRefreshToken);
    if (!verified) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // 2. Hash token and query database whitelist
    const tokenHash = await hashToken(rawRefreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            staff: true,
            student: true,
          },
        },
      },
    });

    // 3. Security Check: Token Reuse Detection
    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      if (storedToken?.isRevoked) {
        // Potential token theft: Revoke all sessions for this user!
        await prisma.refreshToken.updateMany({
          where: { userId: verified.userId },
          data: { isRevoked: true },
        });
      }

      const res = NextResponse.json(
        { success: false, message: 'Refresh token is no longer valid' },
        { status: 401 }
      );
      res.cookies.delete(COOKIES.ACCESS_TOKEN);
      res.cookies.delete(COOKIES.REFRESH_TOKEN);
      return res;
    }

    const { user } = storedToken;

    // 4. Invalidate the used refresh token (Rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // 5. Generate new token pair
    const name = user.staff?.fullName || user.student?.fullName;
    const staffId = user.staff?.staffId;
    const studentId = user.student?.studentId;

    const newAccessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name,
      staffId,
      studentId,
    });

    const newRawRefreshToken = await signRefreshToken({ userId: user.id });
    const newTokenHash = await hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(Date.now() + TOKEN_EXPIRY.REFRESH_SECONDS * 1000);

    // 6. Save new refresh token in DB
    await prisma.refreshToken.create({
      data: {
        tokenHash: newTokenHash,
        userId: user.id,
        expiresAt: newExpiresAt,
      },
    });

    // 7. Update cookies
    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name,
        staffId,
        studentId,
      },
    });

    response.cookies.set(COOKIES.ACCESS_TOKEN, newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: TOKEN_EXPIRY.ACCESS_SECONDS,
    });

    response.cookies.set(COOKIES.REFRESH_TOKEN, newRawRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: TOKEN_EXPIRY.REFRESH_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal error during token refresh' },
      { status: 500 }
    );
  }
}
