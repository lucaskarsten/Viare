// RULE: SUB-03 — gate Pro features via plan != FREE AND status = ACTIVE
// TEMP: Pro gate disabled — todos os usuários autenticados tratados como Pro
// para validação inicial do produto. Re-habilitar restaurando o bloco comentado abaixo.
export async function isPro(userId: string): Promise<boolean> {
  if (!userId) return false;
  return true;

  // const sub = await db.subscription.findUnique({
  //   where: { userId },
  //   select: { plan: true, status: true },
  // });
  // if (!sub) return false;
  // return sub.plan !== "FREE" && sub.status === "ACTIVE";
}
