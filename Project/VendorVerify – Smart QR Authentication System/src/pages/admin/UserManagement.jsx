import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, Button, Badge, useToast } from '../../components/UI';
import { Search, Ban, CheckCircle, Mail, User, ShieldAlert } from 'lucide-react';

const UserManagement = () => {
    const { addToast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            addToast('Failed to load users', 'error');
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    const toggleBanStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
        const action = newStatus === 'banned' ? 'banned' : 'unbanned';

        const { error } = await supabase
            .from('users')
            .update({ status: newStatus })
            .eq('id', userId);

        if (error) {
            console.error('Error updating user status:', error);
            addToast(`Failed to ${action} user`, 'error');
        } else {
            addToast(`User successfully ${action}`, 'success');
            fetchUsers();
        }
    };

    const filteredUsers = users.filter(user =>
        (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.role || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="font-display" style={{ fontSize: '1.75rem' }}>User Management</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage user access and permissions</p>
                </div>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                        className="input-field"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            paddingLeft: '3rem',
                            paddingRight: '1rem',
                            width: '100%',
                            height: '42px',
                            boxSizing: 'border-box',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            outline: 'none',
                            transition: 'all 0.2s',
                            fontSize: '0.875rem'
                        }}
                    />
                </div>
            </div>

            <Card style={{ padding: 0 }}>
                <div className="table-container" style={{ border: 'none' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No users found</td></tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ background: 'var(--border)', padding: '0.5rem', borderRadius: '50%' }}>
                                                    <User size={20} color="var(--text-muted)" />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{user.full_name || 'N/A'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <Badge type={user.role === 'admin' ? 'error' : user.role === 'vendor' ? 'info' : 'success'}>
                                                {user.role}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Badge type={user.status === 'banned' ? 'error' : 'success'}>
                                                {user.status || 'active'}
                                            </Badge>
                                        </td>
                                        <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            {user.role !== 'admin' && (
                                                <Button
                                                    variant={user.status === 'banned' ? 'default' : 'outline'}
                                                    onClick={() => toggleBanStatus(user.id, user.status)}
                                                    style={{
                                                        height: '2rem',
                                                        width: '130px',
                                                        fontSize: '0.75rem',
                                                        padding: '0 0.75rem',
                                                        display: 'inline-flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        backgroundColor: user.status === 'banned' ? 'var(--success)' : 'transparent',
                                                        borderColor: user.status === 'banned' ? 'var(--success)' : 'var(--error)',
                                                        color: user.status === 'banned' ? 'white' : 'var(--error)'
                                                    }}
                                                >
                                                    {user.status === 'banned' ? (
                                                        <><CheckCircle size={14} /> Release Ban</>
                                                    ) : (
                                                        <><Ban size={14} /> Ban</>
                                                    )}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default UserManagement;
