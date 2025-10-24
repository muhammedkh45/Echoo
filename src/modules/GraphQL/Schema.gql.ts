import { GraphQLObjectType, GraphQLSchema } from "graphql";

import UF from "../users/userGQL/user.fields";
import PF from "../posts/postGQL/post.fields";

export const schemaGQL = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: { ...UF.Query(), ...PF.Query() },
  }),
  mutation: new GraphQLObjectType({
    name: "Mutation",
    fields: { ...UF.Mutation(),... PF.Mutation()},
  }),
});
