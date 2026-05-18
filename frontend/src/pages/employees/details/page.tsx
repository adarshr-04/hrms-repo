
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Briefcase,
  FileText,
  History,
  Settings,
  MoreVertical,
  Loader2,
  Clock,
  User,
  ExternalLink,
  Edit,
  Trash2,
  Plus,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { employeeService } from '@/services/employeeService';
import { toast } from 'sonner';

export default function EmployeeProfilePage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchEmployee = async () => {
    setLoading(true);
    try {
      if (!id) return;
      const data = await employeeService.getById(id as string);
      setEmployee(data);
    } catch (error) {
      console.error("Failed to fetch employee", error);
      toast.error("Employee profile not found");
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmployee();
    }
  }, [id]);

  const getAvatarUrl = (path: string) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
    return `${baseUrl}${path}`;
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to remove this personnel record from the active registry? This action is logged for audit purposes.")) {
      try {
        await employeeService.delete(id as string);
        toast.success("Personnel record archived successfully");
        navigate('/employees');
      } catch (error) {
        console.error("Deletion failed", error);
        toast.error("Failed to archive record. Permission denied or server error.");
      }
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
        <p className="text-[10px] font-bold tracking-[0.4em] text-slate-400 uppercase">Opening Dossier...</p>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="space-y-10 pb-20 bg-[#FAFAFA] min-h-screen -m-6 p-10">
      {/* Back & Actions */}
      <div className="flex items-center justify-between">
        <Link to="/employees" className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Return to Registry</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to={`/employees/edit?id=${id}`}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Update Credentials</span>
          </Link>
          <button 
            onClick={handleDelete}
            className="p-2.5 text-rose-400 hover:text-rose-600 bg-white border border-slate-200 rounded-xl transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          {/* Avatar Section */}
          <div className="relative">
            <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden bg-slate-50 border-4 border-white shadow-xl">
              {employee.avatar ? (
                <img src={getAvatarUrl(employee.avatar)} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200 text-6xl font-extralight">
                  {employee.first_name[0]}
                </div>
              )}
            </div>
            <div className={cn(
              "absolute -right-2 -bottom-2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-4 border-white shadow-lg",
              employee.status === 'ACTIVE' ? "bg-emerald-500 text-white" : "bg-slate-400 text-white"
            )}>
              {employee.status}
            </div>
          </div>

          {/* Identity Section */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-semibold text-slate-900 tracking-tight">
                {employee.first_name} <span className="font-light">{employee.last_name}</span>
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">{employee.job_title || 'MEMBER'}</p>
                <div className="w-1 h-1 rounded-full bg-slate-200 hidden md:block" />
                <div className="flex items-center gap-1.5 text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black tracking-widest uppercase">{employee.employee_id}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2">
              <InfoBadge icon={<Mail className="w-3 h-3" />} text={employee.email} />
              <InfoBadge icon={<Phone className="w-3 h-3" />} text={employee.phone_number || 'N/A'} />
              <InfoBadge icon={<Building2 className="w-3 h-3" />} text={employee.department_name || 'General Org'} />
            </div>
          </div>
        </div>

        {/* Header Texture Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-10" />
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-10 border-b border-slate-200/60 pb-1">
        <TabButton id="overview" label="Dossier Overview" active={activeTab === 'overview'} onClick={setActiveTab} />
        <TabButton id="employment" label="Employment Logic" active={activeTab === 'employment'} onClick={setActiveTab} />
        <TabButton id="documents" label="Digital Vault" active={activeTab === 'documents'} onClick={setActiveTab} />
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-10">
          {activeTab === 'overview' && (
             <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
                <Section title="Personal Identification">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <DataField label="Full Legal Name" value={`${employee.first_name} ${employee.last_name}`} />
                      <DataField label="Date of Birth" value={employee.date_of_birth || 'Not Recorded'} />
                      <DataField label="Primary Communication" value={employee.email} />
                      <DataField label="Alternate Email" value={employee.alternative_email || 'None'} />
                   </div>
                </Section>
                <Section title="Residential Details">
                   <div className="space-y-6">
                      <DataField label="Current Registry Address" value={employee.current_address || 'Unspecified'} />
                      <DataField label="Permanent Registry Address" value={employee.permanent_address || 'Same as current'} />
                   </div>
                </Section>
             </div>
          )}

          {activeTab === 'employment' && (
             <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
                <Section title="Organizational Alignment">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <DataField label="Reporting Unit" value={employee.department_name || 'Global'} />
                      <DataField label="Executive Manager" value={employee.manager_name || 'Self-Directed'} />
                      <DataField label="Commission Date" value={employee.hire_date || 'N/A'} />
                      <DataField label="Service Tenure" value="Active Member" />
                   </div>
                </Section>
             </div>
          )}

          {activeTab === 'documents' && (
             <div className="bg-white border border-slate-200/60 rounded-[2rem] p-10 text-center space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                   <p className="text-lg font-semibold text-slate-900 tracking-tight">The Digital Vault is Empty</p>
                   <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">No secure documents have been uploaded to this personnel dossier yet.</p>
                </div>
                <button className="text-indigo-600 font-bold text-sm uppercase tracking-widest hover:underline">Upload Document</button>
             </div>
          )}
        </div>

        {/* Right Column: Timeline/Quick Info */}
        <div className="space-y-10">
           <Section title="Service Timeline">
              <div className="space-y-8">
                 <TimelineItem date={employee.hire_date} title="Onboarding Completed" desc="Member officially entered the registry." icon={<Plus className="w-3 h-3" />} />
                 <TimelineItem date="Current" title="Active Status" desc="Personnel is currently operational." icon={<UserCheck className="w-3 h-3" />} isLast />
              </div>
           </Section>
        </div>
      </div>
    </div>
  );
}

function InfoBadge({ icon, text }: any) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
      <span className="text-slate-400">{icon}</span>
      <span className="text-[10px] font-bold text-slate-600 tracking-tight uppercase">{text}</span>
    </div>
  );
}

function TabButton({ id, label, active, onClick }: any) {
  return (
    <button 
      onClick={() => onClick(id)}
      className={cn(
        "pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative",
        active ? "text-slate-900" : "text-slate-300 hover:text-slate-500"
      )}
    >
      {label}
      {active && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900" />}
    </button>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">{title}</h3>
      <div className="bg-white border border-slate-200/60 rounded-[2rem] p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function DataField({ label, value }: any) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-medium text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}

function TimelineItem({ date, title, desc, icon, isLast }: any) {
  return (
    <div className="flex gap-6">
       <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
             {icon}
          </div>
          {!isLast && <div className="w-[1px] h-12 bg-slate-100 my-2" />}
       </div>
       <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">{date || 'N/A'}</p>
          <p className="text-xs font-bold text-slate-900">{title}</p>
          <p className="text-[11px] text-slate-400 leading-relaxed">{desc}</p>
       </div>
    </div>
  );
}
