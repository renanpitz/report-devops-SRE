import { useState } from 'react';
import { Project, ProjectStatus, ProjectType, TeamMember, WeeklyReport } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Minus } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (project: Project) => void;
}

const defaultStatus: ProjectStatus = 'on-track';
const defaultType: ProjectType = 'projeto';

const NewProjectModal = ({ isOpen, onClose, onCreate }: NewProjectModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Project['category']>('DevOps');
  const [type, setType] = useState<ProjectType>(defaultType);
  const [status, setStatus] = useState<ProjectStatus>(defaultStatus);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [progress, setProgress] = useState(0);
  const [tags, setTags] = useState<string>('');

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberSeniority, setNewMemberSeniority] = useState<TeamMember['seniority']>('Pleno');

  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [reportWeekStart, setReportWeekStart] = useState('');
  const [reportWeekEnd, setReportWeekEnd] = useState('');
  const [reportStatus, setReportStatus] = useState<ProjectStatus>('on-track');
  const [reportSummary, setReportSummary] = useState('');
  const [reportHighlights, setReportHighlights] = useState('');
  const [reportBlockers, setReportBlockers] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('DevOps');
    setType(defaultType);
    setStatus(defaultStatus);
    setStartDate('');
    setEndDate('');
    setProgress(0);
    setTags('');
    setTeam([]);
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberSeniority('Pleno');
    setWeeklyReports([]);
    setReportWeekStart('');
    setReportWeekEnd('');
    setReportStatus('on-track');
    setReportSummary('');
    setReportHighlights('');
    setReportBlockers('');
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    const member: TeamMember = {
      id: Math.random().toString(36).slice(2, 10),
      name: newMemberName.trim(),
      role: newMemberRole.trim() || 'Sem cargo',
      seniority: newMemberSeniority,
    };
    setTeam(prev => [...prev, member]);
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberSeniority('Pleno');
  };

  const handleRemoveMember = (id: string) => {
    setTeam(prev => prev.filter(m => m.id !== id));
  };

  const handleAddReport = () => {
    if (!reportWeekStart || !reportWeekEnd || !reportSummary.trim()) return;
    const report: WeeklyReport = {
      id: Math.random().toString(36).slice(2, 10),
      weekStart: reportWeekStart,
      weekEnd: reportWeekEnd,
      status: reportStatus,
      summary: reportSummary.trim(),
      highlights: reportHighlights
        .split(';')
        .map(s => s.trim())
        .filter(Boolean),
      blockers: reportBlockers
        .split(';')
        .map(s => s.trim())
        .filter(Boolean),
      metrics: {
        tasksCompleted: 0,
        tasksTotal: 0,
        incidentsResolved: 0,
        deploymentsCount: 0,
        uptimePercent: 99.9,
      },
    };
    setWeeklyReports(prev => [report, ...prev]);
    setReportWeekStart('');
    setReportWeekEnd('');
    setReportStatus('on-track');
    setReportSummary('');
    setReportHighlights('');
    setReportBlockers('');
  };

  const handleRemoveReport = (id: string) => {
    setWeeklyReports(prev => prev.filter(r => r.id !== id));
  };

  const handleSubmit = () => {
    if (!name.trim() || !startDate || !endDate) return;

    const project: Project = {
      id: Math.random().toString(36).slice(2, 10),
      name: name.trim(),
      description: description.trim(),
      category,
      type,
      status,
      startDate,
      endDate,
      progress,
      tags: tags
        .split(';')
        .map(s => s.trim())
        .filter(Boolean),
      team,
      weeklyReports,
    };

    onCreate(project);
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 animate-slide-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Novo Projeto</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Informações básicas */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Informações Gerais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Nome do Projeto</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: DEM MetLife" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as Project['category'])}
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                >
                  <option value="DevOps">DevOps</option>
                  <option value="SRE">SRE</option>
                  <option value="Platform">Platform</option>
                  <option value="Infrastructure">Infrastructure</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Tipo</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as ProjectType)}
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                >
                  <option value="projeto">Projeto</option>
                  <option value="operacao">Operação</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as ProjectStatus)}
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                >
                  <option value="on-track">No Prazo</option>
                  <option value="at-risk">Em Risco</option>
                  <option value="delayed">Atrasado</option>
                  <option value="completed">Concluído</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Descrição</label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Resumo executivo do projeto..."
                className="min-h-[80px] bg-secondary border-border"
              />
            </div>
          </section>

          {/* Datas, progresso e tags */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Planejamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Início</label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Fim</label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Progresso (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={e => setProgress(Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Tags (separe por ;)</label>
              <Input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="Ex: DEM;Monitoring;APM"
              />
            </div>
          </section>

          {/* Equipe */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Equipe Ativa</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Nome</label>
                <Input
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  placeholder="Ex: Ana Silva"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Cargo</label>
                <Input
                  value={newMemberRole}
                  onChange={e => setNewMemberRole(e.target.value)}
                  placeholder="Ex: SRE Engineer"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Senioridade</label>
                <select
                  value={newMemberSeniority}
                  onChange={e => setNewMemberSeniority(e.target.value as TeamMember['seniority'])}
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                >
                  <option value="Junior">Junior</option>
                  <option value="Pleno">Pleno</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Staff">Staff</option>
                  <option value="Principal">Principal</option>
                </select>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1 gap-1.5"
              onClick={handleAddMember}
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar membro
            </Button>

            {team.length > 0 && (
              <div className="mt-3 space-y-2">
                {team.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.role} · {member.seniority}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-muted-foreground hover:text-danger"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Reports */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Reports Semanais (opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Início da semana</label>
                <Input
                  type="date"
                  value={reportWeekStart}
                  onChange={e => setReportWeekStart(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Fim da semana</label>
                <Input
                  type="date"
                  value={reportWeekEnd}
                  onChange={e => setReportWeekEnd(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Status</label>
                <select
                  value={reportStatus}
                  onChange={e => setReportStatus(e.target.value as ProjectStatus)}
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                >
                  <option value="on-track">No Prazo</option>
                  <option value="at-risk">Em Risco</option>
                  <option value="delayed">Atrasado</option>
                  <option value="completed">Concluído</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Resumo</label>
              <Textarea
                value={reportSummary}
                onChange={e => setReportSummary(e.target.value)}
                placeholder="Resumo da semana..."
                className="min-h-[70px] bg-secondary border-border"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Destaques (separe por ;)
                </label>
                <Textarea
                  value={reportHighlights}
                  onChange={e => setReportHighlights(e.target.value)}
                  placeholder="Ex: Reprocessamento 100%;Dashboard finalizado"
                  className="min-h-[60px] bg-secondary border-border"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Blockers (separe por ;)
                </label>
                <Textarea
                  value={reportBlockers}
                  onChange={e => setReportBlockers(e.target.value)}
                  placeholder="Ex: Acesso pendente;Hardware limitado"
                  className="min-h-[60px] bg-secondary border-border"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1 gap-1.5"
              onClick={handleAddReport}
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar report
            </Button>

            {weeklyReports.length > 0 && (
              <div className="mt-3 space-y-2">
                {weeklyReports.map(r => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium text-foreground">
                        {r.weekStart} — {r.weekEnd} ({r.status})
                      </p>
                      <p className="text-muted-foreground line-clamp-2">{r.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveReport(r.id)}
                      className="text-muted-foreground hover:text-danger ml-3"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!name || !startDate || !endDate}>
              Criar Projeto
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewProjectModal;