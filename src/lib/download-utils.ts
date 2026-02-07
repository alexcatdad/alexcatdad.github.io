import type { Basics, CustomExtensions } from '@/types/json-resume';
import type { RoleType } from './role-filter';

const sanitizeSegment = (value: string) => {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || null;
};

interface FileNameOptions {
  basics?: Basics;
  targetRoles?: CustomExtensions['targetRoles'];
  role?: RoleType;
  format: 'pdf' | 'markdown';
  timestamp?: Date;
}

export function buildDownloadFileName({
  basics,
  targetRoles,
  role = 'all',
  format,
  timestamp = new Date(),
}: FileNameOptions) {
  const baseName = basics?.name ?? 'Professional Profile';
  const safeBase = sanitizeSegment(baseName) ?? 'professional-profile';
  const resolvedRoleLabel =
    role !== 'all' ? (targetRoles?.[role]?.label ?? role.replace(/-/g, ' ')) : basics?.label;
  const safeRole = resolvedRoleLabel ? sanitizeSegment(resolvedRoleLabel) : null;
  const descriptor = format === 'pdf' ? 'resume' : 'profile';
  const dateSegment = timestamp.toISOString().split('T')[0];

  const segments = [safeBase, safeRole, descriptor, dateSegment].filter(
    (segment): segment is string => Boolean(segment)
  );

  return `${segments.join('-')}.${format === 'pdf' ? 'pdf' : 'md'}`;
}
