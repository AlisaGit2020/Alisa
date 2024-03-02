import { Property } from "@alisa-backend/real-estate/property/entities/property.entity"
import { propertyContext } from "@alisa-lib/alisa-contexts"
import DataService from "@alisa-lib/data-service"

export const getFirstProperty = async (propertyName: string | undefined) => {
    if (!propertyName) {
        const propertyDataService = new DataService<Property>({
            context: propertyContext,
            fetchOptions: {
                order: {
                    name: 'ASC'
                },
                limit: 1
            }
        })
        const properties = await propertyDataService.search()
        return properties[0].name
    }
    return ''
}

export const getPropertyNameById = async (propertyId: number): Promise<string> => {
    if (propertyId) {
        const propertyDataService = new DataService<Property>({
            context: propertyContext,
            fetchOptions: {
                where: {
                    id: propertyId
                },
                limit: 1
            }
        })
        const properties = await propertyDataService.search()        
        return properties[0].name
    }
    return ''
}

export const getPropertyIdByName = async (propertyName: string): Promise<number> => {
    if (propertyName) {
        const propertyDataService = new DataService<Property>({
            context: propertyContext,
            fetchOptions: {
                where: {
                    name: propertyName
                },
                limit: 1
            }
        })
        const properties = await propertyDataService.search()        
        return properties[0].id
    }
    return 0
}