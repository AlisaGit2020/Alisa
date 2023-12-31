import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { PropertyService } from './property.service';
import { PropertyInputDto } from './dtos/property-input.dto';
import { AppModule } from 'src/app.module';
import { TestDatabaseModule } from 'src/test.module';

describe('PropertyService', () => {
  let service: PropertyService;
  let propertyRepository: Repository<Property>;
  let propertyRepository2: Repository<Property>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({        
        providers: [
        PropertyService,
        {
          provide: getRepositoryToken(Property),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<PropertyService>(PropertyService);
    propertyRepository = module.get<Repository<Property>>(
      getRepositoryToken(Property),
    );

  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of properties', async () => {
      const properties: Property[] = [
        {id: 12, name: 'Test'},
      ];
      jest.spyOn(propertyRepository, 'find').mockResolvedValueOnce(properties);

      expect(await service.findAll()).toBe(properties);
    });
  });

  describe('findOne', () => {
    it('should return a property by ID', async () => {
      const property: Property = {id: 12, name: 'Test'};
      
      jest.spyOn(propertyRepository, 'findOneBy').mockResolvedValueOnce(property);

      expect(await service.findOne(1)).toBe(property);

    });
  });
  
  describe('add', () => {
    it('should add a new property', async () => {
      const input: PropertyInputDto = {name: 'Test apartment'};
      let savedProperty: Property = new Property();
      savedProperty.id = 12;
      savedProperty.name = 'Test apartment'
      
      jest.spyOn(propertyRepository, 'save').mockResolvedValueOnce(savedProperty);
      const result = await service.add(input)  
      
      expect(result).toMatchObject(savedProperty);
    });
  });

  describe('update', () => {
    it('should update a property', async () => {
      const input: PropertyInputDto = {name: 'Test apartment2'};
      
      let savedProperty: Property = new Property();                
      savedProperty.id = 12
      savedProperty.name = 'Test apartment2'
      
      jest.spyOn(propertyRepository, 'findOneBy').mockResolvedValueOnce(savedProperty);
      jest.spyOn(propertyRepository, 'save').mockResolvedValueOnce(savedProperty);
      const result = await service.update(12, input)  
      
      expect(result).toMatchObject(savedProperty);
    });
  });

});
