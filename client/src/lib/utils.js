// Utility functions for generating project URLs
export const getProjectUrl = (subDomain, isLive = true) => {
    if (!subDomain) return null;

    const baseUrl = import.meta.env.VITE_DEPLOYMENT_BASE_DOMAIN
        || (import.meta.env.DEV ? 'localhost:8000' : 'nexus-cloud.tech');
    const protocol = import.meta.env.VITE_DEPLOYMENT_URL_PROTOCOL
        || (baseUrl.includes('localhost') ? 'http' : 'https');

    return `${protocol}://${subDomain}.${baseUrl}`;
};

export const getProjectDisplayUrl = (subDomain) => {
    if (!subDomain) return null;

    const baseUrl = import.meta.env.VITE_DEPLOYMENT_BASE_DOMAIN
        || (import.meta.env.DEV ? 'localhost:8000' : 'nexus-cloud.tech');

    return `${subDomain}.${baseUrl}`;
};

export const isProjectLive = (deploymentStatus) => {
    return deploymentStatus === 'READY';
};

// Utility to join class names conditionally (small `cn` helper similar to clsx)
export const cn = (...args) => {
    return args.flat().filter(Boolean).join(' ');
};