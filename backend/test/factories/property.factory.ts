import { Property } from '@asset-backend/real-estate/property/entities/property.entity';
import { Address } from '@asset-backend/real-estate/address/entities/address.entity';
import {
  PropertyExternalSource,
  PropertyStatus,
  PropertyType,
} from '@asset-backend/common/types';

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
  apartmentType?: PropertyType;
  status?: PropertyStatus;
  externalSource?: PropertyExternalSource;
  externalSourceId?: string;
  rooms?: string;
  purchasePrice?: number;
  purchaseDate?: Date;
  purchaseLoan?: number;
  salePrice?: number;
  saleDate?: Date;
  debtShare?: number;
  maintenanceFee?: number;
  financialCharge?: number;
  monthlyRent?: number;
  waterCharge?: number;
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
  property.status = options.status ?? PropertyStatus.OWN;
  property.externalSource = options.externalSource;
  property.externalSourceId = options.externalSourceId;
  property.rooms = options.rooms;
  property.purchasePrice = options.purchasePrice;
  property.purchaseDate = options.purchaseDate;
  property.purchaseLoan = options.purchaseLoan;
  property.salePrice = options.salePrice;
  property.saleDate = options.saleDate;
  property.debtShare = options.debtShare;
  property.maintenanceFee = options.maintenanceFee;
  property.financialCharge = options.financialCharge;
  property.monthlyRent = options.monthlyRent;
  property.waterCharge = options.waterCharge;
  return property;
};
