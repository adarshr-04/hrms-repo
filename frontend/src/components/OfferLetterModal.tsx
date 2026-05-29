import React, { useRef, useState, useEffect } from 'react';
import { 
  FileText, 
  X, 
  Download, 
  Save, 
  Sparkles, 
  RefreshCw, 
  User, 
  Briefcase, 
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfferLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Person data (works for both employee and candidate)
  personName: string;
  personId?: string; // e.g. employee_id like EMP001
  jobTitle: string;
  department: string;
  hireDate?: string; // ISO date string
  employmentType?: string;
  managerName?: string;
  // Actions
  onDownloadPDF: (offerText: string) => void;
  onSaveToVault?: (offerText: string) => void; // Only for Employee side
  onSaveDraft?: (offerText: string, salary: string) => void; // Only for Recruitment side
  // Optional initial values (for editing existing offers)
  initialOfferText?: string;
  initialSalary?: string;
  // Flags
  isGeneratingPdf?: boolean;
  isSaving?: boolean;
  mode: 'employee' | 'recruitment'; // Determines which action buttons to show
}

export default function OfferLetterModal({
  isOpen,
  onClose,
  personName,
  personId,
  jobTitle,
  department,
  hireDate,
  employmentType,
  managerName,
  onDownloadPDF,
  onSaveToVault,
  onSaveDraft,
  initialOfferText,
  initialSalary,
  isGeneratingPdf = false,
  isSaving = false,
  mode
}: OfferLetterModalProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [salary, setSalary] = useState(initialSalary || '');
  const [isEdited, setIsEdited] = useState(false);

  const generateDefaultTemplate = (currentSalary: string) => {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let formattedHireDate = '';
    if (hireDate) {
      try {
        formattedHireDate = new Date(hireDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (e) {
        formattedHireDate = hireDate;
      }
    }

    const hireLine = hireDate 
      ? `Your employment commences on / will commence on ${formattedHireDate || hireDate}.\n`
      : '';
    const idLine = personId 
      ? `You have been assigned Employee ID: ${personId}.\n`
      : '';

    const salaryDisplay = currentSalary 
      ? `$${Number(currentSalary).toLocaleString('en-US')}` 
      : '[salary or placeholder]';

    return `Date: ${today}

To,
${personName}

Subject: Offer of Employment — ${jobTitle}

Dear ${personName},

We are delighted to extend this offer of employment for the position of "${jobTitle}" in the ${department} department at Enterprise Corp.

${hireLine}${idLine}
Compensation:
Your annual compensation package is ${salaryDisplay} payable in monthly installments, subject to applicable tax deductions.

Employment Type: ${employmentType || 'Full-Time'}
Reporting Manager: ${managerName || 'Department Head'}
Work Location: Enterprise Corp, Head Office

This letter supersedes all previous verbal or written communications regarding your terms of employment. We are delighted to have you as part of our team and look forward to your continued contributions.

Please sign and return a copy of this letter for our records.

Warm Regards,

Human Resources Department
Enterprise Corp.`;
  };

  // Sync initial values when modal opens or inputs change
  useEffect(() => {
    if (isOpen) {
      setSalary(initialSalary || '');
      setIsEdited(!!initialOfferText);
      
      if (editorRef.current) {
        if (initialOfferText) {
          editorRef.current.innerText = initialOfferText;
        } else {
          editorRef.current.innerText = generateDefaultTemplate(initialSalary || '');
        }
      }
    }
  }, [isOpen, initialOfferText, initialSalary]);

  // Handle salary input change
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSalary(value);

    // If the text hasn't been manually edited, auto-update the salary in the editor
    if (!isEdited && editorRef.current) {
      editorRef.current.innerText = generateDefaultTemplate(value);
    }
  };

  const handleResetToDefault = () => {
    if (editorRef.current) {
      editorRef.current.innerText = generateDefaultTemplate(salary);
      setIsEdited(false);
    }
  };

  const handleInput = () => {
    setIsEdited(true);
  };

  const handleDownload = () => {
    if (editorRef.current) {
      onDownloadPDF(editorRef.current.innerText);
    }
  };

  const handleSave = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText;

    if (mode === 'employee' && onSaveToVault) {
      onSaveToVault(text);
    } else if (mode === 'recruitment' && onSaveDraft) {
      onSaveDraft(text, salary);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">Offer Letter Workspace</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Customize &amp; Issue Document</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Left Column: A4 Preview (60% / 3 cols) */}
          <div className="md:col-span-3 flex flex-col gap-2">
            <div className="flex items-center justify-between ml-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Letter Preview (Click to Edit inline)</span>
              {isEdited && (
                <span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Edited Manually
                </span>
              )}
            </div>
            
            {/* Simulated A4 Page */}
            <div className="border border-slate-200/80 rounded-2xl shadow-sm bg-slate-50/30 p-[30px] flex flex-col min-h-[500px] overflow-hidden hover:border-slate-300 transition-all group">
              {/* Letterhead */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-sm font-black text-slate-800 tracking-[0.2em] uppercase">Enterprise Corp</h1>
                  <p className="text-[10px] text-slate-400 font-medium">Head Office, Silicon Valley, CA</p>
                  <p className="text-[9px] text-slate-300">www.enterprisecorp.com</p>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-500 bg-indigo-50/50 px-2.5 py-1 rounded-full border border-indigo-100/50">
                    Official Document
                  </span>
                </div>
              </div>
              
              {/* Divider */}
              <div className="h-[2px] bg-indigo-500/20 mb-6" />

              {/* Editable Body */}
              <div 
                ref={editorRef}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={handleInput}
                className="flex-1 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap outline-none p-3 rounded-xl border border-transparent group-hover:border-slate-200/40 hover:bg-white/60 focus:bg-white focus:border-indigo-200 focus:ring-2 focus:ring-indigo-50 transition-all font-sans"
                style={{ minHeight: '320px' }}
              />

              {/* Signature Blocks */}
              <div className="mt-12 pt-6 border-t border-slate-100 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <p className="font-bold text-slate-800">Authorized Signatory</p>
                  <p className="text-slate-400 mt-1">Human Resources</p>
                  <div className="h-6 w-20 border-b border-dashed border-slate-200 mt-2" />
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="font-bold text-slate-800">Candidate Signature</p>
                  <p className="text-slate-400 mt-1">Acceptance</p>
                  <div className="h-6 w-20 border-b border-dashed border-slate-200 mt-2" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Control Panel (40% / 2 cols) */}
          <div className="md:col-span-2 flex flex-col gap-6 bg-slate-50/60 p-6 rounded-2xl border border-slate-100 self-start w-full">
            
            {/* Person Info Card */}
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2.5">Recipients Details</span>
              <div className="bg-white rounded-xl border border-slate-200/60 p-4 space-y-3.5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{personName}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{personId || 'Candidate'}</p>
                  </div>
                </div>
                
                <div className="h-[1px] bg-slate-100" />
                
                <div className="grid grid-cols-2 gap-y-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1"><Briefcase className="w-3 h-3 text-slate-400" /> Role</span>
                    <p className="font-medium text-slate-700 leading-tight">{jobTitle}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1"><Building2 className="w-3 h-3 text-slate-400" /> Dept</span>
                    <p className="font-medium text-slate-700 leading-tight">{department}</p>
                  </div>
                  {hireDate && (
                    <div className="space-y-0.5 col-span-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> Commence Date</span>
                      <p className="font-medium text-slate-700">
                        {new Date(hireDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Salary/CTC Input */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Annual CTC (Salary)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  value={salary}
                  onChange={handleSalaryChange}
                  className="w-full pl-9 pr-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200/80 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 hover:border-slate-300 transition-all outline-none"
                  placeholder="Enter annual salary..."
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Updating the salary dynamically updates the compensation section inside the document in real time.
              </p>
            </div>

            {/* Reset to Default Template */}
            <button
              onClick={handleResetToDefault}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-500 hover:text-indigo-600 py-2.5 rounded-xl text-xs font-bold transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset to Default Template
            </button>

            {/* Divider */}
            <div className="h-[1px] bg-slate-200/80 my-2" />

            {/* Action Buttons */}
            <div className="space-y-2.5 mt-auto">
              <button
                disabled={isGeneratingPdf}
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Document'}
              </button>

              {mode === 'employee' ? (
                <button
                  disabled={isSaving}
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white py-3 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving to Vault...' : 'Save to Digital Vault'}
                </button>
              ) : (
                <button
                  disabled={isSaving}
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white py-3 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving Draft...' : 'Save Offer Draft'}
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
