import { FolderOpen, GitBranch, AlertTriangle, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Header from '../components/layout/Header'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import projects from '../data/projects.json'
import violations from '../data/violations.json'

const recentActivity = [
  { icon: '🔍', text: 'Analyse terminée sur', target: 'EcommerceApp', time: 'Il y a 2h', color: 'text-violet-400' },
  { icon: '⚠️', text: '3 violations détectées dans', target: 'BankingSystem', time: 'Il y a 5h', color: 'text-amber-400' },
  { icon: '📊', text: 'Nouveau diagramme créé sur', target: 'EcommerceApp', time: 'Hier', color: 'text-sky-400' },
  { icon: '✅', text: 'Violation corrigée dans', target: 'AuthGateway', time: 'Hier', color: 'text-emerald-400' },
  { icon: '🤖', text: 'Rapport IA généré pour', target: 'BankingSystem', time: 'Il y a 2j', color: 'text-violet-400' },
]

const scoreColor = (s: number) => s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-amber-400' : 'text-red-400'
const scoreBg = (s: number) => s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-amber-500' : 'bg-red-500'

export default function Dashboard() {
  const analyzed = projects.filter(p => p.status === 'analyzed')
  const totalViolations = violations.length
  const avgScore = Math.round(analyzed.reduce((a, p) => a + p.score, 0) / analyzed.length)

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Dashboard" subtitle="Vue d'ensemble de vos projets et analyses" />

      <div className="flex-1 px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Projets analysés" value={analyzed.length} icon={FolderOpen} trend="+2 ce mois" trendUp color="purple" />
          <StatCard label="Diagrammes UML" value={10} icon={GitBranch} trend="+5 ce mois" trendUp color="sky" />
          <StatCard label="Violations actives" value={totalViolations} icon={AlertTriangle} trend="-3 cette semaine" trendUp={false} color="amber" />
          <StatCard label="Score moyen" value={`${avgScore}/100`} icon={TrendingUp} trend="+4 pts" trendUp color="emerald" />
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Projets récents */}
          <div className="col-span-2 bg-[#12141c] border border-[#1e2235] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Projets récents</h3>
              <Link to="/projects" className="text-violet-400 hover:text-violet-300 text-xs">Voir tout →</Link>
            </div>

            <div className="space-y-2">
              {projects.slice(0, 4).map(project => (
                <Link key={project.id} to={`/projects/${project.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400 shrink-0">
                    <FolderOpen size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-slate-200 text-sm font-medium group-hover:text-white">{project.name}</p>
                      <Badge
                        label={project.status === 'analyzed' ? 'Analysé' : project.status === 'pending' ? 'En cours' : project.status === 'new' ? 'Nouveau' : 'Erreur'}
                        variant={project.status === 'analyzed' ? 'success' : project.status === 'pending' ? 'warning' : 'neutral'}
                      />
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">{project.language}</p>
                  </div>
                  {project.score > 0 && (
                    <div className="text-right shrink-0">
                      <span className={`text-sm font-bold ${scoreColor(project.score)}`}>{project.score}</span>
                      <span className="text-slate-600 text-xs">/100</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Activité récente */}
          <div className="bg-[#12141c] border border-[#1e2235] rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Activité récente</h3>
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base mt-0.5">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {a.text} <span className={`font-medium ${a.color}`}>{a.target}</span>
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="text-slate-600" />
                      <span className="text-[10px] text-slate-600">{a.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Score par projet */}
        <div className="bg-[#12141c] border border-[#1e2235] rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Score d'architecture par projet</h3>
          <div className="space-y-3">
            {projects.filter(p => p.score > 0).map(project => (
              <div key={project.id} className="flex items-center gap-4">
                <span className="text-slate-300 text-xs w-32 truncate">{project.name}</span>
                <div className="flex-1 bg-[#1e2235] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${scoreBg(project.score)}`}
                    style={{ width: `${project.score}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 w-16 justify-end">
                  <CheckCircle2 size={12} className={scoreColor(project.score)} />
                  <span className={`text-xs font-semibold ${scoreColor(project.score)}`}>{project.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
