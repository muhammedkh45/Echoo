import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";

export const postType = new GraphQLObjectType({
    name: "Post",
    fields: {
        _id: { type: new GraphQLNonNull(GraphQLID) },
        title: { type: new GraphQLNonNull(GraphQLString) },
        content: { type: new GraphQLNonNull(GraphQLString) },
        createdBy: { type: new GraphQLNonNull(GraphQLID) },
        createdAt: { type: new GraphQLNonNull(GraphQLString) },
        updatedAt: { type: new GraphQLNonNull(GraphQLString) },
    },
});
 