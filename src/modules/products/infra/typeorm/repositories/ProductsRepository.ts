import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: { name },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productIds = products.map(product => product.id);
    const findProducts = await this.ormRepository.find({
      id: In(productIds),
    });

    return findProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const updateProduct = products.map(async product => {
      let existingProduct = await this.ormRepository.findOne(product.id);
      if (!existingProduct) {
        throw new AppError(
          `The product with id ${product.id} does not exist`,
          404,
        );
      } else {
        const newQuantity = existingProduct.quantity - product.quantity;
        if (newQuantity < 0) {
          throw new AppError(
            `Not enought of the product "${existingProduct.name} in stock"`,
            400,
          );
        }
        existingProduct = {
          ...existingProduct,
          quantity: newQuantity,
        };
      }
      return existingProduct;
    });

    const updatedProducts = await Promise.all(updateProduct);
    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
