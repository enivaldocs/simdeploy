import { redirect } from "next/navigation";
import { getSession, type SessionInfo } from "./session";
import { isStaff, type StaffArea, staffCanAccess } from "./staff-rules";

export type { StaffArea };
export { isStaff, staffCanAccess };

/** Guard de página admin: redireciona não-staff; nega área fora do papel. */
export async function requireStaff(area: StaffArea): Promise<SessionInfo> {
  const session = await getSession();
  if (!session || !isStaff(session.user.staffRole)) redirect("/login");
  if (!staffCanAccess(session.user.staffRole, area)) redirect("/admin");
  return session;
}
