import { NextRequest } from 'next/server';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { COOKIES } from '@/lib/constants';
import prisma from '@/lib/prisma';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: 'STAFF' | 'STUDENT';
  name?: string;
  staffId?: string;
  studentId?: string;
  staffProfileId?: string;
  studentProfileId?: string;
}

/**
 * Resolves the authenticated user from cookies (access token or valid refresh token fallback).
 */
export async function getSessionUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const accessToken = req.cookies.get(COOKIES.ACCESS_TOKEN)?.value;

    if (accessToken) {
      const payload = await verifyAccessToken(accessToken);
      if (payload) {
        let staffProfileId: string | undefined;
        let studentProfileId: string | undefined;

        if (payload.role === 'STAFF') {
          const staff = await prisma.staff.findUnique({
            where: { userId: payload.userId },
            select: { id: true, staffId: true, fullName: true },
          });
          staffProfileId = staff?.id;
        } else if (payload.role === 'STUDENT') {
          const student = await prisma.student.findUnique({
            where: { userId: payload.userId },
            select: { id: true, studentId: true, fullName: true },
          });
          studentProfileId = student?.id;
        }

        return {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          name: payload.name,
          staffId: payload.staffId,
          studentId: payload.studentId,
          staffProfileId,
          studentProfileId,
        };
      }
    }

    // Fallback to refresh token if access token expired
    const refreshToken = req.cookies.get(COOKIES.REFRESH_TOKEN)?.value;
    if (refreshToken) {
      const refreshData = await verifyRefreshToken(refreshToken);
      if (refreshData) {
        const user = await prisma.user.findUnique({
          where: { id: refreshData.userId },
          include: { staff: true, student: true },
        });

        if (user) {
          return {
            userId: user.id,
            email: user.email,
            role: user.role,
            name: user.staff?.fullName || user.student?.fullName,
            staffId: user.staff?.staffId,
            studentId: user.student?.studentId,
            staffProfileId: user.staff?.id,
            studentProfileId: user.student?.id,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('[AUTH_GUARD] Failed to resolve session user:', error);
    return null;
  }
}

/**
 * Guard that requires an authenticated user with STAFF role.
 * Returns the AuthenticatedUser or null if unauthorized.
 */
export async function requireStaff(req: NextRequest): Promise<AuthenticatedUser | null> {
  const user = await getSessionUser(req);
  if (!user || user.role !== 'STAFF') {
    return null;
  }
  return user;
}

/**
 * Guard that requires an authenticated user with STUDENT role.
 * Returns the AuthenticatedUser or null if unauthorized.
 */
export async function requireStudent(req: NextRequest): Promise<AuthenticatedUser | null> {
  const user = await getSessionUser(req);
  if (!user || user.role !== 'STUDENT') {
    return null;
  }
  return user;
}
