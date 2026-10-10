import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { COOKIES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIES.ACCESS_TOKEN)?.value;
  const refreshToken = cookieStore.get(COOKIES.REFRESH_TOKEN)?.value;

  if (accessToken) {
    const user = await verifyAccessToken(accessToken);
    if (user?.role === 'STAFF') {
      redirect('/staff/dashboard');
    } else if (user?.role === 'STUDENT') {
      redirect('/student/dashboard');
    }
  }

  if (refreshToken) {
    const refreshData = await verifyRefreshToken(refreshToken);
    if (refreshData) {
      redirect('/staff/dashboard');
    }
  }

  // Not logged in -> redirect to login
  redirect('/login');
}
