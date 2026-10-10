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
        const userPayload = {
          id: payload.userId,
          email: payload.email,
          role: payload.role,
          name: payload.name,
          staffId: payload.staffId,
          studentId: payload.studentId,
        };

        return NextResponse.json({
          success: true,
          message: 'Active session retrieved successfully',
          data: userPayload,
          meta: {
            authenticated: true,
          },
        });
      }
    }

    // If access token is absent or expired, check refresh token
    const refreshToken = req.cookies.get(COOKIES.REFRESH_TOKEN)?.value;
    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'No active session found',
          data: null,
          meta: { authenticated: false },
        },
        { status: 401 }
      );
    }

    const refreshPayload = await verifyRefreshToken(refreshToken);
    if (!refreshPayload) {
      return NextResponse.json(
        {
          success: false,
          message: 'Refresh token invalid or expired',
          data: null,
          meta: { authenticated: false },
        },
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
        {
          success: false,
          message: 'Session user account not found',
          data: null,
          meta: { authenticated: false },
        },
        { status: 401 }
      );
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.staff?.fullName || user.student?.fullName,
      staffId: user.staff?.staffId,
      studentId: user.student?.studentId,
      department: user.staff?.department,
    };

    return NextResponse.json({
      success: true,
      message: 'Active session retrieved successfully',
      data: userPayload,
      meta: {
        authenticated: true,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal error checking user session',
        data: null,
        meta: { authenticated: false },
      },
      { status: 500 }
    );
  }
}
