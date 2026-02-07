import { Document, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { JSONResume } from '@/types/json-resume';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    lineHeight: 1.5,
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
  },
  content: {
    paddingTop: 40,
    paddingHorizontal: 40,
    paddingBottom: 65,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 10,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    color: '#000000',
  },
  container: {
    flexDirection: 'row',
    gap: 24,
  },
  mainColumn: {
    flex: 0.68,
  },
  sidebar: {
    flex: 0.32,
  },
  title: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  sidebarSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#2563eb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 9.5,
    color: '#374151',
    textAlign: 'justify',
    lineHeight: 1.4,
  },
  contactItem: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 4,
    textDecoration: 'none',
    display: 'flex',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
  },
  skillTag: {
    fontSize: 9,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    color: '#1e40af',
    marginBottom: 4,
    marginRight: 4,
    alignSelf: 'flex-start',
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricItem: {
    marginBottom: 8,
    padding: 6,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 8,
    color: '#6b7280',
  },
  item: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#111827',
  },
  itemMeta: {
    fontSize: 8.5,
    color: '#6b7280',
  },
  itemSubtitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 9.5,
    color: '#4b5563',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bullet: {
    width: 8,
    fontSize: 10,
    color: '#9ca3af',
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: '#4b5563',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
  },
});

interface ProfilePDFProps {
  resume: JSONResume;
  roleLabel?: string;
}

const parseDate = (date?: string) => {
  if (!date) return null;
  const [year, month = '01'] = date.split('-');
  return new Date(Number(year), Number(month) - 1 || 0);
};

const formatDate = (date?: string) => {
  if (!date) return 'Present';
  const parsed = parseDate(date);
  if (!parsed) return 'Present';
  return parsed.toLocaleString('en', { month: 'short', year: 'numeric' });
};

export function ProfilePDF({ resume, roleLabel }: ProfilePDFProps) {
  const basics = resume.basics || {};
  const location = basics.location
    ? `${basics.location.city || ''}${basics.location.city && basics.location.countryCode ? ', ' : ''}${basics.location.countryCode || ''}`
    : '';
  const linkedInProfile = basics.profiles?.find((p) => p.network === 'LinkedIn');
  const quantifiable = resume._custom?.quantifiableMetrics;
  const displayTitle = roleLabel || basics.label;

  const metrics = [
    quantifiable?.yearsExperience
      ? { label: 'Experience', value: `${quantifiable.yearsExperience}+ Years` }
      : null,
    quantifiable?.teamsLed ? { label: 'Teams Led', value: `${quantifiable.teamsLed}` } : null,
    quantifiable?.remoteYears
      ? { label: 'Remote Work', value: `${quantifiable.remoteYears}+ Years` }
      : null,
  ].filter((metric): metric is { label: string; value: string } => Boolean(metric));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          {/* Header - Name Only */}
          <View style={styles.header}>
            <Text style={styles.name}>{basics.name}</Text>
          </View>

          <View style={styles.container}>
            {/* Left Main Column */}
            <View style={styles.mainColumn}>
              {/* Title Moved Here */}
              {displayTitle && <Text style={styles.title}>{displayTitle}</Text>}

              {/* Summary */}
              {basics.summary && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Profile</Text>
                  <Text style={styles.summaryText}>{basics.summary}</Text>
                </View>
              )}

              {/* Experience */}
              {resume.work && resume.work.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Experience</Text>
                  {resume.work.map((work, index) => (
                    <View
                      key={`${work.name ?? 'experience'}-${work.position ?? 'role'}-${work.startDate ?? index}`}
                      style={styles.item}
                      wrap={false}
                    >
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemTitle}>{work.position}</Text>
                        <Text style={styles.itemMeta}>
                          {formatDate(work.startDate)} - {formatDate(work.endDate)}
                        </Text>
                      </View>
                      <Text style={styles.itemSubtitle}>{work.name}</Text>
                      {work.summary && <Text style={styles.itemDescription}>{work.summary}</Text>}
                      {work.highlights && (
                        <View>
                          {work.highlights.slice(0, 4).map((highlight) => (
                            <View
                              key={`${work.name ?? 'experience'}-${highlight}`}
                              style={styles.bulletRow}
                            >
                              <Text style={styles.bullet}>•</Text>
                              <Text style={styles.bulletText}>{highlight}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Projects */}
              {resume.projects && resume.projects.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Key Projects</Text>
                  {resume.projects.slice(0, 3).map((project, index) => (
                    <View
                      key={`${project.name ?? 'project'}-${project.startDate ?? index}`}
                      style={styles.item}
                      wrap={false}
                    >
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemTitle}>{project.name}</Text>
                      </View>
                      {project.description && (
                        <Text style={styles.itemDescription}>{project.description}</Text>
                      )}
                      {project.highlights && (
                        <View>
                          {project.highlights.slice(0, 2).map((highlight) => (
                            <View
                              key={`${project.name ?? 'project'}-${highlight}`}
                              style={styles.bulletRow}
                            >
                              <Text style={styles.bullet}>•</Text>
                              <Text style={styles.bulletText}>{highlight}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Right Sidebar */}
            <View style={styles.sidebar}>
              {/* Contact */}
              <View style={styles.sidebarSection}>
                <Text style={styles.sectionTitle}>Contact</Text>
                {basics.email && <Text style={styles.contactItem}>{basics.email}</Text>}
                {basics.phone && <Text style={styles.contactItem}>{basics.phone}</Text>}
                {location && <Text style={styles.contactItem}>{location}</Text>}
                {basics.url && (
                  <Link src={basics.url} style={[styles.contactItem, styles.link]}>
                    GitHub
                  </Link>
                )}
                {linkedInProfile && (
                  <Link src={linkedInProfile.url} style={[styles.contactItem, styles.link]}>
                    LinkedIn
                  </Link>
                )}
              </View>

              {/* Skills */}
              {resume.skills && resume.skills.length > 0 && (
                <View style={styles.sidebarSection}>
                  <Text style={styles.sectionTitle}>Skills</Text>
                  <View style={styles.skillsRow}>
                    {resume.skills.flatMap((skill) =>
                      (skill.keywords || []).slice(0, 6).map((keyword) => (
                        <Text key={`${skill.name ?? 'skill'}-${keyword}`} style={styles.skillTag}>
                          {keyword}
                        </Text>
                      ))
                    )}
                  </View>
                </View>
              )}

              {/* Education */}
              {resume.education && resume.education.length > 0 && (
                <View style={styles.sidebarSection}>
                  <Text style={styles.sectionTitle}>Education</Text>
                  {resume.education.map((edu, index) => (
                    <View
                      key={`${edu.institution ?? 'education'}-${edu.startDate ?? edu.endDate ?? index}`}
                      style={{ marginBottom: 8 }}
                    >
                      <Text style={{ fontSize: 9.5, fontWeight: 'bold', color: '#111827' }}>
                        {edu.institution}
                      </Text>
                      <Text style={{ fontSize: 9, color: '#4b5563' }}>
                        {edu.studyType} {edu.area ? `in ${edu.area}` : ''}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Metrics */}
              {metrics.length > 0 && (
                <View style={styles.sidebarSection}>
                  <Text style={styles.sectionTitle}>Metrics</Text>
                  {metrics.map((metric) => (
                    <View key={metric.label} style={styles.metricItem}>
                      <Text style={styles.metricValue}>{metric.value}</Text>
                      <Text style={styles.metricLabel}>{metric.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${basics.name} — Generated via Portfolio • ${new Date().toLocaleDateString()} • Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
