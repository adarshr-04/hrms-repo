"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FieldError, UseFormRegisterReturn } from "react-hook-form";
import { 
  Save, User, Lightbulb, Loader2, Camera, ChevronDown, ArrowRight 
} from "lucide-react";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { employeeService } from "@/services/employeeService";

/** 
 * UTILS 
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 
 * TYPES 
 */
interface EmployeeFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  employee_id: string;
  job_title: string;
  department: string;
  branch: string;
  hire_date: string;
  employment_type: string;
  status: string;
}

const EMPLOYMENT_TYPES = [
  { label: "Full Time", value: "FULL_TIME" },
  { label: "Part Time", value: "PART_TIME" },
  { label: "Contract", value: "CONTRACT" },
];

/** 
 * MAIN COMPONENT 
 */
export default function AddEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<EmployeeFormData>({
    defaultValues: {
      first_name: "", last_name: "", email: "", phone_number: "",
      date_of_birth: "", employee_id: "", job_title: "",
      department: "", branch: "", hire_date: "",
      employment_type: "FULL_TIME", status: "ACTIVE",
    },
  });

  const onSubmit = async (data: EmployeeFormData) => {
    setLoading(true);
    try {
      await employeeService.create(data);
      toast.success("Employee created successfully");
      router.push("/employees");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  return (
    <div className="w-full max-w-[1300px] mx-auto px-4 py-8">
      <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-8 transition-all", loading && "pointer-events-none opacity-70")}>
        
        {/* HEADER */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Onboard New Employee</h1>
          <p className="text-sm font-medium text-slate-500">Create a new employee profile with primary information.</p>
        </div>

        {/* MAIN CARD */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 gap-14 lg:grid-cols-12">
              
              {/* LEFT COLUMN */}
              <div className="space-y-10 lg:col-span-8">
                <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
                  <FormSelect
                    label="Employee Type"
                    required
                    error={errors.employment_type}
                    registration={register("employment_type", { required: "Required" })}
                    options={EMPLOYMENT_TYPES}
                  />

                  <FormInput
                    label="Employee ID"
                    required
                    placeholder="EMP001"
                    error={errors.employee_id}
                    registration={register("employee_id", { required: "Required" })}
                    rightIcon={
                      <button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-100 bg-white text-indigo-600 shadow-sm transition hover:bg-indigo-50">
                        <Lightbulb className="h-4 w-4" />
                      </button>
                    }
                  />

                  <FormInput label="First Name" required placeholder="Edward" error={errors.first_name} registration={register("first_name", { required: "Required" })} />
                  <FormInput label="Last Name" required placeholder="Hilton" error={errors.last_name} registration={register("last_name", { required: "Required" })} />
                  <FormInput label="Mobile Number" required placeholder="9876543210" error={errors.phone_number} registration={register("phone_number", { required: "Required" })} />
                  <FormInput label="Email Address" type="email" required placeholder="edward@company.com" error={errors.email} registration={register("email", { required: "Required" })} />
                </div>

                {/* SEND PROFILE INFO BAR */}
                <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                  <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded accent-indigo-600" />
                  <div>
                    <p className="text-sm font-bold text-slate-700">Send Profile Form</p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">The employee will receive an invitation to complete additional details.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
                  <FormInput label="Department" placeholder="Engineering" registration={register("department")} />
                  <FormInput label="Date of Birth" type="date" registration={register("date_of_birth")} />
                  <FormInput label="Job Title" placeholder="Senior Developer" registration={register("job_title")} />
                  <FormInput label="Hire Date" type="date" registration={register("hire_date")} />

                  <div className="col-span-full space-y-2">
                    <label className="ml-1 text-[13px] font-bold uppercase tracking-wider text-slate-600">Work Location / Branch Address</label>
                    <textarea 
                      rows={4} 
                      placeholder="Enter office branch address..." 
                      {...register("branch")}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: AVATAR */}
              <div className="lg:col-span-4">
                <label htmlFor="avatar-upload" className="group relative flex aspect-[4/5] w-full cursor-pointer flex-col items-center justify-center gap-6 overflow-hidden rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 shadow-inner transition-all hover:border-indigo-300 hover:bg-indigo-50/50">
                  <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <>
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-slate-300 shadow-lg transition-all group-hover:rotate-3 group-hover:text-indigo-400">
                        <Camera className="h-10 w-10" />
                      </div>
                      <div className="px-6 text-center">
                        <p className="text-sm font-bold text-slate-500 transition-colors group-hover:text-indigo-600">Upload Avatar</p>
                        <p className="mt-2 text-[10px] font-medium uppercase tracking-widest text-slate-400">512px Square | Max 5MB</p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-end gap-6 border-t border-slate-100 bg-slate-50/80 px-12 py-8">
            <button type="button" onClick={() => router.back()} className="text-sm font-bold text-slate-400 transition-colors hover:text-slate-700">Cancel</button>
            <div className="flex items-center gap-4">
              <button type="button" className="h-12 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50">Save Draft</button>
              <button type="submit" disabled={loading} className="group flex h-12 items-center gap-3 rounded-xl bg-indigo-600 px-8 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Confirm & Create
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

/** 
 * SUB-COMPONENTS 
 */

function FormInput({ label, required, type = "text", placeholder, error, registration, rightIcon }: any) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-[13px] font-bold uppercase tracking-wider text-slate-600">{label} {required && <span className="ml-1 text-rose-500">*</span>}</label>
      <div className="relative">
        <input type={type} placeholder={placeholder} {...registration} className={cn("h-12 w-full rounded-xl border bg-slate-50 px-4 font-medium text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-300 focus:bg-white", rightIcon && "pr-14", error ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-indigo-500")} />
        {rightIcon && <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightIcon}</div>}
      </div>
      {error && <p className="ml-1 text-xs font-medium text-rose-500">{error.message}</p>}
    </div>
  );
}

function FormSelect({ label, required, error, registration, options }: any) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-[13px] font-bold uppercase tracking-wider text-slate-600">{label} {required && <span className="ml-1 text-rose-500">*</span>}</label>
      <div className="relative">
        <select {...registration} className={cn("h-12 w-full appearance-none rounded-xl border bg-slate-50 px-4 font-medium text-slate-700 shadow-sm outline-none transition-all focus:bg-white", error ? "border-rose-300 focus:border-rose-500" : "border-slate-200 focus:border-indigo-500")}>
          {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}