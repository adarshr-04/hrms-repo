'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { projectService, TaskLog } from '@/services/projectService';
import { Loader2, Plus, Trash2, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import './tracker.css';

export default function TrackerPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Load data from Backend
    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await projectService.getTaskLogs();
            const results = data.results || data;
            if (results.length === 0) {
                // Seed one empty row if none exist
                setTasks([{
                    id: 'temp-' + Date.now(),
                    date: new Date().toISOString().split('T')[0],
                    task_description: '',
                    status: 'Not Started',
                    owner: '',
                    remarks: '',
                    isNew: true
                }]);
            } else {
                setTasks(results);
            }
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = () => {
        const newTask = {
            id: 'temp-' + Date.now(),
            date: new Date().toISOString().split('T')[0],
            task_description: '',
            status: 'Not Started',
            owner: '',
            remarks: '',
            isNew: true
        };
        setTasks([...tasks, newTask]);
    };

    const handleUpdateTask = async (id: string | number, field: string, value: any) => {
        // Optimistic Update
        const updatedTasks = tasks.map(t => t.id === id ? { ...t, [field]: value } : t);
        setTasks(updatedTasks);

        const task = updatedTasks.find(t => t.id === id);
        if (!task) return;

        // Auto-save logic
        try {
            setSaving(true);
            if (task.isNew) {
                // If it's a new empty row, only save if it has content
                if (task.task_description || task.owner) {
                    const { id: _, isNew: __, ...payload } = task;
                    const created = await projectService.createTaskLog(payload);
                    setTasks(prev => prev.map(t => t.id === id ? { ...created, isNew: false } : t));
                }
            } else {
                await projectService.updateTaskLog(id, { [field]: value });
            }
            setLastSaved(new Date());
        } catch (error) {
            console.error("Failed to save task", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTask = async (id: string | number) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // Optimistic Delete
        setTasks(tasks.filter(t => t.id !== id));

        if (!task.isNew) {
            try {
                await projectService.deleteTaskLog(id);
                setLastSaved(new Date());
            } catch (error) {
                console.error("Failed to delete task", error);
                // Rollback if needed, but for logs usually fine
            }
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Completed': return 'badge-completed';
            case 'In Progress': return 'badge-progress';
            default: return 'badge-notstarted';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing with Cloud Database...</p>
            </div>
        );
    }

    return (
        <div className="tracker-container">
            <header className="tracker-header">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Project Progress Tracker</h1>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-slate-500 text-sm font-medium">Persistent tracking for Adarsh & Rounak</p>
                        {lastSaved && (
                            <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Synced {lastSaved.toLocaleTimeString()}</span>
                            </div>
                        )}
                        {saving && (
                            <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Saving...</span>
                            </div>
                        )}
                    </div>
                </div>
                <button className="action-btn flex items-center gap-2" onClick={handleAddTask}>
                    <Plus className="w-4 h-4" />
                    <span>Add New Entry</span>
                </button>
            </header>

            <div className="spreadsheet-wrapper rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 bg-white">
                <table className="spreadsheet">
                    <thead>
                        <tr>
                            <th className="sl-col">#</th>
                            <th className="date-col">DATE</th>
                            <th className="task-col">WORK / TASKS</th>
                            <th className="status-col">STATUS</th>
                            <th className="owner-col">OWNER</th>
                            <th className="remarks-col">REMARKS</th>
                            <th style={{ width: '50px', borderRight: 'none' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map((task, index) => (
                            <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="sl-col text-slate-400 font-bold text-[10px]">{index + 1}</td>
                                <td className="date-col">
                                    <input 
                                        type="date" 
                                        className="cell-input font-bold text-slate-600" 
                                        value={task.date}
                                        onChange={(e) => handleUpdateTask(task.id, 'date', e.target.value)}
                                    />
                                </td>
                                <td className="task-col">
                                    <input 
                                        type="text" 
                                        className="cell-input" 
                                        placeholder="What did you work on?"
                                        value={task.task_description}
                                        onChange={(e) => handleUpdateTask(task.id, 'task_description', e.target.value)}
                                    />
                                </td>
                                <td className="status-col">
                                    <select 
                                        className={`status-select ${getStatusClass(task.status)} font-black uppercase text-[10px] tracking-widest`}
                                        value={task.status}
                                        onChange={(e) => handleUpdateTask(task.id, 'status', e.target.value)}
                                    >
                                        <option value="Not Started">Not Started</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </td>
                                <td className="owner-col">
                                    <select 
                                        className="owner-select font-bold text-slate-700"
                                        value={task.owner}
                                        onChange={(e) => handleUpdateTask(task.id, 'owner', e.target.value)}
                                    >
                                        <option value="">Select Member</option>
                                        <option value="Adarsh">Adarsh</option>
                                        <option value="Rounak">Rounak</option>
                                    </select>
                                </td>
                                <td className="remarks-col">
                                    <input 
                                        type="text" 
                                        className="cell-input text-slate-500 italic" 
                                        placeholder="Any notes..."
                                        value={task.remarks || ''}
                                        onChange={(e) => handleUpdateTask(task.id, 'remarks', e.target.value)}
                                    />
                                </td>
                                <td style={{ borderRight: 'none', textAlign: 'center' }}>
                                    <button 
                                        className="delete-btn opacity-20 hover:opacity-100 hover:text-rose-600 transition-all"
                                        onClick={() => handleDeleteTask(task.id)}
                                        title="Delete Row"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div>
                    <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Cloud Sync Enabled</h3>
                    <p className="text-xs text-indigo-700 mt-1 leading-relaxed font-medium">
                        Your task logs are now automatically synchronized with the secure HRMS database. Data loss due to browser cache clearing is no longer a risk.
                    </p>
                </div>
            </div>
        </div>
    );
}
