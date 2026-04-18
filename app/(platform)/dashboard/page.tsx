import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Olá, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Continue de onde parou.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Streak atual</p>
          <p className="text-3xl font-bold mt-1">0 dias</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Lições concluídas</p>
          <p className="text-3xl font-bold mt-1">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Badges conquistados</p>
          <p className="text-3xl font-bold mt-1">0</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="font-semibold mb-2">Começar um curso</h2>
        <p className="text-sm text-muted-foreground">
          Nenhum curso iniciado ainda.{" "}
          <a href="/courses" className="text-primary underline-offset-4 hover:underline">
            Explorar cursos →
          </a>
        </p>
      </div>
    </div>
  );
}
