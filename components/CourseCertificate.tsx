import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 64,
    paddingVertical: 56,
    fontFamily: "Helvetica",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
  },
  brand: {
    fontSize: 11,
    letterSpacing: 3,
    color: "#999999",
  },
  brandRule: {
    width: 36,
    height: 1.5,
    backgroundColor: "#1a1a1a",
    marginTop: 10,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 3,
    color: "#999999",
    marginBottom: 20,
  },
  grantedTo: {
    fontSize: 11,
    color: "#888888",
    marginBottom: 10,
  },
  userName: {
    fontSize: 38,
    color: "#0f0f0f",
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  forCourse: {
    fontSize: 11,
    color: "#888888",
    marginTop: 22,
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 16,
    color: "#0f0f0f",
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    maxWidth: 460,
  },
  dateText: {
    fontSize: 10,
    color: "#bbbbbb",
    marginTop: 28,
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: "center",
  },
  footerRule: {
    width: "100%",
    height: 0.75,
    backgroundColor: "#e5e5e5",
    marginBottom: 14,
  },
  footerText: {
    fontSize: 8,
    color: "#cccccc",
    letterSpacing: 1,
  },
});

const PT_MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function formatDate(date: Date): string {
  return `${date.getDate()} de ${PT_MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

type Props = {
  userName: string;
  courseTitle: string;
  completionDate: Date;
  estimatedHours: number;
};

export default function CourseCertificate({
  userName,
  courseTitle,
  completionDate,
  estimatedHours,
}: Props) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>VIARE</Text>
          <View style={styles.brandRule} />
        </View>

        <View style={styles.body}>
          <Text style={styles.eyebrow}>CERTIFICADO DE CONCLUSÃO</Text>
          <Text style={styles.grantedTo}>Este certificado é concedido a</Text>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.forCourse}>pela conclusão do curso</Text>
          <Text style={styles.courseTitle}>{courseTitle}</Text>
          <Text style={styles.dateText}>
            {formatDate(completionDate)} · Carga horária: {estimatedHours}h
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerRule} />
          <Text style={styles.footerText}>viare.app · certificado digital</Text>
        </View>
      </Page>
    </Document>
  );
}
