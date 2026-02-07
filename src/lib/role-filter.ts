import type { JSONResume, Project, Skill, Work } from '@/types/json-resume';

export type RoleType =
  | 'ic-senior'
  | 'ic-staff'
  | 'manager'
  | 'consultant'
  | 'founder'
  | 'ai-engineer'
  | 'all';

export function getRoleFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): RoleType {
  const roleParam =
    searchParams instanceof URLSearchParams ? searchParams.get('role') : searchParams.role;

  const role = (Array.isArray(roleParam) ? roleParam[0] : roleParam)?.toLowerCase();

  if (
    role === 'ic-senior' ||
    role === 'ic-staff' ||
    role === 'manager' ||
    role === 'consultant' ||
    role === 'founder' ||
    role === 'ai-engineer'
  ) {
    return role;
  }

  return 'all';
}

function filterWork(work: Work[], role: RoleType): Work[] {
  if (role === 'all') return work;

  return work.filter((job) => {
    // Check if job has the role in its roles array
    if (job.roles?.includes(role)) {
      return true;
    }
    return false;
  });
}

function filterProjects(projects: Project[], role: RoleType): Project[] {
  if (role === 'all') return projects;

  return projects.filter((project) => {
    // Check if project has the role in its roles array
    if (project.roles?.includes(role)) {
      return true;
    }
    return false;
  });
}

function filterSkills(
  skills: Skill[],
  role: RoleType,
  targetRole?: { prioritySections?: string[] }
): Skill[] {
  if (role === 'all') return skills;

  // If targetRole has prioritySections and includes 'skills', keep all skills
  // Otherwise, filter based on role relevance
  if (targetRole?.prioritySections?.includes('skills')) {
    return skills;
  }

  // For now, return all skills - can be enhanced later
  return skills;
}

export function filterResumeByRole(resume: JSONResume, role: RoleType): JSONResume {
  if (role === 'all') {
    return resume;
  }

  const targetRole = resume._custom?.targetRoles?.[role];

  // Filter work based on years to include
  let filteredWork = resume.work || [];
  if (targetRole?.yearsToInclude) {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - targetRole.yearsToInclude);
    const cutoffYear = cutoffDate.getFullYear();

    filteredWork = filteredWork.filter((job) => {
      if (!job.startDate) return false;
      const jobYear = parseInt(job.startDate.split('-')[0], 10);
      return jobYear >= cutoffYear;
    });
  }

  // Filter by role tags
  filteredWork = filterWork(filteredWork, role);

  // Filter projects
  const filteredProjects = filterProjects(resume.projects || [], role);

  // Filter skills
  const filteredSkills = filterSkills(resume.skills || [], role, targetRole);

  return {
    ...resume,
    work: filteredWork,
    projects: filteredProjects,
    skills: filteredSkills,
  };
}
