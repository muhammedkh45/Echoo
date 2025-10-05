import {
  DeleteResult,
  HydratedDocument,
  Model,
  ProjectionType,
  QueryOptions,
  RootFilterQuery,
  UpdateQuery,
  UpdateWriteOpResult,
} from "mongoose";

export abstract class DBRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) {}
  async create(data: Partial<TDocument>): Promise<HydratedDocument<TDocument>> {
    return this.model.create(data);
  }
  async findOne(
    filter: RootFilterQuery<TDocument>,
    select?: ProjectionType<TDocument>
  ): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOne(filter, select);
  }
  async find(
    filter: RootFilterQuery<TDocument>,
    select?: ProjectionType<TDocument>,
    options?: QueryOptions<TDocument>
  ): Promise<HydratedDocument<TDocument>[]> {
    return this.model.find(filter, select, options);
  }
  async updateOne(
    filter: RootFilterQuery<TDocument>,
    update: UpdateQuery<TDocument>
  ): Promise<UpdateWriteOpResult> {
    return await this.model.updateOne(filter, update);
  }
  async findOneAndUpdate(
    filter: RootFilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
    options: QueryOptions<TDocument> | null = { new: true }
  ): Promise<UpdateWriteOpResult | null> {
    return await this.model.findOneAndUpdate(filter, update, options);
  }
  async delteOne(filter: RootFilterQuery<TDocument>): Promise<DeleteResult> {
    return this.model.deleteOne(filter);
  }
}
