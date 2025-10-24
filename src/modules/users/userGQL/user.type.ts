import { GraphQLEnumType, GraphQLID, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { GenderType } from "../../../DB/model/user.model";

export const userType = new GraphQLObjectType({
  name: "User",
  fields: {
    
    _id: { type: new GraphQLNonNull(GraphQLID) },
    fName: { type: new GraphQLNonNull(GraphQLString) },
    lName: { type: new GraphQLNonNull(GraphQLString) },
    userName: { type: new GraphQLNonNull(GraphQLString) },
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
  },
});
