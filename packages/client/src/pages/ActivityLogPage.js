import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, Minus, Edit, AlertCircle, CheckCircle, XCircle, UserPlus, UserX } from 'lucide-react';

const formatValue = (value) => {
    if (value === null || typeof value === 'undefined') return '""';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        const d = new Date(value);
        if (d instanceof Date && !isNaN(d)) {
            return `"${d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}"`;
        }
    }
    return `"${String(value)}"`;
};

const PermissionChangeDetail = ({ changes }) => {
    const { added = [], removed = [] } = changes;
    if (added.length === 0 && removed.length === 0) {
        return <span className="text-gray-500">No permission changes detected.</span>;
    }
    return (
        <div className="space-y-2">
            {added.length > 0 && (
                <div className="flex items-start">
                    <Plus className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <div>
                        <strong className="font-semibold">Added:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {added.map(p => (
                                <span key={p} className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-md">{p}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {removed.length > 0 && (
                <div className="flex items-start">
                    <Minus className="w-4 h-4 text-red-500 mr-2 mt-1 flex-shrink-0" />
                    <div>
                        <strong className="font-semibold">Removed:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {removed.map(p => (
                                <span key={p} className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded-md">{p}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const RoleChangeDetail = ({ changes, targetUser }) => {
    const { from, to } = changes.role;
    return (
        <div className="flex items-center gap-2">
            {targetUser && <span className="font-semibold text-gray-800 dark:text-gray-200">{targetUser}:</span>}
            <span className="line-through text-red-500 dark:text-red-400">{from}</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="font-bold text-green-600 dark:text-green-400">{to}</span>
        </div>
    );
};

const EmployeeUpdateDetail = ({ changes }) => {
    const changedFields = Object.keys(changes);
    if (changedFields.length === 0) {
        return <span className="text-gray-500">No fields were changed.</span>;
    }
    const formatFieldName = (fieldName) => {
        return fieldName.replace(/_id$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    return (
        <div className="space-y-2">
            {changedFields.map(field => (
                <div key={field} className="flex items-start">
                    <Edit className="w-4 h-4 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                    <div>
                        <strong className="font-semibold">{formatFieldName(field)}:</strong>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="line-through text-red-500 dark:text-red-400">{formatValue(changes[field].from)}</span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                            <span className="font-bold text-green-600 dark:text-green-400">{formatValue(changes[field].to)}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const LoginFailDetail = ({ details }) => (
    <div className="flex items-center">
        <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
        <span>Reason: {details.reason} for user attempt <span className="font-semibold text-red-500 dark:text-red-400">{details.emailAttempt}</span>.</span>
    </div>
);

const SuspensionDetail = ({ results }) => (
    <div className="space-y-2">
        {results.map(result => (
            <div key={result.platform} className="flex items-center">
                {result.status === 'SUCCESS' ? <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />}
                <span className="font-semibold capitalize w-28">{result.platform}:</span>
                <span className="text-gray-600 dark:text-gray-400">{result.message}</span>
            </div>
        ))}
    </div>
);

const UserCreateDetail = ({ details, roles }) => {
    const roleId = details.createdUser?.roleId;
    
    // --- FIX: Compare types correctly (string vs number) ---
    const roleName = roles.length > 0 
        ? roles.find(r => String(r.id) === String(roleId))?.name || 'Unknown Role'
        : '...';

    return (
        <div className="flex items-start">
            <UserPlus className="w-4 h-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
            <div>
                <p>New user created: <span className="font-semibold text-green-500 dark:text-green-400">{details.targetUserEmail}</span></p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Assigned Role: <span className="font-medium">{roleName}</span></p>
            </div>
        </div>
    );
};

const UserDeleteDetail = ({ details }) => (
    <div className="flex items-center">
        <UserX className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
        <span>User deleted: <span className="font-semibold text-red-500 dark:text-red-400">{details.targetUserEmail}</span></span>
    </div>
);


const getActionTypeStyles = (actionType) => {
    if (actionType.includes('SUCCESS') || actionType.includes('CREATE')) return 'text-green-600 dark:text-green-400';
    if (actionType.includes('FAIL') || actionType.includes('DELETE') || actionType.includes('SUSPENSION')) return 'text-red-600 dark:text-red-400';
    if (actionType.includes('UPDATE') || actionType.includes('VIEW')) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-700 dark:text-gray-300';
};


export const ActivityLogPage = ({ onLogout }) => {
    const [logs, setLogs] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedLogRowId, setExpandedLogRowId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            if (!token) { onLogout(); return; }
            try {
                const [logsRes, rolesRes] = await Promise.all([
                    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/logs/activity`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${process.env.REACT_APP_API_BASE_URL}/api/roles`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                if (!logsRes.ok) throw new Error('Failed to fetch logs');
                if (!rolesRes.ok) throw new Error('Failed to fetch roles');
                
                setLogs(await logsRes.json());
                setRoles(await rolesRes.json());
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [onLogout]);
    
    const toggleRowExpansion = (logId) => {
        setExpandedLogRowId(expandedLogRowId === logId ? null : logId);
    };
    
    const getTargetDisplayName = (log) => {
        if (log.action_type === 'USER_DELETE' || log.action_type === 'USER_CREATE') {
            return log.details?.targetUserEmail || 'N/A';
        }
        if (log.target_user_email) return log.target_user_email;
        if (log.target_employee_email) return log.target_employee_email;
        if (log.details?.roleName) return `Role: ${log.details.roleName}`;
        return '—';
    };
    
    const hasDetails = (log) => log.details && Object.keys(log.details).length > 0 && JSON.stringify(log.details) !== '{}';

    const renderLogDetails = (log) => {
        if (!hasDetails(log)) return null;
        
        switch (log.action_type) {
            case 'USER_CREATE':
                return <UserCreateDetail details={log.details} roles={roles} />;
            case 'USER_DELETE':
                return <UserDeleteDetail details={log.details} />;
            case 'USER_LOGIN_FAIL':
                return <LoginFailDetail details={log.details} />;
            case 'USER_ROLE_UPDATE':
                return <RoleChangeDetail changes={log.details.changes} targetUser={log.details.targetUserEmail} />;
            case 'ROLE_PERMISSIONS_UPDATE':
                return <PermissionChangeDetail changes={log.details.changes} />;
            case 'EMPLOYEE_UPDATE':
                return <EmployeeUpdateDetail changes={log.details.changes} />;
            case 'MANUAL_PLATFORM_SUSPENSION':
                return <SuspensionDetail results={log.details.deactivation_results} />;
            default:
                return <pre className="text-xs whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-2 rounded-md">{JSON.stringify(log.details, null, 2)}</pre>;
        }
    };

    const LogDetailComponent = ({log}) => (
        <div className="p-3 bg-white dark:bg-gray-800 rounded-md text-sm shadow-inner">
            <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Details:</h4>
            {renderLogDetails(log)}
        </div>
    );

    return (
        <div className="p-4 sm:p-6">
            <h1 className="text-2xl font-bold">Activity Log</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Recent events recorded in the system.</p>

            <div className="mt-4 space-y-4 md:hidden">
                {loading ? <p>Loading logs...</p> : logs.map(log => (
                    <div key={log.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start">
                            <div className={`font-semibold text-base ${getActionTypeStyles(log.action_type)}`}>
                                {log.action_type.replace(/_/g, ' ')}
                            </div>
                            {hasDetails(log) && (
                                <button onClick={() => toggleRowExpansion(log.id)} className="p-1 -mr-1 text-gray-400">
                                    <ChevronRight className={`w-5 h-5 transition-transform ${expandedLogRowId === log.id ? 'rotate-90' : ''}`}/>
                                </button>
                            )}
                        </div>
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <p><strong className="font-medium text-gray-800 dark:text-gray-200">Actor:</strong> {log.actor_email || 'System (or Deleted User)'}</p>
                            <p><strong className="font-medium text-gray-800 dark:text-gray-200">Target:</strong> {getTargetDisplayName(log)}</p>
                            <p className="text-xs pt-1">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                        {expandedLogRowId === log.id && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <LogDetailComponent log={log} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hidden md:block">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="w-1/4 px-6 py-3 text-left text-xs font-bold uppercase">Timestamp</th>
                            <th className="w-1/4 px-6 py-3 text-left text-xs font-bold uppercase">Actor</th>
                            <th className="w-1/4 px-6 py-3 text-left text-xs font-bold uppercase">Action</th>
                            <th className="w-1/4 px-6 py-3 text-left text-xs font-bold uppercase">Target</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan="4" className="text-center p-6">Loading logs...</td></tr>
                        ) : logs.map(log => (
                            <React.Fragment key={log.id}>
                                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{log.actor_email || 'System (or Deleted User)'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                        <div className={getActionTypeStyles(log.action_type)}>
                                            {hasDetails(log) ? (
                                                <button onClick={() => toggleRowExpansion(log.id)} className="flex items-center gap-1 hover:underline">
                                                    <span>{log.action_type.replace(/_/g, ' ')}</span>
                                                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedLogRowId === log.id ? 'rotate-90' : ''}`}/>
                                                </button>
                                            ) : (
                                                <span>{log.action_type.replace(/_/g, ' ')}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getTargetDisplayName(log)}</td>
                                </tr>
                                {expandedLogRowId === log.id && (
                                    <tr>
                                        <td colSpan="4" className="p-4 bg-gray-100 dark:bg-gray-900/50">
                                            <LogDetailComponent log={log} />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};