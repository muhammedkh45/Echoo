import { GraphQLList } from "graphql";
import { userType } from "./user.type";
import usersServices from "../users.services";
import { createUserArgs, getUserArgs } from "./user.args";

class UserField {
  constructor() {}
  Query = () => {
    return {
      getOneUser: {
        type: userType,
        args: getUserArgs,
        resolve: usersServices.getOneUser,
      },
      getUsers: {
        type: new GraphQLList(userType),
        resolve: usersServices.getUsers,
      },
    };
  };
  Mutation = () => {
    return {
      createUser: {
        type: userType,
        args: createUserArgs,
        resolve: usersServices.createUser,
      },
    };
  };
}

export default new UserField();
