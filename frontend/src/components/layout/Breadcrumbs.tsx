import { Breadcrumbs, Link, Stack } from "@mui/material"
import { WithTranslation, withTranslation } from "react-i18next";
import { useLocation } from "react-router-dom"
import { useEffect, useState, useMemo } from "react";
import ApiClient from "@alisa-lib/api-client";

interface EntityNameCache {
    [key: string]: string;
}

function AlisaBreadcrumbs({ t }: WithTranslation) {
    const location = useLocation()
    const [entityNames, setEntityNames] = useState<EntityNameCache>({});

    const pathSegments = useMemo(() =>
        location.pathname.split('/').filter(crumb => crumb !== '' && crumb !== '0'),
        [location.pathname]
    );

    useEffect(() => {
        const fetchEntityNames = async () => {
            const newNames: EntityNameCache = {};

            for (let i = 0; i < pathSegments.length; i++) {
                const segment = pathSegments[i];
                const prevSegment = i > 0 ? pathSegments[i - 1] : null;

                // Check if segment is a numeric ID
                if (/^\d+$/.test(segment)) {
                    const id = parseInt(segment);
                    const cacheKey = `${prevSegment}-${id}`;

                    // Determine which entity to fetch based on context
                    if (prevSegment === 'edit' || prevSegment === 'properties') {
                        // Look for properties context
                        const contextSegment = pathSegments.find(s => s === 'properties');
                        if (contextSegment) {
                            try {
                                const property = await ApiClient.get<{ id: number; name: string }>('/real-estate/property', id);
                                if (property?.name) {
                                    newNames[cacheKey] = property.name;
                                }
                            } catch {
                                // Keep using ID if fetch fails
                            }
                        }
                    }
                }
            }

            if (Object.keys(newNames).length > 0) {
                setEntityNames(prev => ({ ...prev, ...newNames }));
            }
        };

        fetchEntityNames();
    }, [pathSegments]);

    const crumbs = useMemo(() => {
        return pathSegments.map((crumb, index) => {
            const linkPath = '/' + pathSegments.slice(0, index + 1).join('/');
            const prevSegment = index > 0 ? pathSegments[index - 1] : null;

            let displayText = t(decodeURIComponent(crumb));

            // If it's a numeric ID, try to get the entity name
            if (/^\d+$/.test(crumb)) {
                const cacheKey = `${prevSegment}-${crumb}`;
                if (entityNames[cacheKey]) {
                    displayText = entityNames[cacheKey];
                }
            }

            return (
                <Link key={index} href={linkPath}>{displayText + ' / '}</Link>
            );
        });
    }, [pathSegments, entityNames, t]);

    return (
        <Breadcrumbs aria-label="breadcrumb">
            <Stack spacing={1} marginBottom={2} direction={'row'}>{crumbs}</Stack>
        </Breadcrumbs>
    )
}

export default withTranslation('route')(AlisaBreadcrumbs);