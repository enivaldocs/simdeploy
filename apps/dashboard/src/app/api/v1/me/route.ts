import type { NextRequest } from "next/server";
import { authenticateApi } from "@/lib/api/auth";
import { handleApiError, ok } from "@/lib/api/respond";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(request);
    return ok({
      user: { id: auth.user.id, email: auth.user.email, name: auth.user.name },
      organization: {
        id: auth.organization.id,
        name: auth.organization.name,
        slug: auth.organization.slug,
      },
      authKind: auth.kind,
      scopes: auth.scopes,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
