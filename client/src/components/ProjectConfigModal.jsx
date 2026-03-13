import React, { useState, useEffect } from 'react'
import { updateProjectConfig } from '../lib/api'

const FRAMEWORK_OPTIONS = [
    { value: 'auto', label: 'Auto Detect' },
    { value: 'next', label: 'Next.js' },
    { value: 'vite', label: 'Vite' },
    { value: 'react', label: 'React (CRA)' },
    { value: 'vue', label: 'Vue' },
    { value: 'angular', label: 'Angular' }
]

const PACKAGE_MANAGER_OPTIONS = [
    { value: 'npm', label: 'npm' },
    { value: 'pnpm', label: 'pnpm' },
    { value: 'yarn', label: 'yarn' },
    { value: 'bun', label: 'bun' }
]

function getPresetCommands(framework, packageManager) {
    const nextBuildByPm = {
        npm: 'npm run build -- --no-lint',
        pnpm: 'pnpm run build -- --no-lint',
        yarn: 'yarn build --no-lint',
        bun: 'bun run build -- --no-lint'
    }

    if (framework === 'next') {
        switch (packageManager) {
            case 'pnpm':
                return { installCommand: 'pnpm install --frozen-lockfile', buildCommand: nextBuildByPm.pnpm }
            case 'yarn':
                return { installCommand: 'yarn install --frozen-lockfile || yarn install', buildCommand: nextBuildByPm.yarn }
            case 'bun':
                return { installCommand: 'bun install', buildCommand: nextBuildByPm.bun }
            case 'npm':
            default:
                return { installCommand: 'npm install', buildCommand: nextBuildByPm.npm }
        }
    }

    switch (packageManager) {
        case 'pnpm':
            return { installCommand: 'pnpm install --frozen-lockfile', buildCommand: 'pnpm run build' }
        case 'yarn':
            return { installCommand: 'yarn install --frozen-lockfile || yarn install', buildCommand: 'yarn build' }
        case 'bun':
            return { installCommand: 'bun install', buildCommand: 'bun run build' }
        case 'npm':
        default:
            return { installCommand: 'npm install', buildCommand: 'npm run build' }
    }
}

