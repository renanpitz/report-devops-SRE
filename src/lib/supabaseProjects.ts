import { supabase } from "@/integrations/supabase/client";
import { Project, WeeklyReport, TeamMember } from "@/types/project";

type DbProject = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  // category and type do NOT exist in DB; we keep them only in the frontend model
  overall_status: string | null;
  start_date: string;
  end_date: string;
  progress: number | null;
  tags: string[] | null;
  team_members: unknown;
};

type DbProjectReport = {
  id: string;
  project_id: string;
  user_id: string;
  report_date?: string | null; // existe na tabela, mas não usamos aqui
  week_start?: string | null;
  week_end?: string | null;
  status: string | null;
  title?: string | null;
  summary: string | null;
  highlights: string[] | null;
  blockers: string[] | null;
  tasks_completed: number | null;
  tasks_total: number | null;
  incidents_resolved: number | null;
  deployments_count: number | null;
  uptime_percent: number | null;
};

function normalizeStringArray(value: string[] | null | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value.filter((v) => typeof v === "string" && v.trim() !== "") : [];
}

function mapProjectToDb(userId: string, project: Project) {
  return {
    user_id: userId,
    name: project.name,
    description: project.description || null,
    // category and type are not persisted because the table doesn't have these columns
    overall_status: project.status,
    start_date: project.startDate,
    end_date: project.endDate,
    progress: project.progress,
    tags: project.tags.length ? project.tags : null,
    // store full team as JSON/array – matches existing team_members column
    team_members: project.team as TeamMember[],
  };
}

function mapDbToProject(row: DbProject, reports: WeeklyReport[], fallbackTeam?: TeamMember[]): Project {
  // The database stores team_members as array/json; if it's null, we can fall back
  const teamFromDb = (row.team_members as TeamMember[] | null) ?? [];
  const team = teamFromDb.length > 0 ? teamFromDb : fallbackTeam ?? [];

  // The database does not store category/type; we fall back to safe defaults.
  const defaultCategory: Project["category"] = "DevOps";
  const defaultType: Project["type"] = "projeto";

  const status = (row.overall_status as Project["status"]) ?? "on-track";

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    category: defaultCategory,
    type: defaultType,
    status,
    startDate: row.start_date,
    endDate: row.end_date,
    progress: typeof row.progress === "number" ? row.progress : 0,
    tags: row.tags ?? [],
    team,
    weeklyReports: reports,
  };
}

function mapReportToDb(userId: string, projectId: string, report: WeeklyReport) {
  return {
    user_id: userId,
    project_id: projectId,
    // report_date existe na tabela, mas mantemos week_start/week_end como fonte principal
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
    weekStart: row.week_start ?? "",
    weekEnd: row.week_end ?? "",
    status: (row.status as WeeklyReport["status"]) ?? "on-track",
    summary: row.summary ?? "",
    highlights: normalizeStringArray(row.highlights),
    blockers: normalizeStringArray(row.blockers),
    metrics: {
      tasksCompleted: row.tasks_completed ?? 0,
      tasksTotal: row.tasks_total ?? 0,
      incidentsResolved: row.incidents_resolved ?? 0,
      deploymentsCount: row.deployments_count ?? 0,
      uptimePercent: row.uptime_percent ?? 99.9,
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
    const payload = project.weeklyReports.map((r) => mapReportToDb(userId, insertedProject.id, r));

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

  // Use original team as fallback if DB returns no team_members
  return mapDbToProject(insertedProject, weeklyReports, project.team);
}

export async function updateProjectWithReports(
  userId: string,
  project: Project,
): Promise<Project> {
  // Atualiza os campos básicos do projeto
  const { data: updatedProject, error: updateError } = await supabase
    .from("projects")
    .update(mapProjectToDb(userId, project))
    .eq("id", project.id)
    .eq("user_id", userId)
    .select("*")
    .single<DbProject>();

  if (updateError || !updatedProject) {
    throw updateError ?? new Error("Failed to update project");
  }

  // Remove reports antigos do usuário para este projeto
  const { error: deleteError } = await supabase
    .from("project_reports")
    .delete()
    .eq("project_id", project.id)
    .eq("user_id", userId);

  if (deleteError) {
    throw deleteError;
  }

  let insertedReports: DbProjectReport[] = [];
  if (project.weeklyReports.length > 0) {
    const payload = project.weeklyReports.map((r) => mapReportToDb(userId, project.id, r));

    const { data, error: insertError } = await supabase
      .from("project_reports")
      .insert(payload)
      .select("*");

    if (insertError) {
      throw insertError;
    }

    insertedReports = (data ?? []) as DbProjectReport[];
  }

  const weeklyReports = insertedReports
    .map(mapDbReportToWeeklyReport)
    .sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));

  // Novamente, usamos o team original como fallback caso o DB não devolva
  return mapDbToProject(updatedProject, weeklyReports, project.team);
}