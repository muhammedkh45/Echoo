import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
} from "graphql";
import { GenderType } from "../../../DB/model/user.model";

export const getUserArgs = { id: { type: new GraphQLNonNull(GraphQLID) } };
export const createUserArgs = {
  id: { type: new GraphQLNonNull(GraphQLID) },
  name: { type: new GraphQLNonNull(GraphQLString) },
  email: { type: new GraphQLNonNull(GraphQLString) },
  password: { type: new GraphQLNonNull(GraphQLString) },
  gender: {
    type: new GraphQLNonNull(
      new GraphQLEnumType({
        name: "Gender",
        values: {
          male: { value: GenderType.male },
          female: { value: GenderType.female },
        },
      })
    ),
  },
};
