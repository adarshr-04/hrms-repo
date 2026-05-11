"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ChevronLeft, Save, User, Briefcase, MapPin, Loader2 } from 'lucide-react';
import { employeeService } from '@/services/employeeService';

export default function AddEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    // Departments and branches are now simple text fields, so no fetching needed.
  }, []);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Note: In a real scenario, we'd also need to create a User account 
      // or handle the OneToOne relationship correctly.
      // For now, we'll assume the backend handles the user creation or 
      // we'll pass a dummy user ID if required.
      
      // Temporary: ensure the data matches what the API expects
      const payload = {
        ...data,
        // user: 1, // Mock user ID for now
      };
      
      await employeeService.create(payload);
      router.push('/employees');
    } catch (error) {
      console.error("Failed to create employee", error);
      alert("Error creating employee. Please check the console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Employee</h1>
          <p className="text-slate-500">Create a new employee profile and system account.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <User className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900">Personal Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">First Name</label>
              <input 
                {...register("first_name", { required: true })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Last Name</label>
              <input 
                {...register("last_name", { required: true })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <input 
                {...register("email", { required: true, pattern: /^\S+@\S+$/i })}
                type="email"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="john.doe@company.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Phone Number</label>
              <input 
                {...register("phone_number")}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Date of Birth</label>
              <input 
                {...register("date_of_birth", { required: true })}
                type="date"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* Employment Details */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900">Employment Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Employee ID</label>
              <input 
                {...register("employee_id", { required: true })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="EMP001"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Job Title</label>
              <input 
                {...register("job_title", { required: true })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Department</label>
              <input 
                {...register("department", { required: true })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="Engineering"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Branch</label>
              <input 
                {...register("branch", { required: true })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                placeholder="Main HQ"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Hire Date</label>
              <input 
                {...register("hire_date", { required: true })}
                type="date"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Employment Type</label>
              <select 
                {...register("employment_type", { required: true })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-4">
          <button 
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all shadow-md shadow-indigo-200 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Employee
          </button>
        </div>
      </form>
    </div>
  );
}
