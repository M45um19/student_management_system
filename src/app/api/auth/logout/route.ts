import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashToken } from '@/lib/jwt';
import { COOKIES } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const rawRefreshToken = req.cookies.get(COOKIES.REFRESH_TOKEN)?.value;

    if (rawRefreshToken) {
      const tokenHash = await hashToken(rawRefreshToken);
      // Revoke the token in DB if it exists
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { isRevoked: true },
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      data: null,
    });

    // Clear authentication cookies
    response.cookies.delete(COOKIES.ACCESS_TOKEN);
    response.cookies.delete(COOKIES.REFRESH_TOKEN);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Even if DB update fails, ensure cookies are cleared on client
    const response = NextResponse.json({
      success: true,
      message: 'Logged out with local session cleared',
      data: null,
    });
    response.cookies.delete(COOKIES.ACCESS_TOKEN);
    response.cookies.delete(COOKIES.REFRESH_TOKEN);
    return response;
  }
}
