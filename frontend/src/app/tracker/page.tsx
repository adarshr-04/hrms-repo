'use client';

import React, { useState, useEffect } from 'react';
import './tracker.css';

interface Task {
    id: string;
    slNo: number;
    date: string;
    task: string;
    status: 'Completed' | 'In Progress' | 'Not Started';
    owner: 'Adarsh' | 'Rounak' | '';
    remarks: string;
}

export default function TrackerPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load data from localStorage
    useEffect(() => {
        const savedTasks = localStorage.getItem('project_tasks');
        if (savedTasks) {
            setTasks(JSON.parse(savedTasks));
        } else {
            // Initial empty row
            setTasks([{
                id: crypto.randomUUID(),
                slNo: 1,
                date: new Date().toISOString().split('T')[0],
                task: '',
                status: 'Not Started',
                owner: '',
                remarks: ''
            }]);
        }
        setIsLoaded(true);
    }, []);

    // Save data to localStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('project_tasks', JSON.stringify(tasks));
        }
    }, [tasks, isLoaded]);

    const handleAddTask = () => {
        const newTask: Task = {
            id: crypto.randomUUID(),
            slNo: tasks.length + 1,
            date: new Date().toISOString().split('T')[0],
            task: '',
            status: 'Not Started',
            owner: '',
            remarks: ''
        };
        setTasks([...tasks, newTask]);
    };

    const handleUpdateTask = (id: string, field: keyof Task, value: any) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const handleDeleteTask = (id: string) => {
        const updatedTasks = tasks.filter(t => t.id !== id).map((t, index) => ({
            ...t,
            slNo: index + 1
        }));
        setTasks(updatedTasks);
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Completed': return 'badge-completed';
            case 'In Progress': return 'badge-progress';
            default: return 'badge-notstarted';
        }
    };

    return (
        <div className="tracker-container">
            <header className="tracker-header">
                <div>
                    <h1>Project Progress Tracker</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Track daily tasks for Adarsh & Rounak
                    </p>
                </div>
                <button className="action-btn" onClick={handleAddTask}>
                    + Add New Task
                </button>
            </header>

            <div className="spreadsheet-wrapper">
                <table className="spreadsheet">
                    <thead>
                        <tr>
                            <th className="sl-col">SL NO</th>
                            <th className="date-col">DATE</th>
                            <th className="task-col">WORK / TASKS</th>
                            <th className="status-col">STATUS</th>
                            <th className="owner-col">WORK DONE BY</th>
                            <th className="remarks-col">REMARKS</th>
                            <th style={{ width: '50px', borderRight: 'none' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map((task) => (
                            <tr key={task.id}>
                                <td className="sl-col">{task.slNo}</td>
                                <td className="date-col">
                                    <input 
                                        type="date" 
                                        className="cell-input" 
                                        value={task.date}
                                        onChange={(e) => handleUpdateTask(task.id, 'date', e.target.value)}
                                    />
                                </td>
                                <td className="task-col">
                                    <input 
                                        type="text" 
                                        className="cell-input" 
                                        placeholder="What did you work on?"
                                        value={task.task}
                                        onChange={(e) => handleUpdateTask(task.id, 'task', e.target.value)}
                                    />
                                </td>
                                <td className="status-col">
                                    <select 
                                        className={`status-select ${getStatusClass(task.status)}`}
                                        value={task.status}
                                        onChange={(e) => handleUpdateTask(task.id, 'status', e.target.value as any)}
                                    >
                                        <option value="Not Started">Not Started</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </td>
                                <td className="owner-col">
                                    <select 
                                        className="owner-select"
                                        value={task.owner}
                                        onChange={(e) => handleUpdateTask(task.id, 'owner', e.target.value as any)}
                                    >
                                        <option value="">Select Member</option>
                                        <option value="Adarsh">Adarsh</option>
                                        <option value="Rounak">Rounak</option>
                                    </select>
                                </td>
                                <td className="remarks-col">
                                    <input 
                                        type="text" 
                                        className="cell-input" 
                                        placeholder="Any notes..."
                                        value={task.remarks}
                                        onChange={(e) => handleUpdateTask(task.id, 'remarks', e.target.value)}
                                    />
                                </td>
                                <td style={{ borderRight: 'none', textAlign: 'center' }}>
                                    <button 
                                        className="delete-btn"
                                        onClick={() => handleDeleteTask(task.id)}
                                        title="Delete Row"
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
