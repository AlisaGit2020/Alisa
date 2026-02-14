import { Property } from '@alisa-backend/real-estate/property/entities/property.entity';
import { Address } from '@alisa-backend/real-estate/address/entities/address.entity';

export interface CreateAddressOptions {
  id?: number;
  street?: string;
  city?: string;
  postalCode?: string;
}

export interface CreatePropertyOptions {
  id?: number;
  name?: string;
  size?: number;
  photo?: string;
  description?: string;
  address?: CreateAddressOptions;
  buildYear?: number;
  apartmentType?: string;
}

export const createAddress = (options: CreateAddressOptions = {}): Address => {
  const address = new Address();
  address.id = options.id ?? 1;
  address.street = options.street;
  address.city = options.city;
  address.postalCode = options.postalCode;
  return address;
};

export const createProperty = (options: CreatePropertyOptions = {}): Property => {
  const property = new Property();
  property.id = options.id ?? 1;
  property.name = options.name ?? 'Test Property';
  property.size = options.size ?? 50;
  property.photo = options.photo;
  property.description = options.description;
  if (options.address) {
    property.address = createAddress(options.address);
  }
  property.buildYear = options.buildYear;
  property.apartmentType = options.apartmentType;
  return property;
};
