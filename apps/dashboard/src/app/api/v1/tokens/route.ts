import { createTokenRequestSchema } from "@simdeploy/shared";
import type { NextRequest } from "next/server";
import { authenticateApi } from "@/lib/api/auth";
import { forbidden, handleApiError, ok } from "@/lib/api/respond";
import { createApiToken, listApiTokens } from "@/lib/services/tokens";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(request);
    // Gestão de tokens exige sessão de dashboard — um token não cria tokens.
    if (auth.kind !== "session") throw forbidden("Gerencie tokens pelo dashboard.");
    return ok({ tokens: await listApiTokens(auth.organization.id) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(request);
    if (auth.kind !== "session") throw forbidden("Gerencie tokens pelo dashboard.");
    const body = createTokenRequestSchema.parse(await request.json());
    const { token, record } = await createApiToken({
      organizationId: auth.organization.id,
      userId: auth.user.id,
      name: body.name,
      scopes: body.scopes,
      expiresInDays: body.expiresInDays,
    });
    // token em claro: exibido uma única vez nesta resposta.
    return ok(
      {
        token,
        id: record.id,
        name: record.name,
        scopes: record.scopes,
        displayPrefix: record.displayPrefix,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
