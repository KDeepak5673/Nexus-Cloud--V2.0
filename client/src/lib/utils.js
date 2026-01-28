// Utility functions for generating project URLs
export const getProjectUrl = (subDomain, isLive = true) => {
    if (!subDomain) return null;

    // For development/local testing
    const baseUrl = 'localhost:8000';

    // For production, you would use your actual domain
    // const baseUrl = 'yourdomain.com';

    return `http://${subDomain}.${baseUrl}`;
};

export const getProjectDisplayUrl = (subDomain) => {
    if (!subDomain) return null;

    // For development/local testing
    const baseUrl = 'localhost:8000';

    // For production, you would use your actual domain
    // const baseUrl = 'yourdomain.com';

    return `${subDomain}.${baseUrl}`;
};

export const isProjectLive = (deploymentStatus) => {
    return deploymentStatus === 'READY';
};