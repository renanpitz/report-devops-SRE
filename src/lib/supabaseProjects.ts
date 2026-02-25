import { supabase } from "@/integrations/supabase/client";
import { Project, WeeklyReport, TeamMember } from "@/types/project";

type DbProject = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  type: string;
  overall_status: string;
  start_date: string;
  end_date: string;
  progress: number;
  tags: string[] | null;
  team_members: unknown;
};

type DbProjectReport = {
  id: string;
  project_id: string;
  week_start: string;
  week_end: string;
  status: string;
  summary: string;
  highlights: string[] | null;
  blockers: string[] | null;
  tasks_completed: number;
  tasks_total: number;
  incidents_resolved: number;
  deployments_count: number;
  uptime_percent: number;
};

function mapProjectToDb(userId: string, project: Project) {
  return {
    user_id: userId,
    name: project.name,
    description: project.description || null,
    category: project.category,
    type: project.type,
    overall_status: project.status,
    start_date: project.startDate,
    end_date: project.endDate,
    progress: project.progress,
    tags: project.tags.length ? project.tags : null,
    team_members: project.team as TeamMember[],
  };
}

function mapDbToProject(row: DbProject, reports: WeeklyReport[]): Project {
  const team = (row.team_members as TeamMember[] | null) ?? [];
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    category: row.category as Project["category"],
    type: row.type as Project["type"],
    status: row.overall_status as Project["status"],
    startDate: row.start_date,
    endDate: row.end_date,
    progress: Number(row.progress),
    tags: row.tags ?? [],
    team,
    weeklyReports: reports,
  };
}

function mapReportToDb(userId: string, projectId: string, report: WeeklyReport) {
  return {
    user_id: userId,
    project_id: projectId,
    week_start: report.weekStart,
    week_end: report.weekEnd,
    status: report.status,
    summary: report.summary,
    highlights: report.highlights.length ? report.highlights : null,
    blockers: report.blockers.length ? report.blockers : null,
    tasks_completed: report.metrics.tasksCompleted,
    tasks_total: report.metrics.tasksTotal,
    incidents_resolved: report.metrics.incidentsResolved,
    deployments_count: report.metrics.deploymentsCount,
    uptime_percent: report.metrics.uptimePercent,
  };
}

function mapDbReportToWeeklyReport(row: DbProjectReport): WeeklyReport {
  return {
    id: row.id,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    status: row.status as WeeklyReport["status"],
    summary: row.summary,
    highlights: row.highlights ?? [],
    blockers: row.blockers ?? [],
    metrics: {
      tasksCompleted: row.tasks_completed,
      tasksTotal: row.tasks_total,
      incidentsResolved: row.incidents_resolved,
      deploymentsCount: row.deployments_count,
      uptimePercent: Number(row.uptime_percent),
    },
  };
}

export async function createProjectWithReports(
  userId: string,
  project: Project,
): Promise<Project> {
  const { data: insertedProject, error: projectError } = await supabase
    .from("projects")
    .insert(mapProjectToDb(userId, project))
    .select("*")
    .single<DbProject>();

  if (projectError || !insertedProject) {
    throw projectError ?? new Error("Failed to insert project");
  }

  let insertedReports: DbProjectReport[] = [];
  if (project.weeklyReports.length > 0) {
    const payload = project.weeklyReports.map((r) =>
      mapReportToDb(userId, insertedProject.id, r),
    );

    const { data, error: reportsError } = await supabase
      .from("project_reports")
      .insert(payload)
      .select("*");

    if (reportsError) {
      throw reportsError;
    }
    insertedReports = (data ?? []) as DbProjectReport[];
  }

  const weeklyReports = insertedReports
    .map(mapDbReportToWeeklyReport)
    .sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));

  return mapDbToProject(insertedProject, weeklyReports);
}