import { cookies } from "next/headers";
import type { Role, User } from "@/lib/types";
import { usersRepo } from "@/lib/repositories/misc";

/**
 * جلسة النموذج الأولي.
 *
 * ⚠️ هذه **ليست** مصادقة إنتاجية — لا كلمات مرور ولا رموز موقّعة.
 * الغرض منها تشغيل العرض التوضيحي وتبديل الأدوار أمام الحكّام.
 * في الإنتاج تُستبدل بتكامل مع بوابة مصر الرقمية أو مزود هوية حكومي،
 * ويبقى كل ما فوقها كما هو لأن الواجهة هي `getCurrentUser()` فقط.
 */
export const SESSION_COOKIE = "bs_session_user";
export const DEFAULT_USER_ID = "u-citizen";

export async function getCurrentUser(): Promise<User> {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value ?? DEFAULT_USER_ID;
  return usersRepo.byId(id) ?? usersRepo.byId(DEFAULT_USER_ID) ?? fallbackUser();
}

export async function getCurrentRole(): Promise<Role> {
  return (await getCurrentUser()).role;
}

function fallbackUser(): User {
  return {
    id: DEFAULT_USER_ID, name: "زائر", phone: "", nationalIdMasked: null,
    role: "citizen", markaz: null, interests: [], createdAt: new Date().toISOString(),
  };
}
