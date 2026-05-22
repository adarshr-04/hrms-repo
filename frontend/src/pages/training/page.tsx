import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  Clock, 
  Search,
  Filter,
  Plus,
  Loader2,
  BookOpen,
  Award,
  X,
  CheckCircle2,
  PlusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { trainingService } from '@/services/trainingService';
import { employeeService } from '@/services/employeeService';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function TrainingPage() {
  const { user, isHR, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Modals state
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<any>(null);
  
  // Forms state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProgram, setNewProgram] = useState({
    training_name: '',
    trainer_name: '',
    training_date: '',
    duration: '',
    description: ''
  });

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [rosterLoading, setRosterLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [trainingsData, enrollmentsData] = await Promise.all([
        trainingService.getTrainings(),
        trainingService.getEnrollments()
      ]);
      setTrainings(trainingsData.results || trainingsData);
      setEnrollments(enrollmentsData.results || enrollmentsData);

      if (isHR || isAdmin) {
        const empData = await employeeService.getAll();
        const empList = Array.isArray(empData) ? empData : (empData.results || []);
        setEmployees(empList);
        if (empList.length > 0) {
          setSelectedEmployee(String(empList[0].id));
        }
      } else if (user?.employee_profile_id) {
        // Standard employee can only select themselves
        setSelectedEmployee(String(user.employee_profile_id));
      }
    } catch (error) {
      console.error("Failed to load training dashboard datasets", error);
      toast.error("Failed to load training programs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [isHR, isAdmin, user?.employee_profile_id]);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgram.training_name || !newProgram.trainer_name || !newProgram.training_date) {
      toast.error("Please fill in all mandatory training details.");
      return;
    }

    setIsSubmitting(true);
    try {
      await trainingService.createTraining(newProgram);
      toast.success("New curriculum program published successfully!");
      setShowAddProgramModal(false);
      setNewProgram({
        training_name: '',
        trainer_name: '',
        training_date: '',
        duration: '',
        description: ''
      });
      await loadData();
    } catch (error: any) {
      console.error("Failed to publish training program", error);
      toast.error("Failed to publish program. Check permissions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnrollEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTraining) return;
    if (!selectedEmployee) {
      toast.error("Please select a colleague to enroll.");
      return;
    }

    // Check if already enrolled
    const alreadyEnrolled = enrollments.some(
      e => e.training === selectedTraining.id && String(e.employee) === selectedEmployee
    );
    if (alreadyEnrolled) {
      toast.error("Colleague is already enrolled in this curriculum program.");
      return;
    }

    setRosterLoading(true);
    try {
      await trainingService.enrollEmployee({
        training: selectedTraining.id,
        employee: Number(selectedEmployee),
        status: 'ENROLLED'
      });
      toast.success("Enrollment registered successfully!");
      // Reload roster data
      const updatedEnrollments = await trainingService.getEnrollments();
      setEnrollments(updatedEnrollments.results || updatedEnrollments);
    } catch (error: any) {
      console.error("Failed to register enrollment", error);
      const errMsg = error.response?.data?.non_field_errors?.[0] || "Enrollment failed. Already registered?";
      toast.error(errMsg);
    } finally {
      setRosterLoading(false);
    }
  };

  const getEnrollmentCount = (trainingId: number) => {
    return enrollments.filter(e => e.training === trainingId).length;
  };

  const getActiveRoster = (trainingId: number) => {
    return enrollments.filter(e => e.training === trainingId);
  };

  const filteredTrainings = trainings.filter(t => {
    const query = searchQuery.toLowerCase();
    return (
      (t.training_name || '').toLowerCase().includes(query) ||
      (t.trainer_name || '').toLowerCase().includes(query) ||
      (t.description || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Training & Development</h1>
          <p className="text-slate-500">Manage employee upskilling programs and certification tracks.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search curriculum..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          {(isHR || isAdmin) && (
            <button 
              onClick={() => setShowAddProgramModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Program</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full p-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p>Loading curriculum...</p>
          </div>
        ) : filteredTrainings.length === 0 ? (
          <div className="col-span-full p-20 flex flex-col items-center justify-center text-slate-500 gap-4 text-center bg-white rounded-xl border border-slate-200">
            <GraduationCap className="w-12 h-12 text-slate-300" />
            <div>
              <p className="text-lg font-bold text-slate-900">No training programs</p>
              <p className="text-sm max-w-xs mx-auto text-slate-500 mt-1">Create your first training course to start building your team&apos;s expertise.</p>
            </div>
          </div>
        ) : (
          filteredTrainings.map((training) => {
            const enrollCount = getEnrollmentCount(training.id);
            const userEnrollment = enrollments.find(e => e.training === training.id && e.employee === user?.employee_profile_id);
            
            return (
              <div key={training.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col sm:flex-row">
                <div className="sm:w-48 bg-slate-50 flex flex-col items-center justify-center p-6 text-indigo-600 border-b sm:border-b-0 sm:border-r border-slate-100">
                  <BookOpen className="w-12 h-12 mb-2" />
                  <div className="px-3 py-1 bg-white border border-indigo-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Certification
                  </div>
                </div>
                
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{training.training_name}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">Lead: {training.trainer_name}</p>
                    </div>
                    {userEnrollment && (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-tight">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{userEnrollment.status}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 italic">
                    &quot;{training.description}&quot;
                  </p>

                  <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{training.training_date ? format(new Date(training.training_date), 'MMM d, yyyy') : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{training.duration || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1 text-xs text-indigo-600 font-bold">
                      <Users className="w-4 h-4" />
                      <span>{enrollCount} Enrolled</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {!userEnrollment && !isHR && !isAdmin && (
                        <button 
                          onClick={async () => {
                            if (!user?.employee_profile_id) {
                              toast.error("Employee profile not found.");
                              return;
                            }

                            try {
                              await trainingService.enrollEmployee({
                                training: training.id,
                                employee: user.employee_profile_id,
                                status: 'ENROLLED'
                              });
                              toast.success("Successfully registered for course!");
                              await loadData();
                            } catch (e) {
                              toast.error("Failed to self-enroll.");
                            }
                          }}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Self-Enroll</span>
                        </button>
                      )}
                      {(isHR || isAdmin) && (
                        <button 
                          onClick={() => {
                            setSelectedTraining(training);
                            setShowRosterModal(true);
                          }}
                          className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
                        >
                          Manage Roster
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Program Modal */}
      {showAddProgramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">New Upskilling Program</h3>
              <button 
                onClick={() => setShowAddProgramModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Program Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Django Advanced Security Architecture"
                  value={newProgram.training_name}
                  onChange={(e) => setNewProgram(prev => ({ ...prev, training_name: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Trainer Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Aisha Rahman"
                  value={newProgram.trainer_name}
                  onChange={(e) => setNewProgram(prev => ({ ...prev, trainer_name: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Training Date</label>
                  <input 
                    type="date"
                    value={newProgram.training_date}
                    onChange={(e) => setNewProgram(prev => ({ ...prev, training_date: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Duration</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 2 weeks, 10 hours"
                    value={newProgram.duration}
                    onChange={(e) => setNewProgram(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Course Outline Description</label>
                <textarea
                  placeholder="Provide syllabus, prerequisites, and learning objectives..."
                  value={newProgram.description}
                  onChange={(e) => setNewProgram(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProgramModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSubmitting ? 'Publishing...' : 'Publish Program'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Roster Modal */}
      {showRosterModal && selectedTraining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Manage Program Roster</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedTraining.training_name}</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedTraining(null);
                  setShowRosterModal(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Enrollment form */}
              <form onSubmit={handleEnrollEmployee} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Enroll Staff Member</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      required
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name} ({emp.department_name || 'Staff'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={rosterLoading}
                    className="flex items-center justify-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                  >
                    {rosterLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Register</span>
                  </button>
                </div>
              </form>

              {/* Roster list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Currently Enrolled ({getEnrollmentCount(selectedTraining.id)})</h4>
                <div className="divide-y divide-slate-100 border border-slate-250 rounded-xl overflow-hidden bg-white max-h-60 overflow-y-auto">
                  {getActiveRoster(selectedTraining.id).length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 italic">
                      No staff members currently enrolled.
                    </div>
                  ) : (
                    getActiveRoster(selectedTraining.id).map((enrollment) => (
                      <div key={enrollment.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold uppercase">
                            {enrollment.employee_name?.split(' ').map((n: any) => n[0]).join('') || '??'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{enrollment.employee_name}</p>
                            <p className="text-[9px] text-indigo-600 font-medium">Registered: {format(new Date(enrollment.enrollment_date), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-bold uppercase rounded-md">
                          {enrollment.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

