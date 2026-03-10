export type HaneulbitUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
};

export type HaneulbitAttendance = {
  id: string;
  user_id: string;
  verification_status: 'pending' | 'approved' | 'rejected';
};

export type AttendanceWeight = {
  userId: string;
  name: string;
  count: number;
};

async function apiFetch<T>(baseUrl: string, path: string, token: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

export async function loadAttendanceWeights(baseUrl: string, token: string): Promise<{
  me: HaneulbitUser;
  weights: AttendanceWeight[];
}> {
  const me = await apiFetch<HaneulbitUser>(baseUrl, '/api/users/me', token);
  if (me.role !== 'super_admin') {
    throw new Error(`권한 부족: super_admin 전용 (현재 role=${me.role ?? 'unknown'})`);
  }

  const [users, approvedAttendance] = await Promise.all([
    apiFetch<HaneulbitUser[]>(baseUrl, '/api/users/', token),
    apiFetch<HaneulbitAttendance[]>(baseUrl, '/api/attendance/?verification_status=approved', token),
  ]);

  const nameMap = new Map(users.map((u) => [u.id, u.name?.trim() || u.email?.trim() || u.id]));
  const countMap = new Map<string, number>();

  for (const row of approvedAttendance) {
    countMap.set(row.user_id, (countMap.get(row.user_id) || 0) + 1);
  }

  const weights: AttendanceWeight[] = [...countMap.entries()]
    .map(([userId, count]) => ({ userId, count, name: nameMap.get(userId) || userId }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return { me, weights };
}
