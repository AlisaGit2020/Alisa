export default function getApiUrl(path: string) {
    const apiBasePath = import.meta.env.VITE_API_URL;
    return `${apiBasePath}/${path}`;
}