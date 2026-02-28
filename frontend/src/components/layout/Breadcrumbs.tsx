import { Breadcrumbs, Link, Stack, Tooltip, IconButton, Menu, MenuItem } from "@mui/material"
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { WithTranslation, withTranslation } from "react-i18next";
import { useLocation } from "react-router-dom"
import { useEffect, useState, useMemo } from "react";
import ApiClient from "@asset-lib/api-client";
import { useIsMobile } from "@asset-lib/hooks/useIsMobile";

// Constants for truncation
const DESKTOP_MAX_WIDTH = 180;
const MOBILE_MAX_WIDTH = 120;
const MOBILE_COLLAPSE_THRESHOLD = 3;

interface EntityNameCache {
    [key: string]: string;
}

interface AssetBreadcrumbsProps extends WithTranslation {
    /** Override mobile detection for testing */
    testIsMobile?: boolean;
}

function AssetBreadcrumbs({ t, testIsMobile }: AssetBreadcrumbsProps) {
    const location = useLocation()
    const [entityNames, setEntityNames] = useState<EntityNameCache>({});
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const isMobileHook = useIsMobile();
    const isMobile = testIsMobile !== undefined ? testIsMobile : isMobileHook;
    const menuOpen = Boolean(menuAnchorEl);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const maxWidth = isMobile ? MOBILE_MAX_WIDTH : DESKTOP_MAX_WIDTH;

    const pathSegments = useMemo(() =>
        location.pathname.split('/').filter(crumb => crumb !== '' && crumb !== '0' && crumb !== 'app'),
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

                    // Property status prefixes that indicate a property ID follows
                    const propertyContextSegments = ['edit', 'own', 'prospects', 'sold'];

                    // Determine which entity to fetch based on context
                    if (prevSegment && propertyContextSegments.includes(prevSegment)) {
                        // Look for portfolio context (properties are under /app/portfolio/own|prospects|sold)
                        const contextSegment = pathSegments.find(s => s === 'portfolio');
                        if (contextSegment) {
                            try {
                                const property = await ApiClient.get<{ id: number; name: string }>('real-estate/property', id);
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
        // Check if we're in an /app route to reconstruct proper links
        const isAppRoute = location.pathname.startsWith('/app');

        // Segments that require an ID parameter to be valid routes
        const segmentsRequiringId = ['edit', 'add'];

        return pathSegments.map((crumb, index) => {
            // Build the path from filtered segments
            let segmentPath = pathSegments.slice(0, index + 1).join('/');

            // If this segment requires an ID and next segment is numeric, include it
            const nextSegment = pathSegments[index + 1];
            if (segmentsRequiringId.includes(crumb) && nextSegment && /^\d+$/.test(nextSegment)) {
                segmentPath = pathSegments.slice(0, index + 2).join('/');
            }

            // Prepend /app if we're in an app route
            const linkPath = isAppRoute ? `/app/${segmentPath}` : `/${segmentPath}`;
            const prevSegment = index > 0 ? pathSegments[index - 1] : null;

            let displayText = t(decodeURIComponent(crumb));

            // If it's a numeric ID, try to get the entity name
            if (/^\d+$/.test(crumb)) {
                const cacheKey = `${prevSegment}-${crumb}`;
                if (entityNames[cacheKey]) {
                    displayText = entityNames[cacheKey];
                }
            }

            return {
                linkPath,
                displayText,
                key: index
            };
        });
    }, [pathSegments, entityNames, t, location.pathname]);

    const truncationStyle = {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: `${maxWidth}px`,
        display: 'inline-block'
    };

    // Mobile collapsing logic
    const shouldCollapse = isMobile && crumbs.length > MOBILE_COLLAPSE_THRESHOLD;

    const visibleCrumbs = useMemo(() => {
        const renderBreadcrumbLink = (crumb: { linkPath: string; displayText: string; key: number }, appendSeparator = true) => (
            <Tooltip key={crumb.key} title={crumb.displayText}>
                <Link
                    href={crumb.linkPath}
                    sx={truncationStyle}
                >
                    {crumb.displayText + (appendSeparator ? ' / ' : '')}
                </Link>
            </Tooltip>
        );

        if (!shouldCollapse) {
            return crumbs.map(crumb => renderBreadcrumbLink(crumb));
        }

        // Show first item, ellipsis button, then last 2 items
        const firstItem = crumbs[0];
        const lastTwoItems = crumbs.slice(-2);

        return [
            renderBreadcrumbLink(firstItem),
            <IconButton
                key="ellipsis"
                size="small"
                aria-label={t('showMoreBreadcrumbs')}
                onClick={handleMenuOpen}
                sx={{ padding: 0, mx: 0.5 }}
            >
                <MoreHorizIcon fontSize="small" />
            </IconButton>,
            ...lastTwoItems.map(crumb => renderBreadcrumbLink(crumb))
        ];
    }, [crumbs, shouldCollapse, truncationStyle, t, handleMenuOpen]);

    const collapsedItems = useMemo(() => {
        if (!shouldCollapse) return [];
        // Middle items (exclude first and last 2)
        return crumbs.slice(1, -2);
    }, [crumbs, shouldCollapse]);

    return (
        <>
            <Breadcrumbs aria-label="breadcrumb">
                <Stack spacing={1} marginBottom={2} direction={'row'} alignItems="center">
                    {visibleCrumbs}
                </Stack>
            </Breadcrumbs>
            <Menu
                anchorEl={menuAnchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
            >
                {collapsedItems.map((crumb) => (
                    <MenuItem
                        key={crumb.key}
                        component="a"
                        href={crumb.linkPath}
                        onClick={handleMenuClose}
                    >
                        {crumb.displayText}
                    </MenuItem>
                ))}
            </Menu>
        </>
    )
}

export default withTranslation('route')(AssetBreadcrumbs);