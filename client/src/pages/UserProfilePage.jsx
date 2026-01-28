import React, { useState, useEffect, useContext } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { getUserProfile } from '../lib/api.js'
import { COLORS } from '../constants/design'
import { ThemeContext } from '../App.jsx'

function UserProfilePage() {
    const { user, logout } = useAuth()
    const { theme, setTheme } = useContext(ThemeContext)
    const [profileData, setProfileData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('account')
    const [formData, setFormData] = useState({})
    const [selectedTheme, setSelectedTheme] = useState(theme)

    useEffect(() => {
        if (user?.uid) {
            fetchUserProfile()
        }
    }, [user])

    const fetchUserProfile = async () => {
        try {
            setLoading(true)
            setError('')

            const response = await getUserProfile(user.uid)

            if (response.status === 'success') {
                setProfileData(response.data.user)
                setFormData({
                    name: user.displayName || '',
                    email: user.email || '',
                    photoURL: user.photoURL || ''
                })
            } else {
                setError('Failed to load profile data')
            }
        } catch (err) {
            console.error('Error fetching user profile:', err)
            setError('Failed to load profile data')
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        // API call would go here
        console.log('Updating profile:', formData)
    }

    const handleChangePassword = () => {
        // Implementation for password change
        console.log('Change password')
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: 'var(--bg-root)' }}>
                <div className="w-12 h-12 rounded-full animate-spin border-4" style={{ borderColor: 'var(--accent-hover)', borderTopColor: 'var(--accent-primary)' }}></div>
                <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Loading profile...</p>
            </div>
        )
    }

    return (
        <div style={{ background: 'var(--bg-root)' }} className="min-h-screen">
            {/* Header */}
            <section className="border-b shadow-soft" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Account Settings</h1>
                    <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Manage your profile and preferences</p>
                </div>
            </section>

            {/* Tabs */}
            <div className="max-w-6xl mx-auto px-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab('account')}
                        className={`px-4 py-4 border-b-2 font-medium transition-colors ${activeTab === 'account' ? '' : ''}`}
                        style={{
                            borderBottom: activeTab === 'account' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            color: activeTab === 'account' ? 'var(--accent-primary)' : 'var(--text-muted)',
                        }}
                    >
                        Account
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`px-4 py-4 border-b-2 font-medium transition-colors ${activeTab === 'security' ? '' : ''}`}
                        style={{
                            borderBottom: activeTab === 'security' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            color: activeTab === 'security' ? 'var(--accent-primary)' : 'var(--text-muted)',
                        }}
                    >
                        Security
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-4 border-b-2 font-medium transition-colors ${activeTab === 'settings' ? '' : ''}`}
                        style={{
                            borderBottom: activeTab === 'settings' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            color: activeTab === 'settings' ? 'var(--accent-primary)' : 'var(--text-muted)',
                        }}
                    >
                        Settings
                    </button>
                </div>
            </div>

            {/* Content */}
            <section className="max-w-6xl mx-auto px-6 py-12">
                {/* Account Tab */}
                {activeTab === 'account' && (
                    <div className="max-w-2xl">
                        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Profile Information</h2>
                        <p className="mb-8" style={{ color: 'var(--text-muted)' }}>Update your personal details</p>

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            {/* Avatar */}
                            <div>
                                <label className="block text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Profile Picture</label>
                                <div className="flex items-center gap-6">
                                    <div
                                        className="w-24 h-24 rounded-lg border-2 flex items-center justify-center text-3xl"
                                        style={{ borderColor: 'var(--accent-hover)', background: 'var(--accent-hover)' }}
                                    >
                                        {user?.photoURL ? (
                                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover rounded-lg" />
                                        ) : null}
                                    </div>
                                    <div>
                                        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>JPG, PNG or GIF (max 5MB)</p>
                                        <button
                                            type="button"
                                            className="px-4 py-2 rounded-md border transition-colors text-sm font-medium"
                                            style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', background: 'transparent' }}
                                        >
                                            Upload New Photo
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-md border"
                                    style={{ borderColor: 'var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-4 py-2 rounded-md border"
                                    style={{ borderColor: 'var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                                />
                                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Email cannot be changed</p>
                            </div>

                            {/* Joined Date */}
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Member Since</label>
                                <input
                                    type="text"
                                    value={user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
                                    disabled
                                    className="w-full px-4 py-2 rounded-md border"
                                    style={{ borderColor: 'var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-md font-medium transition-all"
                                    style={{ background: 'var(--button-bg)', color: 'var(--button-text)' }}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="max-w-2xl space-y-8">
                        {/* Password Section */}
                        <div>
                            <h2 className="text-2xl font-bold text-charcoal mb-2">Password</h2>
                            <p className="text-text-muted mb-6">Update your password to keep your account secure</p>

                            <div className="bg-white rounded-lg shadow-soft border border-beige-light p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-charcoal mb-1">Password</h3>
                                        <p className="text-sm text-text-muted">Last changed 2 months ago</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleChangePassword}
                                        className="px-4 py-2 rounded-md border text-sage border-sage hover:bg-beige-light transition-colors text-sm font-medium"
                                    >
                                        Change Password
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Two-Factor Authentication */}
                        <div>
                            <h3 className="text-lg font-bold text-charcoal mb-4">Two-Factor Authentication</h3>
                            <div className="bg-white rounded-lg shadow-soft border border-beige-light p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-charcoal mb-1">Authenticator App</h4>
                                        <p className="text-sm text-text-muted">Use an authenticator app for extra security</p>
                                    </div>
                                    <button
                                        className="px-4 py-2 rounded-md border text-sage border-sage hover:bg-beige-light transition-colors text-sm font-medium"
                                    >
                                        Set Up
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Active Sessions */}
                        <div>
                            <h3 className="text-lg font-bold text-charcoal mb-4">Active Sessions</h3>
                            <div className="bg-white rounded-lg shadow-soft border border-beige-light p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-charcoal mb-1">Current Device</h4>
                                        <p className="text-sm text-text-muted">Last active: Just now</p>
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded-full text-sage" style={{ background: COLORS.BEIGE }}>Current</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="max-w-2xl space-y-8">
                        {/* Notification Settings */}
                        <div>
                            <h2 className="text-2xl font-bold text-charcoal mb-6">Preferences</h2>

                            <h3 className="text-lg font-semibold text-charcoal mb-4">Notifications</h3>
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg shadow-soft border border-beige-light p-6 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-charcoal">Email Notifications</h4>
                                        <p className="text-sm text-text-muted">Get notified about deployment updates</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" defaultChecked className="sr-only peer" />
                                        <div
                                            className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 rounded-full peer"
                                            style={{ '--tw-ring-color': COLORS.SAGE }}
                                        >
                                            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-all peer-checked:left-5.5" style={{ background: COLORS.SAGE }}></div>
                                        </div>
                                    </label>
                                </div>

                                <div className="bg-white rounded-lg shadow-soft border border-beige-light p-6 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-charcoal">Deployment Alerts</h4>
                                        <p className="text-sm text-text-muted">Alerts for failed or critical deployments</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" defaultChecked className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 rounded-full peer">
                                            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-all peer-checked:left-5.5" style={{ background: COLORS.SAGE }}></div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Display Settings */}
                        <div>
                            <h3 className="text-lg font-semibold text-charcoal mb-4">Display</h3>
                            <div className="bg-white rounded-lg shadow-soft border border-beige-light p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-charcoal">Theme</h4>
                                        <p className="text-sm text-text-muted">Choose your preferred theme</p>
                                    </div>
                                    <select
                                        className="px-4 py-2 rounded-md border"
                                        style={{ borderColor: COLORS.CHARCOAL_LIGHT + '4d' }}
                                        value={selectedTheme}
                                        onChange={(e) => {
                                            setSelectedTheme(e.target.value)
                                            setTheme(e.target.value)
                                        }}
                                    >
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div>
                            <h3 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h3>
                            <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                                <h4 className="font-semibold text-red-700 mb-2">Logout from All Devices</h4>
                                <p className="text-sm text-red-600 mb-4">Sign out from all active sessions</p>
                                <button
                                    className="px-4 py-2 rounded-md border border-red-600 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
                                >
                                    Logout All Sessions
                                </button>
                            </div>
                        </div>

                        <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                            <h4 className="font-semibold text-red-700 mb-2">Delete Account</h4>
                            <p className="text-sm text-red-600 mb-4">Permanently delete your account and all data</p>
                            <button
                                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium"
                                onClick={logout}
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}

export default UserProfilePage
