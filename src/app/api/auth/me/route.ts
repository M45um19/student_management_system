import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { COOKIES } from '@/lib/constants';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get(COOKIES.ACCESS_TOKEN)?.value;

    if (accessToken) {
      const payload = await verifyAccessToken(accessToken);
      if (payload) {
        return NextResponse.json({
          authenticated: true,
          user: {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
            name: payload.name,
            staffId: payload.staffId,
            studentId: payload.studentId,
          },
        });
      }
    }

    // If access token is absent or expired, check refresh token
    const refreshToken = req.cookies.get(COOKIES.REFRESH_TOKEN)?.value;
    if (!refreshToken) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    const refreshPayload = await verifyRefreshToken(refreshToken);
    if (!refreshPayload) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    // Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { id: refreshPayload.userId },
      include: {
        staff: true,
        student: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.staff?.fullName || user.student?.fullName,
        staffId: user.staff?.staffId,
        studentId: user.student?.studentId,
        department: user.staff?.department,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 500 }
    );
  }
}
