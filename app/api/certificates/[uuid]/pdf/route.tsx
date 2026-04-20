import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import ptMessages from "@/messages/pt.json";
import enMessages from "@/messages/en.json";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    padding: 72,
    fontFamily: "Helvetica",
    flexDirection: "column",
  },
  header: { marginBottom: 48 },
  brand: { fontSize: 13, letterSpacing: 2, color: "#888", textTransform: "uppercase" },
  divider: { height: 1, backgroundColor: "#E5E5E5", marginVertical: 32 },
  label: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: "#AAA",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  name: {
    fontSize: 42,
    color: "#111",
    fontFamily: "Helvetica-Bold",
    letterSpacing: -1,
    lineHeight: 1.1,
  },
  courseTitle: { fontSize: 22, color: "#333", marginBottom: 4 },
  meta: { fontSize: 11, color: "#666", marginBottom: 4 },
  footer: { marginTop: "auto", paddingTop: 32, borderTopWidth: 1, borderTopColor: "#E5E5E5" },
  footerText: { fontSize: 8, color: "#AAA", marginBottom: 4 },
  uuid: { fontSize: 8, color: "#BBB", fontFamily: "Helvetica-Oblique" },
});

interface CertData {
  userNameSnapshot: string;
  courseTitleSnapshot: string;
  hoursSnapshot: number;
  issuedAt: Date;
  uuid: string;
}

interface CertMsgs {
  certifiedThat: string;
  completedCourse: string;
  hours: string;
  issuedAt: string;
  legalNote: string;
  verifyAt: string;
}

function CertificateDoc({
  cert,
  msgs,
  verifyUrl,
}: {
  cert: CertData;
  msgs: CertMsgs;
  verifyUrl: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        <View style={styles.header}>
          <Text style={styles.brand}>Viare</Text>
        </View>

        <View style={styles.divider} />

        <View style={{ marginBottom: 12 }}>
          <Text style={styles.label}>{msgs.certifiedThat}</Text>
          <Text style={styles.name}>{cert.userNameSnapshot}</Text>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={styles.label}>{msgs.completedCourse}</Text>
          <Text style={styles.courseTitle}>{cert.courseTitleSnapshot}</Text>
        </View>

        <Text style={styles.meta}>
          {msgs.hours} · {msgs.issuedAt}
        </Text>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>{msgs.legalNote}</Text>
          <Text style={styles.footerText}>
            {msgs.verifyAt} {verifyUrl}
          </Text>
          <Text style={styles.uuid}>ID: {cert.uuid}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function GET(_req: Request, { params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;

  const cert = await db.certificate.findUnique({ where: { uuid } });
  if (!cert || cert.revokedAt) return new Response("Not found", { status: 404 });

  const locale = (await cookies()).get("NEXT_LOCALE")?.value ?? "pt";
  const raw = (locale === "pt" ? ptMessages : enMessages).verify;
  const dateLocale = locale === "pt" ? "pt-BR" : "en-US";

  const issued = cert.issuedAt.toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const msgs: CertMsgs = {
    certifiedThat: raw.certifiedThat,
    completedCourse: raw.completedCourse,
    hours: raw.hours.replace("{n}", String(cert.hoursSnapshot)),
    issuedAt: raw.issuedAt.replace("{date}", issued),
    legalNote: raw.legalNote,
    verifyAt: locale === "pt" ? "Verificar autenticidade em:" : "Verify at:",
  };

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://viare.app"}/verify/${cert.uuid}`;
  const buffer = await renderToBuffer(
    <CertificateDoc cert={cert} msgs={msgs} verifyUrl={verifyUrl} />
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificado-${uuid.slice(0, 8)}.pdf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
