import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { db } from "@/lib/db";

interface Props {
  params: Promise<{ uuid: string }>;
}

export default async function VerifyPage({ params }: Props) {
  const { uuid } = await params;
  const t = await getTranslations("verify");
  const locale = await getLocale();
  const dateLocale = locale === "pt" ? "pt-BR" : "en-US";

  const cert = await db.certificate.findUnique({ where: { uuid } });

  if (!cert) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-lg w-full text-center">
          <div className="text-[64px] mb-6 text-muted-foreground">✗</div>
          <h1 className="text-[28px] font-medium tracking-[-0.02em] text-foreground mb-3">
            {t("notFound")}
          </h1>
        </div>
      </main>
    );
  }

  const isRevoked = !!cert.revokedAt;
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://viare.app"}/verify/${cert.uuid}`;
  const issuedDate = cert.issuedAt.toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const issueYear = cert.issuedAt.getFullYear();
  const issueMonth = cert.issuedAt.getMonth() + 1;
  const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.courseTitleSnapshot)}&organizationName=Viare&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${encodeURIComponent(verifyUrl)}&certId=${cert.uuid}`;
  const pdfUrl = `/api/certificates/${cert.uuid}/pdf`;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="max-w-xl w-full">
        {/* Status badge */}
        <div className="flex items-center gap-3 mb-10">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-[22px] font-medium ${
              isRevoked
                ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
            }`}
          >
            {isRevoked ? "✗" : "✓"}
          </div>
          <div>
            <div className="font-medium text-[18px] tracking-[-0.015em] text-foreground">
              {isRevoked ? t("revoked") : t("valid")}
            </div>
            <div className="font-mono text-[11px] tracking-[0.05em] uppercase text-muted-foreground">
              {t("verifiedBy")}
            </div>
          </div>
        </div>

        {isRevoked && (
          <p className="text-[14px] text-muted-foreground mb-8 p-4 border border-border rounded-lg bg-card">
            {t("revokedDetail")}
          </p>
        )}

        {/* Certificate body */}
        <div className="bg-card border border-border rounded-[12px] p-8 mb-6">
          <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-4">
            {t("certifiedThat")}
          </div>
          <h1 className="text-[36px] font-medium tracking-[-0.025em] leading-[1.1] text-foreground mb-6">
            {cert.userNameSnapshot}
          </h1>

          <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-2">
            {t("completedCourse")}
          </div>
          <h2 className="text-[22px] font-medium tracking-[-0.015em] text-foreground mb-6">
            {cert.courseTitleSnapshot}
          </h2>

          <div className="flex gap-6 font-mono text-[12px] text-muted-foreground">
            <span>{t("hours", { n: cert.hoursSnapshot })}</span>
            <span className="opacity-40">·</span>
            <span>{t("issuedAt", { date: issuedDate })}</span>
          </div>
        </div>

        {/* Actions */}
        {!isRevoked && (
          <div className="flex gap-3 mb-8">
            <Link
              href={pdfUrl}
              className="flex-1 text-center py-2.5 px-4 rounded-lg border border-border text-[14px] font-medium text-foreground no-underline hover:bg-card transition-colors"
            >
              {t("downloadPdf")}
            </Link>
            <Link
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2.5 px-4 rounded-lg bg-[#0A66C2] text-white text-[14px] font-medium no-underline hover:bg-[#004182] transition-colors"
            >
              {t("addToLinkedIn")}
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border pt-6">
          <p className="font-mono text-[10px] text-muted-foreground mb-2">{t("legalNote")}</p>
          <p className="font-mono text-[10px] text-muted-foreground">
            {t("uuid", { uuid: cert.uuid })}
          </p>
        </div>
      </div>
    </main>
  );
}
