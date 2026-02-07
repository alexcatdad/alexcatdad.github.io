import type { JSONResume } from '@/types/json-resume';

export function generateMarkdown(resume: JSONResume): string {
  const sections: string[] = [];
  const basics = resume.basics || {};

  // Header
  if (basics.name) {
    sections.push(`# ${basics.name}`);
  }
  if (basics.label) {
    sections.push(`## ${basics.label}`);
  }
  sections.push('');

  // Contact info
  const contactParts: string[] = [];
  if (basics.email) contactParts.push(`📧 ${basics.email}`);
  if (basics.location) {
    const location = `${basics.location.city || ''}${basics.location.city && basics.location.countryCode ? ', ' : ''}${basics.location.countryCode || ''}`;
    if (location) contactParts.push(`📍 ${location}`);
  }
  if (basics.phone) contactParts.push(`📱 ${basics.phone}`);
  if (contactParts.length > 0) {
    sections.push(contactParts.join(' | '));
    sections.push('');
  }

  // Profiles
  if (basics.profiles && basics.profiles.length > 0) {
    const links = basics.profiles.map((p) => `[${p.network}](${p.url})`);
    sections.push(links.join(' • '));
    sections.push('');
  }

  sections.push('---');
  sections.push('');

  // Summary
  if (basics.summary) {
    sections.push('## Professional Summary');
    sections.push('');
    sections.push(basics.summary);
    sections.push('');
  }

  // Skills
  if (resume.skills && resume.skills.length > 0) {
    sections.push('## Technical Skills');
    sections.push('');

    resume.skills.forEach((skill) => {
      if (skill.name) {
        sections.push(`### ${skill.name}`);
        if (skill.level) {
          sections.push(`*${skill.level}*`);
        }
        if (skill.keywords && skill.keywords.length > 0) {
          sections.push(skill.keywords.join(' • '));
        }
        sections.push('');
      }
    });
  }

  // Professional Experience
  if (resume.work && resume.work.length > 0) {
    sections.push('## Professional Experience');
    sections.push('');

    resume.work.forEach((exp) => {
      if (exp.position) {
        sections.push(`### ${exp.position}`);
      }
      if (exp.name) {
        sections.push(`**${exp.name}**`);
      }
      if (exp.startDate || exp.endDate) {
        const start = exp.startDate ? exp.startDate.split('-')[0] : '';
        const end = exp.endDate ? exp.endDate.split('-')[0] : 'Present';
        sections.push(`*${start} - ${end}*`);
      }
      sections.push('');

      if (exp.summary) {
        sections.push(exp.summary);
        sections.push('');
      }

      if (exp.highlights && exp.highlights.length > 0) {
        exp.highlights.forEach((h) => {
          sections.push(`- ${h}`);
        });
        sections.push('');
      }

      if (exp.keywords && exp.keywords.length > 0) {
        sections.push(`**Technologies**: ${exp.keywords.join(', ')}`);
        sections.push('');
      }
    });
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    sections.push('## Featured Projects');
    sections.push('');

    resume.projects.forEach((project) => {
      if (project.name) {
        sections.push(`### ${project.name}`);
      }
      sections.push('');

      if (project.description) {
        sections.push(project.description);
        sections.push('');
      }

      if (project.highlights && project.highlights.length > 0) {
        project.highlights.forEach((h) => {
          sections.push(`- ${h}`);
        });
        sections.push('');
      }

      if (project.keywords && project.keywords.length > 0) {
        sections.push(`**Technologies**: ${project.keywords.join(', ')}`);
        sections.push('');
      }

      if (project.url) {
        sections.push(`🔗 [View Project](${project.url})`);
        sections.push('');
      }
    });
  }

  // Publications
  if (resume.publications && resume.publications.length > 0) {
    sections.push('## Publications');
    sections.push('');

    resume.publications.forEach((pub) => {
      if (pub.name) {
        sections.push(`### ${pub.name}`);
      }
      if (pub.publisher) {
        sections.push(`**${pub.publisher}**`);
      }
      if (pub.releaseDate) {
        sections.push(`*${pub.releaseDate}*`);
      }
      sections.push('');

      if (pub.summary) {
        sections.push(pub.summary);
        sections.push('');
      }

      if (pub.url) {
        sections.push(`🔗 [Read Publication](${pub.url})`);
        sections.push('');
      }
    });
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    sections.push('## Education');
    sections.push('');

    resume.education.forEach((edu) => {
      if (edu.studyType && edu.area) {
        sections.push(`### ${edu.studyType} - ${edu.area}`);
      }
      if (edu.institution) {
        sections.push(`**${edu.institution}**`);
      }
      if (edu.startDate || edu.endDate) {
        const start = edu.startDate ? edu.startDate.split('-')[0] : '';
        const end = edu.endDate ? edu.endDate.split('-')[0] : 'Present';
        sections.push(`*${start} - ${end}*`);
      }
      sections.push('');
    });
  }

  // Certificates
  if (resume.certificates && resume.certificates.length > 0) {
    sections.push('## Certifications');
    sections.push('');

    resume.certificates.forEach((cert) => {
      if (cert.name && cert.issuer) {
        sections.push(`- **${cert.name}** - ${cert.issuer}`);
        if (cert.date) {
          sections.push(`  - Date: ${cert.date}`);
        }
        if (cert.url) {
          sections.push(`  - [Verify](${cert.url})`);
        }
      }
    });
    sections.push('');
  }

  // Footer
  sections.push('---');
  sections.push('');
  sections.push(
    `*Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*`
  );

  return sections.join('\n');
}
