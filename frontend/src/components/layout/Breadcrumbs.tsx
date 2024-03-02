import { Breadcrumbs, Link, Stack } from "@mui/material"
import { WithTranslation, withTranslation } from "react-i18next";
import { useLocation } from "react-router-dom"


function AlisaBreadcrumbs({ t }: WithTranslation) {
    const location = useLocation()
    let currentLink = '';

    const crumbs = location.pathname.split('/')
        .filter(crumb => crumb !== '' && crumb !== '0')
        .map((crumb, index) => {
            currentLink = `${currentLink}/${crumb}`            
            return (
                <Link key={index} href={currentLink}>{t(decodeURIComponent(crumb)) + ' / '}  </Link>
            )
        })
    return (
        <Breadcrumbs aria-label="breadcrumb">
            <Stack spacing={1} marginBottom={2} direction={'row'}>{crumbs}</Stack>
        </Breadcrumbs>
    )
}

export default withTranslation('route')(AlisaBreadcrumbs);