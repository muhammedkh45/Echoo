import { GraphQLList } from "graphql";
import postsServices from "../posts.services";
import { postType } from "./post.type";


class PostField {
  constructor() {}
  Query = () => {
    return {
      getPosts: {
        type: new GraphQLList(postType),
        resolve: postsServices.getPostsGQL,
      },
    };
  };
  Mutation = () => {
    return {
      createPost: {
        type: postType,
        // args: createPostArgs,
        // resolve: postsServices,
      },
    };
  };
}

export default new PostField();
