import { useState, useMemo, useEffect } from 'react';
import { Project, ProjectStatus, Professional } from '@/types/project';
import { mockProjects } from '@/data/mockProjects';
import { mockProfessionals } from '@/data/mockProfessionals';
import ProjectCard from '@/components/ProjectCard';
import ProjectDetail from '@/components/ProjectDetail';
import ExecutiveDashboard from '@/components/ExecutiveDashboard';
import ProfessionalModal from '@/components/ProfessionalModal';
import TeamTab from '@/components/TeamTab';
import UploadModal from '@/components/UploadModal';
import NewProjectModal from '@/components/NewProjectModal';
import EditProjectModal from '@/components/EditProjectModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Upload, LayoutGrid, Activity, BarChart3, FolderKanban, Users, Plus } from 'lucide-react';
import { createProjectWithReports, updateProjectWithReports, loadProjectsForUser } from '@/lib/supabaseProjects';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthProvider';

const statusFilters: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'No Prazo', value: 'on-track' },
  { label: 'Atrasado', value: 'delayed' },
  { label: 'Em Risco', value: 'at-risk' },
];

type TabView = 'dashboard' | 'projects' | 'team';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [professionals, setProfessionals] = useState<Professional[]>(mockProfessionals);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>('dashboard');
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const { toast } = useToast();

  // Carrega projetos reais do Supabase para o usuário logado
  useEffect(() => {
    if (!user || authLoading) return;

    setIsLoadingProjects(true);
    loadProjectsForUser(user.id)
      .then((dbProjects) => {
        if (dbProjects.length > 0) {
          setProjects(dbProjects);
        } else {
          // Se o usuário ainda não tem nada salvo, mantemos os mocks
          setProjects(mockProjects);
        }
      })
      .catch((error) => {
        console.error('Erro ao carregar projetos do Supabase', error);
        toast({
          title: 'Não foi possível carregar seus projetos',
          description: 'Mostrando dados de exemplo enquanto isso.',
        });
        setProjects(mockProjects);
      })
      .finally(() => {
        setIsLoadingProjects(false);
      });
  }, [user, authLoading, toast]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (
        searchQuery &&
        !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      if (dateFrom && p.startDate < dateFrom) return false;
      if (dateTo && p.endDate > dateTo) return false;
      return true;
    });
  }, [projects, statusFilter, searchQuery, dateFrom, dateTo]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleUpload = (newProjects: Project[], newProfessionals: Professional[]) => {
    setProjects(prev => {
      const updated = [...prev];
      newProjects.forEach(np => {
        const idx = updated.findIndex(p => p.id === np.id);
        if (idx >= 0) updated[idx] = np;
        else updated.push(np);
      });
      return updated;
    });
    if (newProfessionals.length > 0) {
      setProfessionals(prev => {
        const updated = [...prev];
        newProfessionals.forEach(np => {
          const idx = updated.findIndex(p => p.name.toLowerCase() === np.name.toLowerCase());
          if (idx >= 0) updated[idx] = np;
          else updated.push(np);
        });
        return updated;
      });
    }
  };

  const handleProfessionalClick = (name: string) => {
    const found = professionals.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (found) {
      setSelectedProfessional(found);
    } else {
      const memberProjects: Professional['projectHistory'] = [];
      let role = '';
      let seniority: Professional['seniority'] = 'Pleno';
      projects.forEach(p => {
        const member = p.team.find(m => m.name.toLowerCase() === name.toLowerCase());
        if (member) {
          role = member.role;
          seniority = member.seniority;
          memberProjects.push({
            projectName: p.name,
            role: member.role,
            period: `${p.startDate} — ${p.endDate}`,
            current: true,
          });
        }
      });
      setSelectedProfessional({
        id: 'temp',
        name,
        role,
        seniority,
        resumo: 'Perfil não cadastrado na planilha de profissionais.',
        softSkills: [],
        certifications: [],
        skills: [],
        projectHistory: memberProjects,
      });
    }
  };

  const handleCreateProject = async (project: Project) => {
    setIsSavingProject(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        toast({
          title: 'Você não está logado',
          description: 'Entre na sua conta para salvar projetos no banco de dados.',
        });
        return;
      }

      const userId = userData.user.id;

      const saved = await createProjectWithReports(userId, project);
      setProjects(prev => [saved, ...prev]);
      setActiveTab('projects');
      toast({
        title: 'Projeto criado',
        description: 'O projeto foi salvo no banco de dados com sucesso.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro ao salvar projeto',
        description: 'Não foi possível salvar o projeto no banco. Tente novamente.',
      });
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleUpdateProject = async (project: Project) => {
    setIsUpdatingProject(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        toast({
          title: 'Você não está logado',
          description: 'Entre na sua conta para editar projetos no banco de dados.',
        });
        return;
      }

      const userId = userData.user.id;
      const updated = await updateProjectWithReports(userId, project);

      setProjects(prev =>
        prev.map(p => (p.id === updated.id ? updated : p)),
      );

      setEditingProject(null);
      toast({
        title: 'Projeto atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro ao atualizar projeto',
        description: 'Não foi possível salvar as alterações. Tente novamente.',
      });
    } finally {
      setIsUpdatingProject(false);
    }
  };

  if (isLoadingProjects && !selectedProjectId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando seus projetos...</p>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <ProjectDetail
            project={selectedProject}
            onBack={() => setSelectedProjectId(null)}
            onMemberClick={handleProfessionalClick}
            onEdit={(p) => setEditingProject(p)}
          />
        </div>
        <ProfessionalModal
          professional={selectedProfessional}
          onClose={() => setSelectedProfessional(null)}
        />
        <EditProjectModal
          isOpen={!!editingProject}
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={handleUpdateProject}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Activity className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Status Report Dashboard</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              DevOps & SRE — Relatório semanal de projetos
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => {
              setNewProjectOpen(true);
              setActiveTab('projects');
            }}
          >
            <Plus className="h-4 w-4" />
            Novo Projeto
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-1 bg-secondary/50 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Resumo Executivo
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'projects'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FolderKanban className="h-4 w-4" />
            Projetos
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'team'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            Equipe
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 ml-2"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>

        {activeTab === 'dashboard' && (
          <ExecutiveDashboard
            projects={projects}
            professionals={professionals}
            onProfessionalClick={handleProfessionalClick}
            onProjectClick={id => setSelectedProjectId(id)}
          />
        )}

        {activeTab === 'team' && (
          <TeamTab
            professionals={professionals}
            projects={projects}
            onProfessionalClick={handleProfessionalClick}
          />
        )}

        {activeTab === 'projects' && (
          <>
            {/* Filters */}
            <div className="mb-6 glass-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar projetos..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 bg-secondary border-border"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">De:</span>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="w-36 bg-secondary border-border text-sm"
                  />
                  <span className="text-xs text-muted-foreground">Até:</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="w-36 bg-secondary border-border text-sm"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  {statusFilters.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setStatusFilter(f.value)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        statusFilter === f.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setNewProjectOpen(true)}
                  disabled={isSavingProject}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {isSavingProject ? 'Salvando...' : 'Novo Projeto'}
                </Button>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={setSelectedProjectId}
                />
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-16">
                <LayoutGrid className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Nenhum projeto encontrado com os filtros aplicados.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
      />
      <NewProjectModal
        isOpen={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onCreate={handleCreateProject}
      />
      <EditProjectModal
        isOpen={!!editingProject && !selectedProject}
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onSave={handleUpdateProject}
      />
      <ProfessionalModal
        professional={selectedProfessional}
        onClose={() => setSelectedProfessional(null)}
      />
    </div>
  );
};

export default Index;