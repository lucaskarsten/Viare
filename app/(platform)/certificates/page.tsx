import Link from "next/link";
import { auth } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { getTranslations, getLocale } from "next-intl/server";

export default async function CertificatesPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const t = await getTranslations("certificates");
  const locale = await getLocale();
  const dateLocale = locale === "pt" ? "pt-BR" : "en-US";

  const certificates = await db.certificate.findMany({
    where: { userId, revokedAt: null },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-10">
      <header className="pb-8 border-b border-border">
        <h1 className="text-[32px] font-medium leading-[1.15] tracking-[-0.02em] m-0 text-foreground">
          {t("title")}
        </h1>
      </header>

      {certificates.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[18px] text-muted-foreground mb-2">{t("empty")}</p>
          <p className="text-[14px] text-muted-foreground">{t("emptyHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => {
            const issuedDate = cert.issuedAt.toLocaleDateString(dateLocale, {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://viare.app"}/verify/${cert.uuid}`;
            const issueYear = cert.issuedAt.getFullYear();
            const issueMonth = cert.issuedAt.getMonth() + 1;
            const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.courseTitleSnapshot)}&organizationName=Viare&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${encodeURIComponent(verifyUrl)}&certId=${cert.uuid}`;
            const pdfUrl = `/api/certificates/${cert.uuid}/pdf`;

            return (
              <div
                key={cert.id}
                className="bg-card rounded-[10px] p-6 flex flex-col gap-4 border border-border"
              >
                <div>
                  <h2 className="font-medium text-[17px] tracking-[-0.015em] m-0 mb-1.5 text-foreground">
                    {cert.courseTitleSnapshot}
                  </h2>
                  <div className="flex gap-3 font-mono text-[11px] text-muted-foreground">
                    <span>{t("hours", { n: cert.hoursSnapshot })}</span>
                    <span className="opacity-40">·</span>
                    <span>{t("issuedAt", { date: issuedDate })}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-border">
                  <Link
                    href={`/verify/${cert.uuid}`}
                    className="text-[13px] font-medium text-foreground no-underline hover:text-muted-foreground transition-colors"
                  >
                    {t("viewCertificate")}
                  </Link>
                  <div className="flex gap-3">
                    <Link
                      href={pdfUrl}
                      className="text-[12px] text-muted-foreground no-underline hover:text-foreground transition-colors"
                    >
                      {t("downloadPdf")}
                    </Link>
                    <span className="text-muted-foreground opacity-40 text-[12px]">·</span>
                    <Link
                      href={linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-muted-foreground no-underline hover:text-foreground transition-colors"
                    >
                      {t("addToLinkedIn")}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
