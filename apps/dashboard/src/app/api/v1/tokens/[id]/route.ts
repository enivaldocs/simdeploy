import type { NextRequest } from "next/server";
import { authenticateApi } from "@/lib/api/auth";
import { forbidden, handleApiError, notFound, ok } from "@/lib/api/respond";
import { revokeApiToken } from "@/lib/services/tokens";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const auth = await authenticateApi(request);
    if (auth.kind !== "session") throw forbidden("Gerencie tokens pelo dashboard.");
    const { id } = await params;
    const revoked = await revokeApiToken({
      organizationId: auth.organization.id,
      userId: auth.user.id,
      tokenId: id,
    });
    if (!revoked) throw notFound("Token");
    return ok({ revoked: true });
  } catch (error) {
    return handleApiError(error);
  }
}
