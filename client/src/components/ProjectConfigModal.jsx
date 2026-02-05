import React, { useState, useEffect } from 'react'
import { updateProjectConfig } from '../lib/api'

function ProjectConfigModal({ project, onClose, onUpdate }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    // Configuration state
    const [envVars, setEnvVars] = useState([])
    const [rootDir, setRootDir] = useState('.')
    const [buildCommand, setBuildCommand] = useState('npm run build')
    const [installCommand, setInstallCommand] = useState('npm install')

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
            setBuildCommand(project.buildCommand || 'npm run build')
            setInstallCommand(project.installCommand || 'npm install')
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
                buildCommand: buildCommand.trim(),
                installCommand: installCommand.trim()
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
                                placeholder="npm install"
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
                                placeholder="npm run build"
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
