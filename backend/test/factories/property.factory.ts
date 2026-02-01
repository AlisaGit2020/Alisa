import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';

export interface CreatePropertyOptions {
  id?: number;
  name?: string;
  size?: number;
  photo?: string;
  description?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  buildYear?: number;
  apartmentType?: string;
}

export const createProperty = (options: CreatePropertyOptions = {}): Property => {
  const property = new Property();
  property.id = options.id ?? 1;
  property.name = options.name ?? 'Test Property';
  property.size = options.size ?? 50;
  property.photo = options.photo;
  property.description = options.description;
  property.address = options.address;
  property.city = options.city;
  property.postalCode = options.postalCode;
  property.buildYear = options.buildYear;
  property.apartmentType = options.apartmentType;
  return property;
};
