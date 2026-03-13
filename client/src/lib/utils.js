// Utility functions for generating project URLs
export const getProjectUrl = (subDomain, isLive = true) => {
    if (!subDomain) return null;

    // Derive the proxy base from the API base URL so both point to the same server
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:9000';
    const baseUrl = apiBase.replace(/^https?:\/\//, '');

    return `http://${subDomain}.${baseUrl}`;
};

export const getProjectDisplayUrl = (subDomain) => {
    if (!subDomain) return null;

    // Derive the proxy base from the API base URL so both point to the same server
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:9000';
    const baseUrl = apiBase.replace(/^https?:\/\//, '');

    return `${subDomain}.${baseUrl}`;
};

export const isProjectLive = (deploymentStatus) => {
    return deploymentStatus === 'READY';
};