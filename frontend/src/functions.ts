export default function getApiUrl(path: string) {
    const apiBasePath = import.meta.env.VITE_API_URL;
    return `${apiBasePath}/${path}`;
}

export function getNumber(value: string, decimals: number) {

    const floatNumber = parseFloat(value)
    if (floatNumber) {
        return parseFloat(floatNumber.toFixed(decimals));
    }
}