function ProjectConfigModal({ project, onClose, onUpdate }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    // Configuration state
    const [envVars, setEnvVars] = useState([])
    const [rootDir, setRootDir] = useState('.')
    const [buildCommand, setBuildCommand] = useState('')
    const [installCommand, setInstallCommand] = useState('')
    const [framework, setFramework] = useState('auto')
    const [packageManager, setPackageManager] = useState('npm')

    // Initialize from project data
    useEffect(() => {
        if (project) {
            // Parse env object to array of key-value pairs
            const envArray = Object.entries(project.env || {}).map(([key, value]) => ({
                key,
                value,
                id: Math.random()
            }))
            setEnvVars(envArray.length > 0 ? envArray : [{ key: '', value: '', id: Math.random() }])
            setRootDir(project.rootDir || '.')
            setBuildCommand(project.buildCommand || '')
            setInstallCommand(project.installCommand || '')
            setFramework('auto')
            setPackageManager('npm')
        }
    }, [project])

    const addEnvVar = () => {
        setEnvVars([...envVars, { key: '', value: '', id: Math.random() }])
    }

    const removeEnvVar = (id) => {
        setEnvVars(envVars.filter(env => env.id !== id))
    }

    const updateEnvVar = (id, field, value) => {
        setEnvVars(envVars.map(env =>
            env.id === id ? { ...env, [field]: value } : env
        ))
    }

    const applyCommandPreset = (selectedFramework, selectedPackageManager) => {
        if (selectedFramework === 'auto') {
            setInstallCommand('')
            setBuildCommand('')
            return
        }

        const commands = getPresetCommands(selectedFramework, selectedPackageManager)
        setInstallCommand(commands.installCommand)
        setBuildCommand(commands.buildCommand)
    }

    const onFrameworkChange = (value) => {
        setFramework(value)
        applyCommandPreset(value, packageManager)
    }

    const onPackageManagerChange = (value) => {
        setPackageManager(value)
        applyCommandPreset(framework, value)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess(false)

        try {
            // Convert env array to object, filtering out empty keys
            const envObject = {}
            envVars.forEach(env => {
                if (env.key.trim()) {
                    envObject[env.key.trim()] = env.value
                }
            })

            const config = {
                env: envObject,
                rootDir: rootDir.trim(),
                buildCommand: buildCommand.trim() || undefined,
                installCommand: installCommand.trim() || undefined,
                framework,
                packageManager
            }

            console.log('Updating project config:', config)

            const response = await updateProjectConfig(project.id, config)

            if (response.status === 'success') {
                setSuccess(true)
                setTimeout(() => {
                    onUpdate && onUpdate(response.data.project)
                    onClose()
                }, 1500)
            } else {
                setError(response.error || 'Failed to update configuration')
            }
        } catch (err) {
            console.error('Error updating project config:', err)
            setError(err.message || 'Failed to update configuration')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content config-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Project Configuration</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Environment Variables Section */}
                    <div className="config-section">
                        <h3>Environment Variables</h3>
                        <p className="config-description">
                            These variables will be available in your build process via a .env file
                        </p>

                        <div className="env-vars-list">
                            {envVars.map((env, index) => (
                                <div key={env.id} className="env-var-row">
                                    <input
                                        type="text"
                                        placeholder="KEY"
                                        value={env.key}
                                        onChange={(e) => updateEnvVar(env.id, 'key', e.target.value)}
                                        className="env-key-input"
                                    />
                                    <input
                                        type="text"
                                        placeholder="value"
                                        value={env.value}
                                        onChange={(e) => updateEnvVar(env.id, 'value', e.target.value)}
                                        className="env-value-input"
                                    />
                                    {envVars.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeEnvVar(env.id)}
                                            className="btn-remove-env"
                                            title="Remove variable"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addEnvVar}
                            className="btn btn-outline btn-add-env"
                        >
                            + Add Variable
                        </button>
                    </div>

                    {/* Build Commands Section */}
                    <div className="config-section">
                        <h3>Build Settings</h3>

                        <div className="form-group">
                            <label htmlFor="framework">
                                Framework
                                <span className="label-hint">Choose your framework to auto-fill commands</span>
                            </label>
                            <select
                                id="framework"
                                value={framework}
                                onChange={(e) => onFrameworkChange(e.target.value)}
                                className="form-input"
                            >
                                {FRAMEWORK_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="packageManager">
                                Package Manager
                                <span className="label-hint">Used to generate install/build command presets</span>
                            </label>
                            <select
                                id="packageManager"
                                value={packageManager}
                                onChange={(e) => onPackageManagerChange(e.target.value)}
                                className="form-input"
                            >
                                {PACKAGE_MANAGER_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="rootDir">
                                Project Root Directory
                                <span className="label-hint">Folder in your repo where the project code is (use "." for root)</span>
                            </label>
                            <input
                                id="rootDir"
                                type="text"
                                value={rootDir}
                                onChange={(e) => setRootDir(e.target.value)}
                                placeholder="."
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="installCommand">
                                Install Command
                                <span className="label-hint">Command to install dependencies</span>
                            </label>
                            <input
                                id="installCommand"
                                type="text"
                                value={installCommand}
                                onChange={(e) => setInstallCommand(e.target.value)}
                                placeholder={framework === 'auto' ? 'Auto-detect (leave empty)' : 'Preset applied - edit if needed'}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="buildCommand">
                                Build Command
                                <span className="label-hint">Command to build your project</span>
                            </label>
                            <input
                                id="buildCommand"
                                type="text"
                                value={buildCommand}
                                onChange={(e) => setBuildCommand(e.target.value)}
                                placeholder={framework === 'auto' ? 'Auto-detect (leave empty)' : 'Preset applied - edit if needed'}
                                className="form-input"
                            />
                        </div>
                    </div>

                    {/* Examples Section */}
                    <div className="config-section config-examples">
                        <details>
                            <summary>📖 Configuration Examples</summary>
                            <div className="examples-content">
                                <div className="example">
                                    <strong>React in root folder:</strong>
                                    <code>.</code> → <code>npm install</code> → <code>npm run build</code>
                                </div>
                                <div className="example">
                                    <strong>React in client/ folder:</strong>
                                    <code>client</code> → <code>npm install</code> → <code>npm run build</code>
                                </div>
                                <div className="example">
                                    <strong>Next.js in frontend/ folder:</strong>
                                    <code>frontend</code> → <code>npm install</code> → <code>npm run build</code>
                                </div>
                            </div>
                        </details>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="alert alert-error">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {success && (
                        <div className="alert alert-success">
                            <span>✓</span> Configuration updated successfully!
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-outline"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ProjectConfigModal
